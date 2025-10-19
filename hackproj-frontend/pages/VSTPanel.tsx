/**
 * Enhanced VST Panel Page
 * Provides room creation and joining functionality with comprehensive validation,
 * error handling, and user feedback
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { useAuth } from '../contexts/AuthContext';
import {
  createRoom,
  findRoomByCode,
  addRoomParticipant,
} from '../services/roomService';
import { validateRoomCode, sanitizeString } from '../utils/validation';
import { getSupabaseErrorMessage } from '../utils/errors';

type TranslationMode = 'sign' | 'voice' | null;

export function VSTPanel() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [mode, setMode] = useState<TranslationMode>(null);

  const handleCreateRoom = async (translationMode: TranslationMode) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!translationMode) {
      setError('Please select a translation mode');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { room, error: createError } = await createRoom(user.id);

      if (createError || !room) {
        setError(createError || 'Failed to create room');
        return;
      }

      const path =
        translationMode === 'voice' ? 'voice-translate' : 'translate';
      navigate(`/${path}/${room.room_code}`);
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async (translationMode: TranslationMode) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (!translationMode) {
      setError('Please select a translation mode');
      return;
    }

    const sanitizedCode = sanitizeString(roomCode).toUpperCase();

    if (!sanitizedCode) {
      setError('Please enter a room code');
      return;
    }

    if (!validateRoomCode(sanitizedCode)) {
      setError('Room code must be 6 characters (letters and numbers only)');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { room, error: findError } = await findRoomByCode(sanitizedCode);

      if (findError || !room) {
        setError(findError || 'Room not found');
        return;
      }

      const { error: joinError } = await addRoomParticipant(room.id, user.id);

      if (joinError) {
        setError(joinError);
        return;
      }

      const path =
        translationMode === 'voice' ? 'voice-translate' : 'translate';
      navigate(`/${path}/${sanitizedCode}`);
    } catch (err: any) {
      setError(getSupabaseErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handleRoomCodeChange = (value: string) => {
    setRoomCode(value.toUpperCase());
    if (error) {
      setError('');
    }
  };

  const handleModeChange = (newMode: TranslationMode) => {
    setMode(newMode);
    setError('');
  };

  if (mode === null) {
    return (
      <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#6EB5DC] to-[#8CC9E8]">
        <Header />

        <main className="flex-1 flex items-center justify-center px-4">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-16 text-gray-900">
              Select Translation Mode
            </h1>

            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-md mx-auto">
                {error}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-8">
              <button
                onClick={() => handleModeChange('sign')}
                disabled={loading}
                className="px-10 py-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Sign Language
              </button>

              <button
                onClick={() => handleModeChange('voice')}
                disabled={loading}
                className="px-10 py-6 bg-black text-white rounded-xl font-medium hover:bg-gray-800 transition-colors text-xl shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Voice Translation
              </button>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-[#6EB5DC] to-[#8CC9E8]">
      <Header />

      <main className="flex-1 flex items-center justify-center px-4 relative">
        <button
          onClick={() => {
            setMode(null);
            setRoomCode('');
            setError('');
          }}
          disabled={loading}
          className="absolute top-8 right-8 px-6 py-2.5 bg-black text-white rounded-full text-sm hover:bg-gray-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Review
        </button>

        <div className="text-center">
          <h1 className="text-5xl font-bold mb-16 text-gray-900">
            Start a Conversation.
          </h1>

          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-md mx-auto">
              {error}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-center gap-4 max-w-2xl mx-auto">
            <button
              onClick={() => handleCreateRoom(mode)}
              disabled={loading}
              className="px-10 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg transition-colors"
            >
              {loading ? 'Creating...' : 'Create Room'}
            </button>

            <input
              type="text"
              placeholder="Enter room code"
              value={roomCode}
              onChange={(e) => handleRoomCodeChange(e.target.value)}
              disabled={loading}
              maxLength={6}
              className="px-8 py-4 rounded-full border-2 border-white bg-white focus:outline-none focus:border-gray-300 w-64 text-center text-lg shadow-lg uppercase disabled:opacity-50 disabled:cursor-not-allowed"
            />

            <button
              onClick={() => handleJoinRoom(mode)}
              disabled={loading || !roomCode.trim()}
              className="px-10 py-4 bg-black text-white rounded-full font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-lg shadow-lg transition-colors"
            >
              {loading ? 'Joining...' : 'Join Room'}
            </button>
          </div>

          <p className="mt-6 text-sm text-gray-700">
            Mode: {mode === 'sign' ? 'Sign Language' : 'Voice Translation'}
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
}
