import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  sendPasswordResetEmail
} from 'firebase/auth';
import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL,
  deleteObject 
} from 'firebase/storage';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX", // Replace with your Firebase API key
  authDomain: "pawnbroker-pro.firebaseapp.com",
  projectId: "pawnbroker-pro",
  storageBucket: "pawnbroker-pro.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdefghijklmnop"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface AuthState {
  user: AuthUser | null;
  loading: boolean;
  error: string | null;
}

class FirebaseService {
  private static instance: FirebaseService;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    // Set up auth state listener
    onAuthStateChanged(auth, (user) => {
      const authUser: AuthUser | null = user ? {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      } : null;
      
      this.authStateListeners.forEach(listener => listener(authUser));
    });
  }

  public static getInstance(): FirebaseService {
    if (!FirebaseService.instance) {
      FirebaseService.instance = new FirebaseService();
    }
    return FirebaseService.instance;
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error: any) {
      console.error('Firebase sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signUp(email: string, password: string): Promise<AuthUser> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      
      return {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL
      };
    } catch (error: any) {
      console.error('Firebase sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      console.error('Firebase sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      console.error('Firebase password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.code));
    }
  }

  getCurrentUser(): AuthUser | null {
    const user = auth.currentUser;
    return user ? {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL
    } : null;
  }

  onAuthStateChanged(listener: (user: AuthUser | null) => void): () => void {
    this.authStateListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(listener);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  // Storage methods
  async uploadImage(imageUri: string, fileName: string): Promise<string> {
    try {
      console.log('📤 Firebase: Starting image upload for:', fileName);
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Create storage reference
      const storageRef = ref(storage, `images/${fileName}`);
      
      // Upload blob
      const snapshot = await uploadBytes(storageRef, blob);
      console.log('📤 Firebase: Image uploaded successfully');
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      console.log('📤 Firebase: Download URL obtained:', downloadURL);
      
      return downloadURL;
    } catch (error: any) {
      console.error('❌ Firebase upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      const storageRef = ref(storage, `images/${fileName}`);
      await deleteObject(storageRef);
      console.log('🗑️ Firebase: Image deleted successfully');
    } catch (error: any) {
      console.error('❌ Firebase delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Helper methods
  private getAuthErrorMessage(errorCode: string): string {
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
}

export default FirebaseService;
