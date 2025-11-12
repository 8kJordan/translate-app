import { Response } from 'express';
import axios from 'axios';
import { translateText } from '@controllers/translate';
import { AuthedRequest } from '@utils/authMiddleware';
import { Translation } from '@db/translation.model';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    post: jest.fn(),
  },
}));

jest.mock('uuid', () => ({
  __esModule: true,
  v4: jest.fn(() => 'uuid'),
}));

jest.mock('@db/translation.model', () => {
  const saveMock = jest.fn().mockResolvedValue(undefined);
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
    __mocks: {
      saveMock,
      findMock,
      countMock,
    },
  };
});

const { __mocks: translationModelMocks } = jest.requireMock('@db/translation.model') as unknown as {
  __mocks: {
    saveMock: jest.Mock;
    findMock: jest.Mock;
    countMock: jest.Mock;
  };
};

const translationSaveMock = translationModelMocks.saveMock;
const translationFindMock = translationModelMocks.findMock;
const translationCountMock = translationModelMocks.countMock;

type MockedResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

describe('translate controller', () => {
  const originalEnv = process.env;
  const axiosPost = axios.post as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    translationSaveMock.mockClear();
    process.env = { ...originalEnv };
    process.env.AZURE_API_KEY = 'api-key';
    process.env.AZURE_REGION = 'region';
    process.env.TRANSLATION_URL = 'https://example.com';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createResponse = (): MockedResponse => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as MockedResponse;

  const createRequest = (overrides: Partial<AuthedRequest> = {}): AuthedRequest => ({
    body: {},
    params: {},
    query: {},
    userId: 'user-1',
    ...overrides,
  } as AuthedRequest);

  it('returns server error when env validation fails', async () => {
    delete process.env.TRANSLATION_URL;
    const req = createRequest();
    const res = createResponse();

    await translateText(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errType: 'ServerError',
      desc: 'Failed to translate text',
    });
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('returns validation error when request body is invalid', async () => {
    const req = createRequest({ body: { text: '' } });
    const res = createResponse();

    await translateText(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errType: 'SchemaValidationErr',
      errors: expect.any(Array),
    });
    expect(axiosPost).not.toHaveBeenCalled();
  });

  it('propagates client errors from Azure translate API', async () => {
    const req = createRequest({ body: { text: 'hello', to: 'es', from: 'en' } });
    const res = createResponse();
    axiosPost.mockRejectedValue({
      response: {
        status: 400,
        data: { error: { message: 'Invalid language' } },
      },
    });

    await translateText(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errType: 'BadRequestError',
      desc: 'Invalid language',
    });
  });

  it('stores translation and returns success response', async () => {
    const req = createRequest({ body: { text: 'hello', to: 'es', from: 'en' } });
    const res = createResponse();
    axiosPost.mockResolvedValue({
      data: [
        {
          translations: [{ text: 'hola', to: 'es' }],
        },
      ],
    });

    await translateText(req, res);

    expect(axiosPost).toHaveBeenCalledWith(
      'https://example.com/translate',
      [
        {
          text: 'hello',
        },
      ],
      expect.objectContaining({
        headers: expect.objectContaining({
          'Ocp-Apim-Subscription-Key': 'api-key',
          'Ocp-Apim-Subscription-Region': 'region',
        }),
        params: { 'api-version': '3.0', from: 'en', to: 'es' },
        responseType: 'json',
      }),
    );
    expect((Translation as unknown as jest.Mock).mock.calls[0][0]).toEqual({
      user: 'user-1',
      sourceText: 'hello',
      translatedText: 'hola',
      from: 'en',
      to: 'es',
    });
    expect(translationSaveMock).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      status: 'success',
      sourceText: 'hello',
      translatedText: 'hola',
      from: 'en',
      to: 'es',
    });
  });

  it('returns server error when saving translation fails', async () => {
    const req = createRequest({ body: { text: 'hello', to: 'es', from: 'en' } });
    const res = createResponse();
    axiosPost.mockResolvedValue({
      data: [
        {
          translations: [{ text: 'hola', to: 'es' }],
        },
      ],
    });
    translationSaveMock.mockRejectedValueOnce(new Error('db error'));

    await translateText(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      status: 'error',
      errType: 'ServerError',
      desc: 'Failed to translate text',
    });
  });
});
