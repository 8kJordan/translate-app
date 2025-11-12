import { Request, Response } from 'express';
import axios from 'axios';
import { supportedLanguages, getLanguageCode } from '@controllers/language';

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
  },
}));

type MockedResponse = Response & {
  status: jest.Mock;
  json: jest.Mock;
};

describe('language controller', () => {
  const originalEnv = process.env;
  const axiosGet = axios.get as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  const createResponse = (): MockedResponse => ({
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
  }) as unknown as MockedResponse;

  const createRequest = (overrides: Partial<Request> = {}): Request => ({
    body: {},
    params: {},
    query: {},
    ...overrides,
  } as Request);

  describe('supportedLanguages', () => {
    it('returns 500 when TRANSLATION_URL env is missing', async () => {
      delete process.env.TRANSLATION_URL;
      const req = createRequest();
      const res = createResponse();

      await supportedLanguages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'ServerError',
      });
      expect(axiosGet).not.toHaveBeenCalled();
    });

    it('fetches supported languages from Azure and returns success response', async () => {
      process.env.TRANSLATION_URL = 'https://example.com';
      const req = createRequest();
      const res = createResponse();
      const translationData = {
        translation: {
          en: { name: 'English', nativeName: 'English', dir: 'ltr' },
        },
      };
      axiosGet.mockResolvedValue({ data: translationData });

      await supportedLanguages(req, res);

      expect(axiosGet).toHaveBeenCalledWith('https://example.com/languages', {
        params: { 'api-version': '3.0' },
      });
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        supportedLanguages: translationData.translation,
      });
    });

    it('returns server error when Azure call fails', async () => {
      process.env.TRANSLATION_URL = 'https://example.com';
      const req = createRequest();
      const res = createResponse();
      axiosGet.mockRejectedValue(new Error('network'));

      await supportedLanguages(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'ServerError',
      });
    });
  });

  describe('getLanguageCode', () => {
    beforeEach(() => {
      process.env.TRANSLATION_URL = 'https://example.com';
    });

    it('returns validation error when params are invalid', async () => {
      const req = createRequest({ params: {} });
      const res = createResponse();

      await getLanguageCode(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'SchemaValidationErr',
        errors: expect.any(Array),
      });
    });

    it('returns the matching language code when found', async () => {
      const req = createRequest({ params: { language: 'english' } });
      const res = createResponse();
      axiosGet.mockResolvedValue({
        data: {
          translation: {
            en: { name: 'English', nativeName: 'English', dir: 'ltr' },
            es: { name: 'Spanish', nativeName: 'Español', dir: 'ltr' },
          },
        },
      });

      await getLanguageCode(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith({
        status: 'success',
        code: 'en',
      });
    });

    it('returns server error when fetching language codes fails', async () => {
      const req = createRequest({ params: { language: 'english' } });
      const res = createResponse();
      axiosGet.mockRejectedValue(new Error('network'));

      await getLanguageCode(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        status: 'error',
        errType: 'ServerError',
      });
    });
  });
});
