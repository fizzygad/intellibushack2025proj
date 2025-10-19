/**
 * Profile Service Layer
 * Centralized API for profile-related operations with proper error handling
 */

import { supabase } from '../lib/supabase';
import { logError, getSupabaseErrorMessage } from '../utils/errors';
import { sanitizeString } from '../utils/validation';

export interface Profile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  preferred_language: string;
  saved_phrases: string;
  created_at: string;
  updated_at: string;
}

export interface ProfileUpdateData {
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  preferred_language?: string;
  saved_phrases?: string;
}

/**
 * Fetches a user's profile by ID
 */
export async function getProfile(
  userId: string
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      logError(error, 'getProfile');
      return { profile: null, error: getSupabaseErrorMessage(error) };
    }

    return { profile: data, error: null };
  } catch (err) {
    logError(err, 'getProfile');
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to load profile',
    };
  }
}

/**
 * Creates a new user profile
 */
export async function createProfile(
  userId: string,
  profileData: Omit<ProfileUpdateData, 'saved_phrases'>
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const sanitizedData = {
      id: userId,
      email: sanitizeString(profileData.email),
      first_name: sanitizeString(profileData.first_name),
      last_name: sanitizeString(profileData.last_name),
      username: sanitizeString(profileData.username),
      preferred_language: profileData.preferred_language
        ? sanitizeString(profileData.preferred_language)
        : '',
    };

    const { data, error } = await supabase
      .from('profiles')
      .insert(sanitizedData)
      .select()
      .single();

    if (error) {
      logError(error, 'createProfile');
      return { profile: null, error: getSupabaseErrorMessage(error) };
    }

    return { profile: data, error: null };
  } catch (err) {
    logError(err, 'createProfile');
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to create profile',
    };
  }
}

/**
 * Updates an existing user profile
 */
export async function updateProfile(
  userId: string,
  profileData: ProfileUpdateData
): Promise<{ profile: Profile | null; error: string | null }> {
  try {
    if (!userId) {
      throw new Error('User ID is required');
    }

    const sanitizedData = {
      first_name: sanitizeString(profileData.first_name),
      last_name: sanitizeString(profileData.last_name),
      username: sanitizeString(profileData.username),
      email: sanitizeString(profileData.email),
      preferred_language: profileData.preferred_language
        ? sanitizeString(profileData.preferred_language)
        : '',
      saved_phrases: profileData.saved_phrases
        ? sanitizeString(profileData.saved_phrases)
        : '',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(sanitizedData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      logError(error, 'updateProfile');
      return { profile: null, error: getSupabaseErrorMessage(error) };
    }

    return { profile: data, error: null };
  } catch (err) {
    logError(err, 'updateProfile');
    return {
      profile: null,
      error: err instanceof Error ? err.message : 'Failed to update profile',
    };
  }
}
