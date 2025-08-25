import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { ENVIRONMENT } from '../config/environment';

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

class SupabaseService {
  private static instance: SupabaseService;
  private supabase: SupabaseClient;
  private authStateListeners: ((user: AuthUser | null) => void)[] = [];

  private constructor() {
    // Initialize Supabase client
    this.supabase = createClient(
      ENVIRONMENT.SUPABASE.URL,
      ENVIRONMENT.SUPABASE.ANON_KEY
    );

    // Set up auth state listener
    this.supabase.auth.onAuthStateChange((event, session) => {
      const authUser: AuthUser | null = session?.user ? {
        uid: session.user.id,
        email: session.user.email,
        displayName: session.user.user_metadata?.full_name || null,
        photoURL: session.user.user_metadata?.avatar_url || null
      } : null;
      
      this.authStateListeners.forEach(listener => listener(authUser));
    });
  }

  public static getInstance(): SupabaseService {
    if (!SupabaseService.instance) {
      SupabaseService.instance = new SupabaseService();
    }
    return SupabaseService.instance;
  }

  // Authentication methods
  async signIn(email: string, password: string): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return {
        uid: data.user!.id,
        email: data.user!.email,
        displayName: data.user!.user_metadata?.full_name || null,
        photoURL: data.user!.user_metadata?.avatar_url || null
      };
    } catch (error: any) {
      console.error('Supabase sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  async signUp(email: string, password: string, fullName?: string): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      });

      if (error) throw error;

      return {
        uid: data.user!.id,
        email: data.user!.email,
        displayName: data.user!.user_metadata?.full_name || null,
        photoURL: data.user!.user_metadata?.avatar_url || null
      };
    } catch (error: any) {
      console.error('Supabase sign up error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  async signInWithGoogle(): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'pawnbrokerpro://auth/callback'
        }
      });

      if (error) throw error;

      // For OAuth, we need to wait for the redirect
      return {
        uid: data.user?.id || '',
        email: data.user?.email || null,
        displayName: data.user?.user_metadata?.full_name || null,
        photoURL: data.user?.user_metadata?.avatar_url || null
      };
    } catch (error: any) {
      console.error('Supabase Google sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  async signInWithApple(): Promise<AuthUser> {
    try {
      const { data, error } = await this.supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'pawnbrokerpro://auth/callback'
        }
      });

      if (error) throw error;

      return {
        uid: data.user?.id || '',
        email: data.user?.email || null,
        displayName: data.user?.user_metadata?.full_name || null,
        photoURL: data.user?.user_metadata?.avatar_url || null
      };
    } catch (error: any) {
      console.error('Supabase Apple sign in error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  async signOut(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.signOut();
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase sign out error:', error);
      throw new Error('Failed to sign out');
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'pawnbrokerpro://auth/reset-password'
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase password reset error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  async sendEmailVerification(): Promise<void> {
    try {
      const { error } = await this.supabase.auth.resend({
        type: 'signup',
        email: (await this.getCurrentUser())?.email || ''
      });
      if (error) throw error;
    } catch (error: any) {
      console.error('Supabase email verification error:', error);
      throw new Error(this.getAuthErrorMessage(error.message));
    }
  }

  getCurrentUser(): AuthUser | null {
    const user = this.supabase.auth.getUser();
    return user ? {
      uid: user.id,
      email: user.email,
      displayName: user.user_metadata?.full_name || null,
      photoURL: user.user_metadata?.avatar_url || null
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
      console.log('📤 Supabase: Starting image upload for:', fileName);
      
      // Convert image URI to blob
      const response = await fetch(imageUri);
      const blob = await response.blob();
      
      // Upload to Supabase Storage
      const { data, error } = await this.supabase.storage
        .from('images')
        .upload(fileName, blob);

      if (error) throw error;

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from('images')
        .getPublicUrl(fileName);

      console.log('📤 Supabase: Image uploaded successfully');
      return urlData.publicUrl;
    } catch (error: any) {
      console.error('❌ Supabase upload error:', error);
      throw new Error('Failed to upload image');
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      const { error } = await this.supabase.storage
        .from('images')
        .remove([fileName]);

      if (error) throw error;
      console.log('🗑️ Supabase: Image deleted successfully');
    } catch (error: any) {
      console.error('❌ Supabase delete error:', error);
      throw new Error('Failed to delete image');
    }
  }

  // Helper methods
  private getAuthErrorMessage(errorMessage: string): string {
    if (errorMessage.includes('Invalid login credentials')) {
      return 'Invalid email or password';
    } else if (errorMessage.includes('Email not confirmed')) {
      return 'Please verify your email address';
    } else if (errorMessage.includes('User already registered')) {
      return 'An account with this email already exists';
    } else if (errorMessage.includes('Password should be at least')) {
      return 'Password should be at least 6 characters';
    } else if (errorMessage.includes('Invalid email')) {
      return 'Invalid email address';
    } else if (errorMessage.includes('Too many requests')) {
      return 'Too many failed attempts. Please try again later';
    }
    return 'Authentication failed. Please try again';
  }
}

export default SupabaseService;
