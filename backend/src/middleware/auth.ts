import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import axios from 'axios';
import { GitHubUser } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const authenticateToken = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Handle test user token
    if (token === 'test-token-12345') {
      req.user = {
        login: 'testuser',
        id: 12345,
        name: 'Test User',
        email: 'test@example.com'
      } as GitHubUser;
      next();
      return;
    }

    // For GitHub OAuth tokens, we need to verify with GitHub
    if (token.startsWith('gho_') || token.startsWith('ghp_')) {
      const response = await axios.get('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json'
        }
      });

      req.user = response.data as GitHubUser;
      next();
    } else {
      // For JWT tokens (our own)
      const decoded = jwt.verify(token, JWT_SECRET) as GitHubUser;
      req.user = decoded;
      next();
    }
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const generateJWT = (user: GitHubUser): string => {
  return jwt.sign(
    {
      login: user.login,
      id: user.id,
      name: user.name,
      email: user.email
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}; 
