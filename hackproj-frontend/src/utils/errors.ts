/**
 * Centralized Error Handling Utilities
 * Provides consistent error handling and user-friendly error messages across the application
 */

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'AppError';
  }
}

/**
 * Maps Supabase error codes to user-friendly messages
 */
export function getSupabaseErrorMessage(error: any): string {
  if (!error) return 'An unknown error occurred';

  const errorCode = error.code || error.error_code || '';
  const errorMessage = error.message || '';

  const errorMap: Record<string, string> = {
    'auth/invalid-email': 'Invalid email address format',
    'auth/user-not-found': 'No account found with this email',
    'auth/wrong-password': 'Incorrect password',
    'auth/weak-password': 'Password should be at least 6 characters',
    'auth/email-already-in-use': 'An account with this email already exists',
    'auth/too-many-requests': 'Too many failed attempts. Please try again later',
    'invalid_credentials': 'Invalid email or password',
    'email_not_confirmed': 'Please verify your email address',
    'user_already_exists': 'An account with this email already exists',
    'weak_password': 'Password must be at least 6 characters',
    '23505': 'This username or email is already taken',
    'PGRST116': 'No data found',
  };

  if (errorMap[errorCode]) {
    return errorMap[errorCode];
  }

  if (errorMessage.toLowerCase().includes('duplicate')) {
    return 'This information is already in use';
  }

  if (errorMessage.toLowerCase().includes('not found')) {
    return 'Requested resource not found';
  }

  if (errorMessage.toLowerCase().includes('network')) {
    return 'Network error. Please check your connection';
  }

  if (errorMessage.toLowerCase().includes('permission')) {
    return 'You do not have permission to perform this action';
  }

  return errorMessage || 'An unexpected error occurred. Please try again';
}

/**
 * Logs errors for debugging while sanitizing sensitive information
 */
export function logError(error: any, context?: string): void {
  const timestamp = new Date().toISOString();
  const logMessage = {
    timestamp,
    context: context || 'Unknown',
    error: {
      name: error?.name || 'Error',
      message: error?.message || 'Unknown error',
      code: error?.code || error?.error_code || null,
      stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
    },
  };

  console.error('[Error Log]', JSON.stringify(logMessage, null, 2));
}

/**
 * Handles async operations with consistent error handling
 */
export async function handleAsync<T>(
  promise: Promise<T>,
  context?: string
): Promise<[T | null, Error | null]> {
  try {
    const data = await promise;
    return [data, null];
  } catch (error) {
    if (context) {
      logError(error, context);
    }
    return [null, error as Error];
  }
}
