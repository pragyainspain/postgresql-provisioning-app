import express from 'express';
import axios from 'axios';
import { generateJWT } from '../middleware/auth';
import { GitHubUser } from '../types';

const router = express.Router();

const GITHUB_CLIENT_ID = process.env.GITHUB_CLIENT_ID || 'Ov23liGWm0JnYpvIqNZS';
const GITHUB_CLIENT_SECRET = process.env.GITHUB_CLIENT_SECRET || '90d4979465d72d78f59851fc043bd1ec543a0eea';

// GET /api/v1/auth/github - Get GitHub OAuth URL
router.get('/github', (req, res) => {
  const redirectUri = `${req.protocol}://${req.get('host')}/api/v1/auth/github/callback`;
  const scope = 'user:email';
  const state = Math.random().toString(36).substring(2, 15);
  
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${scope}&state=${state}`;
  
  res.json({ 
    authUrl: githubAuthUrl,
    state 
  });
});

// GET /api/v1/auth/github/callback - Handle GitHub OAuth callback
router.get('/github/callback', async (req, res) => {
  const { code, state } = req.query;

  if (!code) {
    return res.status(400).json({ error: 'Authorization code required' });
  }

  try {
    // Exchange code for access token
    const tokenResponse = await axios.post('https://github.com/login/oauth/access_token', {
      client_id: GITHUB_CLIENT_ID,
      client_secret: GITHUB_CLIENT_SECRET,
      code: code as string
    }, {
      headers: {
        Accept: 'application/json'
      }
    });

    const accessToken = tokenResponse.data.access_token;

    if (!accessToken) {
      return res.status(400).json({ error: 'Failed to get access token' });
    }

    // Get user info from GitHub
    const userResponse = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const githubUser: GitHubUser = userResponse.data;

    // Generate our own JWT
    const jwt = generateJWT(githubUser);

    // Redirect back to frontend with token
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/auth/callback?token=${jwt}&user=${encodeURIComponent(JSON.stringify(githubUser))}`);

  } catch (error) {
    console.error('GitHub OAuth error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
});

// POST /api/v1/auth/verify - Verify token and get user info
router.post('/verify', async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Token required' });
  }

  try {
    // Handle test user token
    if (token === 'test-token-12345') {
      const testUser: GitHubUser = {
        login: 'testuser',
        id: 12345,
        name: 'Test User',
        email: 'test@example.com'
      };
      res.json({ user: testUser, valid: true });
      return;
    }

    // Try to get user info from GitHub using the token
    const response = await axios.get('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github.v3+json'
      }
    });

    const user: GitHubUser = response.data;
    res.json({ user, valid: true });

  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ error: 'Invalid token', valid: false });
  }
});

export default router; 
