const SUCCESS_TEMPLATE = '<success>';
const FAILURE_TEMPLATE = '<failure>';

const userFindByIdMock = jest.fn();
const userFindOneMock = jest.fn();

jest.mock('@node-rs/argon2', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
    hash: jest.fn(),
  },
}));

jest.mock('jsonwebtoken', () => ({
  __esModule: true,
  default: {
    verify: jest.fn(),
    sign: jest.fn(),
  },
}));

jest.mock('@schemas/auth', () => ({
  __esModule: true,
  loginAttempt: { safeParse: jest.fn() },
  registerAttempt: { safeParse: jest.fn() },
}));

jest.mock('@utils/emailVerification', () => ({
  __esModule: true,
  sendVerificationEmail: jest.fn(),
}));

jest.mock('@utils/testEmailVerification', () => ({
  __esModule: true,
  sendTestEmail: jest.fn(),
}));

jest.mock('@utils/jwt', () => ({
  __esModule: true,
  generateAuthTokens: jest.fn(),
  setAuthCookies: jest.fn(),
  generateAccessToken: jest.fn(),
  setAccessToken: jest.fn(),
  clearSessionCookies: jest.fn(),
}));

jest.mock('@utils/redirectTemplate', () => ({
  __esModule: true,
  redirectTemplateSuccess: jest.fn(() => SUCCESS_TEMPLATE),
  redirectTemplateFailure: jest.fn(() => FAILURE_TEMPLATE),
}));

jest.mock('@db/user.model', () => {
  const UserMock = jest.fn().mockImplementation((doc) => ({
    ...doc,
    isVerified: doc?.isVerified ?? false,
    save: jest.fn().mockResolvedValue(undefined),
  }));
  (UserMock as any).findById = userFindByIdMock;
  (UserMock as any).findOne = userFindOneMock;
  return {
    __esModule: true,
    User: UserMock,
  };
});

import { Request, Response } from 'express';
import { authenticate, login, register, verifyEmail, refreshAccessToken, logout } from '@controllers/auth';
import { User } from '@db/user.model';
import argon2 from '@node-rs/argon2';
import jwt from 'jsonwebtoken';
import { loginAttempt, registerAttempt } from '@schemas/auth';
import { sendVerificationEmail } from '@utils/emailVerification';
import { sendTestEmail } from '@utils/testEmailVerification';
import { generateAuthTokens, setAuthCookies, generateAccessToken, setAccessToken, clearSessionCookies } from '@utils/jwt';

type MockedResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
  send: jest.Mock;
};

describe('auth controller', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    userFindByIdMock.mockReset();
    userFindOneMock.mockReset();
    (User as unknown as jest.Mock).mockImplementation((doc) => ({
      ...doc,
      isVerified: doc?.isVerified ?? false,
      save: jest.fn().mockResolvedValue(undefined),
    }));
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createResponse = (): MockedResponse => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
      cookie: jest.fn().mockReturnThis(),
      clearCookie: jest.fn().mockReturnThis(),
    } as unknown as MockedResponse;

    return res;
  };

  const createRequest = (overrides: Partial<Request> = {}): Request => ({
    body: {},
    params: {},
    cookies: {},
    ...overrides,
  } as Request);

  describe('authenticate', () => {
    it('responds with unauthorized when access token is missing', async () => {
      const req = createRequest();
      const res = createResponse();

      await authenticate(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'UnauthorizedError' });
    });

    it('returns server error when auth secret is missing', async () => {
      const req = createRequest({ cookies: { accessToken: 'token' } });
      const res = createResponse();
      process.env.AUTH_SECRET = '';

      await authenticate(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError', desc: 'Missing AUTH_SECRET' });
    });

    it('rejects requests for unknown users', async () => {
      const req = createRequest({ cookies: { accessToken: 'token' } });
      const res = createResponse();
      process.env.AUTH_SECRET = 'secret';
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      userFindByIdMock.mockResolvedValue(null);

      await authenticate(req, res);

      expect(userFindByIdMock).toHaveBeenCalledWith('user-id');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'UnauthorizedError' });
    });

    it('returns user profile when authentication succeeds', async () => {
      const req = createRequest({ cookies: { accessToken: 'token' } });
      const res = createResponse();
      process.env.AUTH_SECRET = 'secret';
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      userFindByIdMock.mockResolvedValue({
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
      });

      await authenticate(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
        isAuthenticated: true,
      });
    });
  });

  describe('login', () => {
    const safeParse = loginAttempt.safeParse as jest.Mock;

    it('rejects invalid payloads using schema feedback', async () => {
      const req = createRequest({ body: { email: 'invalid' } });
      const res = createResponse();
      safeParse.mockReturnValueOnce({ success: false, error: { issues: [{ path: ['email'], code: 'invalid', message: 'bad' }] } });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: [{ field: ['email'], code: 'invalid', message: 'bad' }],
        message: 'Incorrect schema in request body',
      });
    });

    it('fails authentication when user does not exist', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!' } });
      const res = createResponse();
      safeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue(null);

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UnauthorizedError',
        userExists: false,
        isAuthenticated: false,
      });
    });

    it('blocks login for unverified users', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!' } });
      const res = createResponse();
      safeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue({
        email: 'user@example.com',
        isVerified: false,
      });

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UnauthorizedError',
        isAuthenticated: false,
        desc: 'User has not verified their email',
      });
    });

    it('rejects requests with incorrect passwords', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!' } });
      const res = createResponse();
      safeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue({
        email: 'user@example.com',
        password: 'hashed',
        isVerified: true,
      });
      (argon2.verify as jest.Mock).mockResolvedValueOnce(false);

      await login(req, res);

      expect((argon2.verify as jest.Mock)).toHaveBeenCalledWith('hashed', 'Password1!');
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UnauthorizedError',
        isAuthenticated: false,
      });
    });

    it('returns auth tokens when credentials are valid', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!' } });
      const res = createResponse();
      const save = jest.fn().mockResolvedValue(undefined);
      const userRecord = {
        _id: 'user-id',
        email: 'user@example.com',
        password: 'hashed',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
        isVerified: true,
        save,
      };
      safeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue(userRecord);
      (argon2.verify as jest.Mock).mockResolvedValueOnce(true);
      (argon2.hash as jest.Mock).mockResolvedValueOnce('hashed-refresh');
      (generateAuthTokens as jest.Mock).mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });

      await login(req, res);

      expect((argon2.hash as jest.Mock)).toHaveBeenCalledWith('refresh');
      expect(save).toHaveBeenCalled();
      expect(setAuthCookies).toHaveBeenCalledWith(res, 'access', 'refresh');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        phone: '123',
        isAuthenticated: true,
      });
    });

    it('reports server errors during login', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!' } });
      const res = createResponse();
      safeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockRejectedValue(new Error('db error'));

      await login(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError' });
    });
  });

  describe('register', () => {
    const registerSafeParse = registerAttempt.safeParse as jest.Mock;

    beforeEach(() => {
      process.env.EMAIL_VERIFICATION_SECRET = 'email-secret';
      process.env.EMAIL_VERIFICATION_EXPIRATION = '1h';
      process.env.NODE_ENV = 'development';
    });

    it('validates registration payloads', async () => {
      const req = createRequest({ body: {} });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: false, error: { issues: [{ path: ['email'], code: 'invalid', message: 'bad' }] } });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: [{ field: ['email'], code: 'invalid', message: 'bad' }],
        message: 'Incorrect schema in request body',
      });
    });

    it('prevents duplicate registrations', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!', phone: '123', firstName: 'Test', lastName: 'User' } });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue({ email: 'user@example.com' });

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'RegistrationError',
        userExists: true,
        desc: 'Email already in use',
      });
    });

    it('sends verification email in development', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!', phone: '123', firstName: 'Test', lastName: 'User' } });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'user-id',
        email: 'user@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(undefined),
      }));
      (jwt.sign as jest.Mock).mockReturnValue('verification-token');

      await register(req, res);

      expect(User).toHaveBeenCalledWith(req.body);
      expect(sendTestEmail).toHaveBeenCalledWith('verification-token');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success', message: 'Sent Email Verification' });
    });

    it('sends production verification email when configured', async () => {
      process.env.NODE_ENV = 'production';
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!', phone: '123', firstName: 'Test', lastName: 'User' } });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'user-id',
        email: 'user@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(undefined),
      }));
      (jwt.sign as jest.Mock).mockReturnValue('verification-token');

      await register(req, res);

      expect(sendVerificationEmail).toHaveBeenCalledWith({ to: 'user@example.com', from: 'noreply@group9-contacts.com' }, expect.stringContaining('verification-token'));
      expect(res.status).toHaveBeenCalledWith(200);
    });

    it('returns server error for unsupported environments', async () => {
      process.env.NODE_ENV = 'test';
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!', phone: '123', firstName: 'Test', lastName: 'User' } });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockResolvedValue(null);
      (User as unknown as jest.Mock).mockImplementation(() => ({
        _id: 'user-id',
        email: 'user@example.com',
        isVerified: false,
        save: jest.fn().mockResolvedValue(undefined),
      }));
      (jwt.sign as jest.Mock).mockReturnValue('verification-token');

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError', desc: 'Failed to create user' });
    });

    it('surfaces unexpected errors during registration', async () => {
      const req = createRequest({ body: { email: 'user@example.com', password: 'Password1!', phone: '123', firstName: 'Test', lastName: 'User' } });
      const res = createResponse();
      registerSafeParse.mockReturnValueOnce({ success: true, data: req.body });
      userFindOneMock.mockRejectedValue(new Error('db error'));

      await register(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError', desc: 'Failed to create user' });
    });
  });

  describe('verifyEmail', () => {
    beforeEach(() => {
      process.env.EMAIL_VERIFICATION_SECRET = 'secret';
    });

    it('redirects with failure when token cannot be verified', async () => {
      const req = createRequest({ params: { token: 'bad' } as any });
      const res = createResponse();
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.send).toHaveBeenCalledWith(FAILURE_TEMPLATE);
    });

    it('fails verification for unknown users', async () => {
      const req = createRequest({ params: { token: 'token' } as any });
      const res = createResponse();
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id', email: 'user@example.com' });
      userFindByIdMock.mockResolvedValue(null);

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.send).toHaveBeenCalledWith(FAILURE_TEMPLATE);
    });

    it('acknowledges already verified users', async () => {
      const req = createRequest({ params: { token: 'token' } as any });
      const res = createResponse();
      const user = { email: 'user@example.com', isVerified: true };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id', email: 'user@example.com' });
      userFindByIdMock.mockResolvedValue(user);

      await verifyEmail(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(SUCCESS_TEMPLATE);
    });

    it('verifies users and issues new tokens', async () => {
      const req = createRequest({ params: { token: 'token' } as any });
      const res = createResponse();
      const save = jest.fn().mockResolvedValue(undefined);
      const user = { email: 'user@example.com', isVerified: false, save };
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id', email: 'user@example.com' });
      userFindByIdMock.mockResolvedValue(user);
      (generateAuthTokens as jest.Mock).mockReturnValue({ accessToken: 'access', refreshToken: 'refresh' });
      (argon2.hash as jest.Mock).mockResolvedValue('hashed-refresh');

      await verifyEmail(req, res);

      expect(user.isVerified).toBe(true);
      expect((argon2.hash as jest.Mock)).toHaveBeenCalledWith('refresh');
      expect(save).toHaveBeenCalled();
      expect(setAuthCookies).toHaveBeenCalledWith(res, 'access', 'refresh');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.send).toHaveBeenCalledWith(SUCCESS_TEMPLATE);
    });
  });

  describe('refreshAccessToken', () => {
    it('returns unauthorized when refresh token is missing', async () => {
      const req = createRequest();
      const res = createResponse();

      await refreshAccessToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'UnauthorizedError' });
    });

    it('rejects invalid refresh tokens', async () => {
      const req = createRequest({ cookies: { refreshToken: 'bad' } });
      const res = createResponse();
      (jwt.verify as jest.Mock).mockImplementation(() => { throw new Error('invalid'); });

      await refreshAccessToken(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'UnauthorizedError' });
    });

    it('issues a new access token when refresh token is valid', async () => {
      const req = createRequest({ cookies: { refreshToken: 'good' } });
      const res = createResponse();
      (jwt.verify as jest.Mock).mockReturnValue({ userId: 'user-id' });
      (generateAccessToken as jest.Mock).mockReturnValue('new-access');

      await refreshAccessToken(req, res);

      expect(generateAccessToken).toHaveBeenCalledWith('user-id');
      expect(setAccessToken).toHaveBeenCalledWith(res, 'new-access');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success' });
    });
  });

  describe('logout', () => {
    it('clears session cookies on logout', async () => {
      const req = createRequest();
      const res = createResponse();

      await logout(req, res);

      expect(clearSessionCookies).toHaveBeenCalledWith(res);
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({ status: 'success' });
    });

    it('surfaces logout failures', async () => {
      const req = createRequest();
      const res = createResponse();
      (clearSessionCookies as jest.Mock).mockImplementation(() => { throw new Error('oops'); });

      await logout(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'LogoutError' });
    });
  });
});
