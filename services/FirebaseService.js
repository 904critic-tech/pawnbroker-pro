const admin = require('firebase-admin');
const path = require('path');

class FirebaseService {
  static isInitialized = false;

  constructor() {
    // Initialize Firebase Admin SDK only if credentials are available
    if (!admin.apps.length) {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY;
      const storageBucket = process.env.FIREBASE_STORAGE_BUCKET;

      // Check if all required Firebase credentials are provided
      if (projectId && clientEmail && privateKey && storageBucket && 
          privateKey !== 'your-firebase-private-key' && 
          clientEmail !== 'your-firebase-client-email') {
        try {
          admin.initializeApp({
            credential: admin.credential.cert({
              projectId: projectId,
              clientEmail: clientEmail,
              privateKey: privateKey.replace(/\\n/g, '\n'),
            }),
            storageBucket: storageBucket,
          });
          console.log('✅ Firebase Admin SDK initialized successfully');
          this.isInitialized = true;
          FirebaseService.isInitialized = true;
        } catch (error) {
          console.error('❌ Firebase Admin SDK initialization failed:', error);
          this.isInitialized = false;
          FirebaseService.isInitialized = false;
        }
      } else {
        console.log('⚠️ Firebase credentials not configured - Firebase features will be disabled');
        this.isInitialized = false;
        FirebaseService.isInitialized = false;
      }
    } else {
      this.isInitialized = true;
      FirebaseService.isInitialized = true;
    }

    // Initialize Firebase services only if SDK is initialized
    if (this.isInitialized) {
      this.auth = admin.auth();
      this.storage = admin.storage();
      this.bucket = this.storage.bucket();
    }
  }

  // Authentication methods
  async verifyToken(idToken) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - authentication unavailable');
    }
    
    try {
      const decodedToken = await this.auth.verifyIdToken(idToken);
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified,
      };
    } catch (error) {
      console.error('❌ Firebase token verification failed:', error);
      throw new Error('Invalid authentication token');
    }
  }

  async createUser(userData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - user creation unavailable');
    }
    
    try {
      const userRecord = await this.auth.createUser({
        email: userData.email,
        password: userData.password,
        displayName: userData.displayName,
      });
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
      };
    } catch (error) {
      console.error('❌ Firebase user creation failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signInWithEmailAndPassword(email, password) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - authentication unavailable');
    }
    
    try {
      // For server-side authentication, we need to use a different approach
      // since Firebase Admin SDK doesn't support email/password sign-in directly
      // We'll use the REST API or implement a custom solution
      throw new Error('Server-side email/password authentication not implemented - use client-side Firebase Auth');
    } catch (error) {
      console.error('❌ Firebase sign-in failed:', error);
      throw new Error('Authentication failed');
    }
  }

  async createCustomToken(uid) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - token creation unavailable');
    }
    
    try {
      const customToken = await this.auth.createCustomToken(uid);
      return customToken;
    } catch (error) {
      console.error('❌ Firebase custom token creation failed:', error);
      throw new Error('Token creation failed');
    }
  }

  async updateUser(uid, userData) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - user update unavailable');
    }
    
    try {
      const updateData = {};
      if (userData.displayName) updateData.displayName = userData.displayName;
      if (userData.email) updateData.email = userData.email;
      if (userData.photoURL) updateData.photoURL = userData.photoURL;

      const userRecord = await this.auth.updateUser(uid, updateData);
      
      return {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName,
        photoURL: userRecord.photoURL,
      };
    } catch (error) {
      console.error('❌ Firebase user update failed:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async deleteUser(uid) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - user deletion unavailable');
    }
    
    try {
      await this.auth.deleteUser(uid);
      console.log('✅ Firebase user deleted successfully:', uid);
    } catch (error) {
      console.error('❌ Firebase user deletion failed:', error);
      throw new Error('Failed to delete user');
    }
  }

  // Storage methods
  async uploadImage(fileBuffer, fileName, contentType) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - storage unavailable');
    }
    
    try {
      console.log('📤 Firebase: Starting image upload for:', fileName);
      
      const file = this.bucket.file(`images/${fileName}`);
      
      await file.save(fileBuffer, {
        metadata: {
          contentType: contentType,
        },
        resumable: false,
      });

      // Make the file publicly readable
      await file.makePublic();

      const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/images/${fileName}`;
      console.log('📤 Firebase: Image uploaded successfully:', publicUrl);
      
      return publicUrl;
    } catch (error) {
      console.error('❌ Firebase upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(fileName) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - storage unavailable');
    }
    
    try {
      const file = this.bucket.file(`images/${fileName}`);
      await file.delete();
      console.log('🗑️ Firebase: Image deleted successfully:', fileName);
    } catch (error) {
      console.error('❌ Firebase delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  async getImageUrl(fileName) {
    if (!this.isInitialized) {
      throw new Error('Firebase not initialized - storage unavailable');
    }
    
    try {
      const file = this.bucket.file(`images/${fileName}`);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 24 * 60 * 60 * 1000, // 24 hours
      });
      return url;
    } catch (error) {
      console.error('❌ Firebase get URL error:', error);
      throw new Error('Failed to get image URL');
    }
  }

  // Helper methods
  getAuthErrorMessage(errorCode) {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No account found with this email address';
      case 'auth/wrong-password':
        return 'Incorrect password';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters';
      case 'auth/invalid-email':
        return 'Invalid email address';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later';
      default:
        return 'Authentication failed. Please try again';
    }
  }

  // Middleware for protecting routes
  authenticateToken(req, res, next) {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }

    this.verifyToken(token)
      .then((decodedToken) => {
        req.user = decodedToken;
        next();
      })
      .catch((error) => {
        console.error('❌ Authentication middleware error:', error);
        return res.status(403).json({ error: 'Invalid or expired token' });
      });
  }
}

module.exports = new FirebaseService();
