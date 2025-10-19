/**
 * Input Validation and Sanitization Utilities
 * Ensures data integrity and security throughout the application
 */

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates password strength
 */
export function validatePassword(password: string): {
  isValid: boolean;
  message?: string;
} {
  if (password.length < 6) {
    return {
      isValid: false,
      message: 'Password must be at least 6 characters',
    };
  }

  if (password.length > 72) {
    return {
      isValid: false,
      message: 'Password must be less than 72 characters',
    };
  }

  return { isValid: true };
}

/**
 * Validates username format and length
 */
export function validateUsername(username: string): {
  isValid: boolean;
  message?: string;
} {
  const trimmed = username.trim();

  if (trimmed.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters',
    };
  }

  if (trimmed.length > 30) {
    return {
      isValid: false,
      message: 'Username must be less than 30 characters',
    };
  }

  const usernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!usernameRegex.test(trimmed)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, hyphens, and underscores',
    };
  }

  return { isValid: true };
}

/**
 * Sanitizes string input by removing dangerous characters
 */
export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 1000); // Limit length
}

/**
 * Validates room code format
 */
export function validateRoomCode(code: string): boolean {
  const trimmed = code.trim().toUpperCase();
  return /^[A-Z0-9]{6}$/.test(trimmed);
}

/**
 * Validates sign-up form data
 */
export function validateSignUpForm(data: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  password: string;
  reEnterPassword: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length > 50) {
    errors.firstName = 'First name must be less than 50 characters';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length > 50) {
    errors.lastName = 'Last name must be less than 50 characters';
  }

  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.message!;
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message!;
  }

  if (data.password !== data.reEnterPassword) {
    errors.reEnterPassword = 'Passwords do not match';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates sign-in form data
 */
export function validateSignInForm(data: {
  email: string;
  password: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.email.trim()) {
    errors.email = 'Email is required';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  if (!data.password) {
    errors.password = 'Password is required';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Validates profile update form data
 */
export function validateProfileForm(data: {
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}): ValidationResult {
  const errors: Record<string, string> = {};

  if (!data.firstName.trim()) {
    errors.firstName = 'First name is required';
  } else if (data.firstName.trim().length > 50) {
    errors.firstName = 'First name must be less than 50 characters';
  }

  if (!data.lastName.trim()) {
    errors.lastName = 'Last name is required';
  } else if (data.lastName.trim().length > 50) {
    errors.lastName = 'Last name must be less than 50 characters';
  }

  const usernameValidation = validateUsername(data.username);
  if (!usernameValidation.isValid) {
    errors.username = usernameValidation.message!;
  }

  if (!validateEmail(data.email)) {
    errors.email = 'Please enter a valid email address';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
