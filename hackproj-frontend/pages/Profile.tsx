/**
 * Enhanced Profile Page
 * Provides user profile management with comprehensive validation,
 * error handling, and user feedback
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { LanguageSelector } from '../components/LanguageSelector';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getProfile, updateProfile } from '../services/profileService';
import { validateProfileForm, sanitizeString } from '../utils/validation';
import { getSupabaseErrorMessage } from '../utils/errors';

export function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    preferredLanguage: '',
    savedPhrases: '',
  });

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    loadProfile();
  }, [user, navigate]);

  const loadProfile = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { profile, error: profileError } = await getProfile(user.id);

      if (profileError) {
        setError(profileError);
        return;
      }

      if (profile) {
        setFormData({
          firstName: profile.first_name || '',
          lastName: profile.last_name || '',
          username: profile.username || '',
          email: profile.email || '',
          preferredLanguage: profile.preferred_language || '',
          savedPhrases: profile.saved_phrases || '',
        });
      }
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (fieldErrors[field]) {
      setFieldErrors({ ...fieldErrors, [field]: '' });
    }
    if (error) {
      setError('');
    }
    if (success) {
      setSuccess('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setFieldErrors({});

    if (!user) {
      setError('User session not found');
      return;
    }

    try {
      const validation = validateProfileForm({
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
      });

      if (!validation.isValid) {
        setFieldErrors(validation.errors);
        setError('Please correct the errors below');
        return;
      }

      setSaving(true);

      const { error: updateError } = await updateProfile(user.id, {
        first_name: sanitizeString(formData.firstName),
        last_name: sanitizeString(formData.lastName),
        username: sanitizeString(formData.username),
        email: sanitizeString(formData.email),
        preferred_language: formData.preferredLanguage
          ? sanitizeString(formData.preferredLanguage)
          : '',
        saved_phrases: formData.savedPhrases
          ? sanitizeString(formData.savedPhrases)
          : '',
      });

      if (updateError) {
        setError(updateError);
        return;
      }

      setSuccess('Profile updated successfully');

      setTimeout(() => {
        navigate('/vst-panel');
      }, 1500);
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center bg-gradient-to-b from-[#6EB5DC] to-[#7CBFE3]">
          <div className="text-white text-xl">Loading profile...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 py-12 bg-gradient-to-b from-[#6EB5DC] to-[#7CBFE3]">
        <div className="bg-white rounded-2xl shadow-xl p-10 w-full max-w-3xl">
          <div className="flex items-center mb-8">
            <button
              onClick={() => navigate('/vst-panel')}
              className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="w-6 h-6 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold">Profile</h1>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-lg">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder=" "
                  className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    fieldErrors.firstName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#5BA4CF]'
                  }`}
                  value={formData.firstName}
                  onChange={(e) => handleInputChange('firstName', e.target.value)}
                  disabled={saving}
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
                  placeholder=" "
                  className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    fieldErrors.lastName
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#5BA4CF]'
                  }`}
                  value={formData.lastName}
                  onChange={(e) => handleInputChange('lastName', e.target.value)}
                  disabled={saving}
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

            <div className="grid grid-cols-2 gap-6">
              <div className="relative">
                <input
                  type="text"
                  placeholder=" "
                  className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    fieldErrors.username
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#5BA4CF]'
                  }`}
                  value={formData.username}
                  onChange={(e) => handleInputChange('username', e.target.value)}
                  disabled={saving}
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
              <div className="relative">
                <input
                  type="email"
                  placeholder=" "
                  className={`peer w-full px-4 py-3 border-2 rounded-lg focus:outline-none transition-colors ${
                    fieldErrors.email
                      ? 'border-red-300 focus:border-red-500'
                      : 'border-gray-300 focus:border-[#5BA4CF]'
                  }`}
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  disabled={saving}
                />
                <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                  Email Address
                </label>
                {fieldErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{fieldErrors.email}</p>
                )}
              </div>
            </div>

            <LanguageSelector
              value={formData.preferredLanguage}
              onChange={(code) => handleInputChange('preferredLanguage', code)}
              disabled={saving}
            />

            <div className="relative">
              <textarea
                rows={8}
                placeholder=" "
                className="peer w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-[#5BA4CF] transition-colors resize-none"
                value={formData.savedPhrases}
                onChange={(e) =>
                  handleInputChange('savedPhrases', e.target.value)
                }
                disabled={saving}
              />
              <label className="absolute left-2 -top-3 bg-white px-2 text-sm font-medium text-gray-700">
                Saved Phrases
              </label>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <button
                type="button"
                onClick={() => navigate('/vst-panel')}
                disabled={saving}
                className="px-8 py-2.5 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Exit
              </button>
              <button
                type="submit"
                disabled={saving}
                className="px-8 py-2.5 bg-[#5BA4CF] text-white rounded-lg hover:bg-[#4A93BE] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}
