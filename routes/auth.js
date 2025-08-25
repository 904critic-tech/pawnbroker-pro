const express = require('express');
const router = express.Router();
const FirebaseService = require('../services/FirebaseService');

// Register new user
router.post('/register', async (req, res) => {
  try {
    const { email, password, displayName } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const userData = {
      email,
      password,
      displayName: displayName || null,
    };

    const user = await FirebaseService.createUser(userData);
    
    console.log('✅ User registered successfully:', user.email);
    res.status(201).json({
      message: 'User registered successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
      },
    });
  } catch (error) {
    console.error('❌ Registration failed:', error);
    res.status(400).json({ error: error.message });
  }
});

// Login user (client-side Firebase Auth)
router.post('/login', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'Firebase ID token is required' });
    }

    // Verify the Firebase ID token
    const decodedToken = await FirebaseService.verifyToken(idToken);
    
    // Generate a custom token for additional security
    const customToken = await FirebaseService.createCustomToken(decodedToken.uid);
    
    console.log('✅ User logged in successfully:', decodedToken.email);
    res.status(200).json({
      message: 'Login successful',
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.emailVerified,
      },
      customToken: customToken,
    });
  } catch (error) {
    console.error('❌ Login failed:', error);
    res.status(401).json({ error: 'Invalid authentication token' });
  }
});

// Verify Firebase ID token
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;

    if (!idToken) {
      return res.status(400).json({ error: 'ID token is required' });
    }

    const decodedToken = await FirebaseService.verifyToken(idToken);
    
    console.log('✅ Token verified successfully for user:', decodedToken.email);
    res.status(200).json({
      message: 'Token verified successfully',
      user: decodedToken,
    });
  } catch (error) {
    console.error('❌ Token verification failed:', error);
    res.status(401).json({ error: error.message });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    // Verify the refresh token
    const decodedToken = await FirebaseService.verifyToken(refreshToken);
    
    // Generate new access token
    const newAccessToken = await FirebaseService.createCustomToken(decodedToken.uid);
    
    // Generate new refresh token
    const newRefreshToken = await FirebaseService.createCustomToken(decodedToken.uid, { 
      purpose: 'refresh',
      expiresIn: '7d'
    });
    
    console.log('✅ Token refreshed successfully for user:', decodedToken.email);
    res.status(200).json({
      message: 'Token refreshed successfully',
      token: newAccessToken,
      refreshToken: newRefreshToken,
      user: decodedToken,
    });
  } catch (error) {
    console.error('❌ Token refresh failed:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Update user profile
router.put('/profile', FirebaseService.authenticateToken, async (req, res) => {
  try {
    const { displayName, email, photoURL } = req.body;
    const uid = req.user.uid;

    const updateData = {};
    if (displayName !== undefined) updateData.displayName = displayName;
    if (email !== undefined) updateData.email = email;
    if (photoURL !== undefined) updateData.photoURL = photoURL;

    const user = await FirebaseService.updateUser(uid, updateData);
    
    console.log('✅ User profile updated successfully:', user.email);
    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
      },
    });
  } catch (error) {
    console.error('❌ Profile update failed:', error);
    res.status(400).json({ error: error.message });
  }
});

// Delete user account
router.delete('/account', FirebaseService.authenticateToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    await FirebaseService.deleteUser(uid);
    
    console.log('✅ User account deleted successfully:', uid);
    res.status(200).json({ message: 'Account deleted successfully' });
  } catch (error) {
    console.error('❌ Account deletion failed:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get current user profile
router.get('/profile', FirebaseService.authenticateToken, async (req, res) => {
  try {
    const uid = req.user.uid;
    
    // Get user data from Firebase Auth
    const userRecord = await FirebaseService.auth.getUser(uid);
    
    res.status(200).json({
      user: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
        emailVerified: userRecord.emailVerified,
        createdAt: userRecord.metadata.creationTime,
        lastSignIn: userRecord.metadata.lastSignInTime,
      },
    });
  } catch (error) {
    console.error('❌ Get profile failed:', error);
    res.status(400).json({ error: error.message });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Firebase Auth service is running',
    timestamp: new Date().toISOString()
  });
});

module.exports = router;
