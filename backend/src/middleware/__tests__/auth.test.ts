import { Request, Response, NextFunction } from 'express';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { authenticateToken, generateJWT } from '../auth';

// Mock axios and jwt
jest.mock('axios');
jest.mock('jsonwebtoken');

const mockedAxios = axios as jest.Mocked<typeof axios>;
const mockedJwt = jwt as jest.Mocked<typeof jwt>;

const mockUser = {
  login: 'testuser',
  id: 123,
  name: 'Test User',
  email: 'test@example.com'
};

describe('Auth Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRequest = {
      headers: {}
    };
    
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };
    
    mockNext = jest.fn();
  });

  describe('authenticateToken', () => {
    it('authenticates GitHub token successfully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer gho_testtoken'
      };

      mockedAxios.get.mockResolvedValue({
        data: mockUser
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer gho_testtoken',
          Accept: 'application/vnd.github.v3+json'
        }
      });

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('authenticates JWT token successfully', async () => {
      mockRequest.headers = {
        authorization: 'Bearer jwt_testtoken'
      };

      mockedJwt.verify.mockReturnValue(mockUser as any);

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedJwt.verify).toHaveBeenCalledWith('jwt_testtoken', 'test-secret');
      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });

    it('returns 401 when no token provided', async () => {
      mockRequest.headers = {};

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 401 when authorization header malformed', async () => {
      mockRequest.headers = {
        authorization: 'InvalidHeader'
      };

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Access token required' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when GitHub token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer gho_invalidtoken'
      };

      mockedAxios.get.mockRejectedValue(new Error('Unauthorized'));

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('returns 403 when JWT token is invalid', async () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid_jwt'
      };

      mockedJwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Invalid or expired token' });
      expect(mockNext).not.toHaveBeenCalled();
    });

    it('handles GitHub personal access tokens', async () => {
      mockRequest.headers = {
        authorization: 'Bearer ghp_testtoken'
      };

      mockedAxios.get.mockResolvedValue({
        data: mockUser
      });

      await authenticateToken(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockedAxios.get).toHaveBeenCalledWith('https://api.github.com/user', {
        headers: {
          Authorization: 'Bearer ghp_testtoken',
          Accept: 'application/vnd.github.v3+json'
        }
      });

      expect(mockRequest.user).toEqual(mockUser);
      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe('generateJWT', () => {
    it('generates JWT token with correct payload', () => {
      const mockToken = 'generated_jwt_token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const result = generateJWT(mockUser);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        {
          login: mockUser.login,
          id: mockUser.id,
          name: mockUser.name,
          email: mockUser.email
        },
        'test-secret',
        { expiresIn: '24h' }
      );

      expect(result).toBe(mockToken);
    });

    it('generates token with default secret when env var not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const mockToken = 'generated_jwt_token';
      mockedJwt.sign.mockReturnValue(mockToken as any);

      const result = generateJWT(mockUser);

      expect(mockedJwt.sign).toHaveBeenCalledWith(
        expect.any(Object),
        'your-secret-key',
        { expiresIn: '24h' }
      );

      process.env.JWT_SECRET = originalSecret;
    });
  });
});
