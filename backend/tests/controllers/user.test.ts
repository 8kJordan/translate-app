import { Response } from 'express';
import { getUserProfile, listUserTranslations, searchUserTranslations } from '@controllers/user';
import { AuthedRequest } from '@utils/authMiddleware';

jest.mock('@db/user.model', () => {
  const findOneMock = jest.fn();
  return {
    __esModule: true,
    User: { findOne: findOneMock },
    __mocks: { findOneMock },
  };
});

jest.mock('@db/translation.model', () => {
  const saveMock = jest.fn();
  const findMock = jest.fn();
  const countMock = jest.fn();
  const TranslationMock = jest.fn().mockImplementation((doc) => ({
    ...doc,
    save: saveMock,
  }));
  (TranslationMock as any).find = findMock;
  (TranslationMock as any).countDocuments = countMock;
  return {
    __esModule: true,
    Translation: TranslationMock,
    __mocks: { saveMock, findMock, countMock },
  };
});

const { __mocks: userModelMocks } = jest.requireMock('@db/user.model') as unknown as {
  __mocks: { findOneMock: jest.Mock };
};

const { __mocks: translationModelMocks } = jest.requireMock('@db/translation.model') as unknown as {
  __mocks: { saveMock: jest.Mock; findMock: jest.Mock; countMock: jest.Mock };
};

const userFindOneMock = userModelMocks.findOneMock;
const translationFindMock = translationModelMocks.findMock;
const translationCountMock = translationModelMocks.countMock;

type MockedResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

const createResponse = (): MockedResponse => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
}) as unknown as MockedResponse;

const createRequest = (overrides: Partial<AuthedRequest> = {}): AuthedRequest => ({
  body: {},
  params: {},
  query: {},
  userId: 'user-id',
  ...overrides,
} as AuthedRequest);

const createQueryChain = () => ({
  sort: jest.fn().mockReturnThis(),
  skip: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  lean: jest.fn(),
});

const mockUserFindOne = (value: any) => {
  const query = { lean: jest.fn().mockResolvedValue(value) };
  userFindOneMock.mockReturnValueOnce(query as any);
  return query;
};

const mockUserFindOneError = (error: Error) => {
  const query = { lean: jest.fn().mockRejectedValue(error) };
  userFindOneMock.mockReturnValueOnce(query as any);
  return query;
};

describe('user controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserProfile', () => {
    it('returns validation error when params are invalid', async () => {
      const req = createRequest({ params: { userEmail: 'invalid-email' } });
      const res = createResponse();

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns 404 when user cannot be found', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' } });
      const res = createResponse();
      mockUserFindOne(null);

      await getUserProfile(req, res);

      expect(userFindOneMock).toHaveBeenCalledWith({ email: 'user@example.com' });
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UserNotFoundError',
        desc: 'User not found',
      });
    });

    it('returns forbidden when requesting another users profile', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'other-id' });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ForbiddenError' });
    });

    it('returns sanitized user profile when requester matches', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'abc123' });
      const res = createResponse();
      mockUserFindOne({
        _id: 'abc123',
        email: 'user@example.com',
        firstName: 'Test',
        lastName: 'User',
        password: 'secret',
        refreshToken: 'token',
        updatedAt: new Date(),
        __v: 0,
      });

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          email: 'user@example.com',
          firstName: 'Test',
          lastName: 'User',
        },
      });
    });

    it('returns server error when database call fails', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' } });
      const res = createResponse();
      mockUserFindOneError(new Error('db'));

      await getUserProfile(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError' });
    });
  });

  describe('listUserTranslations', () => {
    it('returns validation error for invalid params', async () => {
      const req = createRequest({ params: { userEmail: 'invalid' } });
      const res = createResponse();

      await listUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns validation error for invalid pagination query', async () => {
      const req = createRequest({
        params: { userEmail: 'user@example.com' },
        query: { page: '0' },
      });
      const res = createResponse();

      await listUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns 404 when user is missing', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' } });
      const res = createResponse();
      mockUserFindOne(null);

      await listUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UserNotFoundError',
        desc: 'User not found',
      });
    });

    it('returns forbidden when requester is not owner', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'different' });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });

      await listUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ForbiddenError' });
    });

    it('returns paginated translations on success', async () => {
      const req = createRequest({
        params: { userEmail: 'user@example.com' },
        userId: 'user-id',
        query: { page: '2', limit: '5' },
      });
      const res = createResponse();
      const user = { _id: 'user-id', email: 'user@example.com' };
      mockUserFindOne(user);
      const queryChain = createQueryChain();
      queryChain.lean.mockResolvedValueOnce([{ sourceText: 'hello', translatedText: 'hola' }]);
      translationFindMock.mockReturnValueOnce(queryChain);
      translationCountMock.mockResolvedValueOnce(12);

      await listUserTranslations(req, res);

      expect(translationFindMock).toHaveBeenCalledWith({ user: user._id });
      expect(translationCountMock).toHaveBeenCalledWith({ user: user._id });
      expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(queryChain.skip).toHaveBeenCalledWith(5);
      expect(queryChain.limit).toHaveBeenCalledWith(5);
      expect(queryChain.select).toHaveBeenCalledWith('-__v');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: [{ sourceText: 'hello', translatedText: 'hola' }],
        meta: { page: 2, limit: 5, total: 12, pages: Math.ceil(12 / 5) },
      });
    });

    it('returns server error when query fails', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'user-id' });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });
      translationFindMock.mockImplementationOnce(() => {
        throw new Error('db');
      });

      await listUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError' });
    });
  });

  describe('searchUserTranslations', () => {
    it('returns validation error for invalid body', async () => {
      const req = createRequest({
        params: { userEmail: 'user@example.com' },
        body: { sourceText: '' },
      });
      const res = createResponse();

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns validation error for invalid params', async () => {
      const req = createRequest({ body: {}, params: { userEmail: 'invalid-email' } });
      const res = createResponse();

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns validation error for invalid pagination query', async () => {
      const req = createRequest({
        params: { userEmail: 'user@example.com' },
        body: {},
        query: { limit: '0' },
      });
      const res = createResponse();

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns 404 when user is missing', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, body: {} });
      const res = createResponse();
      mockUserFindOne(null);

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'UserNotFoundError',
        desc: 'User not found',
      });
    });

    it('returns forbidden when requester does not match user', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'other', body: {} });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ForbiddenError' });
    });

    it('returns filtered translations on success', async () => {
      const req = createRequest({
        params: { userEmail: 'user@example.com' },
        userId: 'user-id',
        body: { sourceText: 'hel', to: 'es' },
        query: { page: '1', limit: '10' },
      });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });
      const queryChain = createQueryChain();
      queryChain.lean.mockResolvedValueOnce([{ sourceText: 'hello', translatedText: 'hola' }]);
      translationFindMock.mockReturnValueOnce(queryChain);
      translationCountMock.mockResolvedValueOnce(3);

      await searchUserTranslations(req, res);

      expect(translationFindMock).toHaveBeenCalledWith({
        user: 'user-id',
        to: 'es',
        sourceText: { $regex: 'hel', $options: 'i' },
      });
      expect(translationCountMock).toHaveBeenCalledWith({
        user: 'user-id',
        to: 'es',
        sourceText: { $regex: 'hel', $options: 'i' },
      });
      expect(queryChain.sort).toHaveBeenCalledWith({ createdAt: -1 });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        data: [{ sourceText: 'hello', translatedText: 'hola' }],
        meta: { page: 1, limit: 10, total: 3, pages: Math.ceil(3 / 10) },
      });
    });

    it('returns server error when search query fails', async () => {
      const req = createRequest({ params: { userEmail: 'user@example.com' }, userId: 'user-id', body: {} });
      const res = createResponse();
      mockUserFindOne({ _id: 'user-id', email: 'user@example.com' });
      translationFindMock.mockImplementationOnce(() => {
        throw new Error('db');
      });

      await searchUserTranslations(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ status: 'error', errType: 'ServerError' });
    });
  });
});
