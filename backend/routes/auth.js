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

// Login user (returns Firebase ID token)
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Note: This endpoint would typically be handled by the client-side Firebase Auth
    // The client gets the ID token and sends it to the backend for verification
    res.status(200).json({
      message: 'Login should be handled by client-side Firebase Auth',
      note: 'Send the Firebase ID token to /auth/verify for backend verification',
    });
  } catch (error) {
    console.error('❌ Login failed:', error);
    res.status(400).json({ error: error.message });
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
