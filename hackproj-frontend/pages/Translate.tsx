/**
 * Enhanced Sign Language Translation Page
 * Provides video-based sign language translation with comprehensive error handling
 * and proper resource cleanup
 */

import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Video, PhoneOff, ArrowLeft } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { findRoomByCode, removeRoomParticipant } from '../services/roomService';
import { getSupabaseErrorMessage, logError } from '../utils/errors';

export function Translate() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isVideoOn, setIsVideoOn] = useState(false);
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    verifyRoom();

    return () => {
      cleanup();
    };
  }, [roomCode, user, navigate]);

  const verifyRoom = async () => {
    if (!roomCode) {
      setError('No room code provided');
      setIsVerifying(false);
      return;
    }

    try {
      const { room, error: roomError } = await findRoomByCode(roomCode);

      if (roomError || !room) {
        setError(roomError || 'Room not found or inactive');
        setTimeout(() => navigate('/vst-panel'), 2000);
        return;
      }

      setIsVerifying(false);
    } catch (err: any) {
      logError(err, 'Translate - verifyRoom');
      setError(getSupabaseErrorMessage(err));
      setIsVerifying(false);
    }
  };

  const toggleVideo = async () => {
    if (!isVideoOn) {
      try {
        setError('');

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          throw new Error('Camera access is not supported by your browser');
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: true,
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        streamRef.current = stream;
        setIsVideoOn(true);
      } catch (err: any) {
        logError(err, 'Translate - toggleVideo (on)');

        if (err.name === 'NotAllowedError') {
          setError('Camera access denied. Please allow camera access and try again.');
        } else if (err.name === 'NotFoundError') {
          setError('No camera found. Please connect a camera and try again.');
        } else if (err.name === 'NotReadableError') {
          setError('Camera is in use by another application. Please close other apps and try again.');
        } else {
          setError(getSupabaseErrorMessage(err));
        }
      }
    } else {
      stopVideo();
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsVideoOn(false);
  };

  const cleanup = () => {
    stopVideo();
  };

  const endCall = async () => {
    try {
      cleanup();

      if (user && roomCode) {
        const { room } = await findRoomByCode(roomCode);

        if (room) {
          await removeRoomParticipant(room.id, user.id);
        }
      }

      navigate('/vst-panel');
    } catch (err: any) {
      logError(err, 'Translate - endCall');
      navigate('/vst-panel');
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col px-4 py-6 bg-gradient-to-b from-[#6EB5DC] to-[#8CC9E8]">
          <div className="flex-1 flex items-center justify-center">
            <div className="text-white text-xl">Verifying room...</div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col px-4 py-6 bg-gradient-to-b from-[#6EB5DC] to-[#8CC9E8]">
        <div className="flex justify-between items-center mb-6 max-w-4xl mx-auto w-full">
          <button
            onClick={() => navigate('/vst-panel')}
            className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="inline-block px-6 py-2 bg-white rounded-full shadow-md">
            <span className="text-sm font-medium text-gray-700">Room: {roomCode}</span>
          </div>
          <div className="w-9"></div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg max-w-md mx-auto">
            {error}
          </div>
        )}

        <div className="flex-1 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-2xl">

            <div className="bg-gray-100 rounded-xl flex items-center justify-center mb-8 relative overflow-hidden" style={{ minHeight: '320px' }}>
              {isVideoOn ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="w-40 h-40 bg-gray-300 rounded flex items-center justify-center">
                    <svg
                      className="w-20 h-20 text-gray-500"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-6">
              <button
                onClick={toggleVideo}
                disabled={!!error && error.includes('Camera')}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  isVideoOn
                    ? 'bg-gray-700 hover:bg-gray-800'
                    : 'bg-black hover:bg-gray-800'
                }`}
                title={isVideoOn ? 'Turn off camera' : 'Turn on camera'}
              >
                <Video className="w-7 h-7 text-white" />
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                title="End call"
              >
                <PhoneOff className="w-7 h-7 text-white" />
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
