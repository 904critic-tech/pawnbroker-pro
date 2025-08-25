import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ 
          error: 'Missing required fields',
          message: 'Email and password are required'
        });
      }

      // TODO: Add database connection here
      // For now, return a mock response
      // In production, you would:
      // 1. Find user by email in database
      // 2. Compare password with bcrypt.compare()
      // 3. Generate JWT token
      
      // Mock user data
      const mockUser = {
        id: 'mock-user-id',
        username: 'demo_user',
        email: email,
        isArtist: false,
        referralCode: 'DEMO123',
        createdAt: new Date().toISOString()
      };

      // Generate JWT token
      const token = jwt.sign(
        { userId: mockUser.id, email: mockUser.email },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      res.status(200).json({
        message: 'Login successful',
        user: mockUser,
        token
      });

    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ 
        error: 'Login failed',
        message: 'An error occurred during login'
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}
