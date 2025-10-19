/**
 * Enhanced Authentication Page
 * Provides sign-up and sign-in functionality with comprehensive validation,
 * error handling, and user feedback
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LanguageSelector } from '../components/LanguageSelector';
import {
  validateSignUpForm,
  validateSignInForm,
  sanitizeString,
} from '../utils/validation';
import { getSupabaseErrorMessage } from '../utils/errors';

export function Auth() {
  const navigate = useNavigate();
  const { signUp, signIn } = useAuth();
  const [isSignUp, setIsSignUp] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    reEnterPassword: '',
    preferredLanguage: '',
  });

  useEffect(() => {
    setError('');
    setFieldErrors({});
  }, [isSignUp]);

  const resetForm = () => {
    setFormData({
      firstName: '',
      lastName: '',
      username: '',
      email: '',
      password: '',
      reEnterPassword: '',
      preferredLanguage: '',
    });
    setError('');
    setFieldErrors({});
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({});

    try {
      if (isSignUp) {
        const validation = validateSignUpForm(formData);
        if (!validation.isValid) {
          setFieldErrors(validation.errors);
          setError('Please correct the errors below');
          return;
        }

        setLoading(true);

        await signUp(formData.email, formData.password, {
          firstName: sanitizeString(formData.firstName),
          lastName: sanitizeString(formData.lastName),
          username: sanitizeString(formData.username),
          email: sanitizeString(formData.email),
          preferredLanguage: formData.preferredLanguage
            ? sanitizeString(formData.preferredLanguage)
            : '',
        });

        navigate('/vst-panel');
      } else {
        const validation = validateSignInForm(formData);
        if (!validation.isValid) {
          setFieldErrors(validation.errors);
          setError('Please correct the errors below');
          return;
        }

        setLoading(true);

        await signIn(formData.email, formData.password);

        navigate('/vst-panel');
      }
    } catch (err: any) {
      const errorMessage = getSupabaseErrorMessage(err);
      setError(errorMessage);
      console.error('Auth error:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignUp(!isSignUp);
    resetForm();
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#6EB5DC] to-[#7CBFE3]">
        <div className="bg-white rounded-2xl shadow-xl p-12 w-full max-w-3xl">
          <h1 className="text-4xl font-bold mb-10 text-center">
            {isSignUp ? 'Create Account' : 'Login'}
          </h1>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder=" "
                      className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        fieldErrors.firstName
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#5BA4CF]'
                      }`}
                      value={formData.firstName}
                      onChange={(e) =>
                        handleInputChange('firstName', e.target.value)
                      }
                      disabled={loading}
                    />
                    <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                      First Name
                    </label>
                    {fieldErrors.firstName && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.firstName}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      placeholder=" "
                      className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        fieldErrors.lastName
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#5BA4CF]'
                      }`}
                      value={formData.lastName}
                      onChange={(e) =>
                        handleInputChange('lastName', e.target.value)
                      }
                      disabled={loading}
                    />
                    <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Last Name
                    </label>
                    {fieldErrors.lastName && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.lastName}
                      </p>
                    )}
                  </div>
                </div>

                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder=" "
                    className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                      fieldErrors.username
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#5BA4CF]'
                    }`}
                    value={formData.username}
                    onChange={(e) =>
                      handleInputChange('username', e.target.value)
                    }
                    disabled={loading}
                  />
                  <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Username
                  </label>
                  {fieldErrors.username && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.username}
                    </p>
                  )}
                </div>
              </>
            )}

            {isSignUp ? (
              <div className="relative">
                <input
                  type="email"
                  required
                  placeholder=" "
                  autoComplete="email"
                  className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#5BA4CF]'
                  }`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={loading}
                />
                <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">
                    {fieldErrors.email}
                  </p>
                )}
              </div>
            ) : (
              <>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder=" "
                    autoComplete="email"
                    className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                      fieldErrors.email
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#5BA4CF]'
                    }`}
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    disabled={loading}
                  />
                  <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Username / Email Address
                  </label>
                  {fieldErrors.email && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.email}
                    </p>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="password"
                    required
                    placeholder=" "
                    autoComplete="current-password"
                    className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                      fieldErrors.password
                        ? 'border-red-300 focus:border-red-500'
                        : 'border-gray-300 focus:border-[#5BA4CF]'
                    }`}
                    value={formData.password}
                    onChange={(e) =>
                      handleInputChange('password', e.target.value)
                    }
                    disabled={loading}
                  />
                  <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                    Password
                  </label>
                  {fieldErrors.password && (
                    <p className="mt-1 text-sm text-red-600">
                      {fieldErrors.password}
                    </p>
                  )}
                </div>
              </>
            )}

            {isSignUp && (
              <>
                <div className="grid grid-cols-2 gap-6">
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder=" "
                      autoComplete="new-password"
                      className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        fieldErrors.password
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#5BA4CF]'
                      }`}
                      value={formData.password}
                      onChange={(e) =>
                        handleInputChange('password', e.target.value)
                      }
                      disabled={loading}
                    />
                    <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Password
                    </label>
                    {fieldErrors.password && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.password}
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <input
                      type="password"
                      required
                      placeholder=" "
                      autoComplete="new-password"
                      className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                        fieldErrors.reEnterPassword
                          ? 'border-red-300 focus:border-red-500'
                          : 'border-gray-300 focus:border-[#5BA4CF]'
                      }`}
                      value={formData.reEnterPassword}
                      onChange={(e) =>
                        handleInputChange('reEnterPassword', e.target.value)
                      }
                      disabled={loading}
                    />
                    <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                      Re- Enter Password
                    </label>
                    {fieldErrors.reEnterPassword && (
                      <p className="mt-1 text-sm text-red-600">
                        {fieldErrors.reEnterPassword}
                      </p>
                    )}
                  </div>
                </div>

                <LanguageSelector
                  value={formData.preferredLanguage}
                  onChange={(code) => handleInputChange('preferredLanguage', code)}
                  disabled={loading}
                />
              </>
            )}

            <div className="flex justify-center pt-6">
              <button
                type="submit"
                disabled={loading}
                className="px-12 py-3 bg-[#5BA4CF] text-white rounded-lg hover:bg-[#4A93BE] disabled:opacity-50 disabled:cursor-not-allowed font-medium text-lg transition-colors"
              >
                {loading
                  ? isSignUp
                    ? 'Creating Account...'
                    : 'Signing In...'
                  : isSignUp
                  ? 'Sign Up'
                  : 'Login'}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <button
              onClick={toggleMode}
              disabled={loading}
              className="text-[#5BA4CF] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSignUp
                ? 'Already have an account? Login.'
                : "Don't have an account? Sign Up."}
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
