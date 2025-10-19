/**
 * Enhanced Authentication Context
 * Provides centralized authentication state management with improved error handling,
 * logging, and data validation
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { logError, getSupabaseErrorMessage } from '../utils/errors';
import { createProfile } from '../services/profileService';
import { sanitizeString } from '../utils/validation';

interface UserData {
  email: string;
  firstName: string;
  lastName: string;
  username: string;
  preferredLanguage?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string, userData: UserData) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          logError(error, 'AuthProvider - getSession');
        }

        if (mounted) {
          setUser(session?.user ?? null);
          setLoading(false);
        }
      } catch (err) {
        logError(err, 'AuthProvider - initializeAuth');
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (mounted) {
        setUser(session?.user ?? null);

        if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        } else if (event === 'SIGNED_IN') {
          console.log('User signed in');
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, userData: UserData) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        logError(error, 'signUp - auth');
        throw new Error(getSupabaseErrorMessage(error));
      }

      if (!data.user) {
        throw new Error('Failed to create user account');
      }

      const { error: profileError } = await createProfile(data.user.id, {
        email: sanitizeString(userData.email),
        first_name: sanitizeString(userData.firstName),
        last_name: sanitizeString(userData.lastName),
        username: sanitizeString(userData.username),
        preferred_language: userData.preferredLanguage
          ? sanitizeString(userData.preferredLanguage)
          : '',
      });

      if (profileError) {
        logError(profileError, 'signUp - profile creation');
        throw new Error(profileError);
      }
    } catch (err) {
      logError(err, 'signUp');
      throw err;
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      if (!email || !password) {
        throw new Error('Email and password are required');
      }

      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (error) {
        logError(error, 'signIn');
        throw new Error(getSupabaseErrorMessage(error));
      }
    } catch (err) {
      logError(err, 'signIn');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        logError(error, 'signOut');
        throw new Error(getSupabaseErrorMessage(error));
      }
    } catch (err) {
      logError(err, 'signOut');
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
