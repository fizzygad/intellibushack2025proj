import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Mic, PhoneOff, Volume2, Users, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Message {
  id: string;
  from_user: string;
  original_text: string;
  translated_text: string;
  source_lang: string;
  target_lang: string;
  created_at: string;
  profiles?: {
    username: string;
  };
}

interface Participant {
  user_id: string;
  preferred_lang: string;
  profiles: {
    username: string;
  };
}

export function VoiceTranslate() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [preferredLang, setPreferredLang] = useState('en');
  const [lastTranslated, setLastTranslated] = useState('');
  const [lastOriginal, setLastOriginal] = useState('');
  const recognitionRef = useRef<any>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }

    const init = async () => {
      const { data: room } = await supabase
        .from('rooms')
        .select('id')
        .eq('room_code', roomCode)
        .eq('is_active', true)
        .maybeSingle();

      if (!room) {
        navigate('/vst-panel');
        return;
      }

      setRoomId(room.id);

      const { data: profile } = await supabase
        .from('profiles')
        .select('preferred_language')
        .eq('id', user.id)
        .maybeSingle();

      if (profile?.preferred_language) {
        setPreferredLang(profile.preferred_language);
      }

      await supabase.from('room_participants').upsert(
        {
          room_id: room.id,
          user_id: user.id,
          preferred_lang: profile?.preferred_language || 'en',
        },
        {
          onConflict: 'room_id,user_id',
        }
      );

      loadParticipants(room.id);
      loadMessages(room.id);
      setupRealtimeSubscription(room.id);
    };

    init();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomCode, user, navigate]);

  const loadParticipants = async (roomId: string) => {
    const { data } = await supabase
      .from('room_participants')
      .select(
        `
        user_id,
        preferred_lang,
        profiles:user_id (
          username
        )
      `
      )
      .eq('room_id', roomId);

    if (data) {
      setParticipants(data as any);
    }
  };

  const loadMessages = async (roomId: string) => {
    const { data } = await supabase
      .from('room_translations')
      .select(
        `
        *,
        profiles:from_user (
          username
        )
      `
      )
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (data) {
      setMessages(data.reverse() as any);
    }
  };

  const setupRealtimeSubscription = (roomId: string) => {
    const channel = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'room_translations',
          filter: `room_id=eq.${roomId}`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => [...prev, newMessage]);

          if (newMessage.from_user !== user?.id) {
            setLastTranslated(newMessage.translated_text);
            playTTS(newMessage.translated_text, newMessage.target_lang);
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          loadParticipants(roomId);
        }
      )
      .subscribe();

    channelRef.current = channel;
  };

  const playTTS = useCallback((text: string, lang: string) => {
    if (!text) return;

    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return;

    const normalized = lang?.toLowerCase().slice(0, 2);
    const targetLangCode = normalized === 'es' ? 'es-ES' : 'en-US';

    const voice =
      voices.find((v) => v.lang.startsWith(targetLangCode)) ||
      voices.find((v) => v.name.toLowerCase().includes('google')) ||
      voices[0];

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voice;
    utter.lang = voice.lang;
    utter.rate = 1;

    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }, []);

  const startRecording = () => {
    if (!roomId || !user) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Speech recognition not supported in this browser');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = preferredLang === 'es' ? 'es-ES' : 'en-US';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
      const text = event.results[event.results.length - 1][0].transcript;
      setLastOriginal(text);

      const targetLang = preferredLang === 'es' ? 'en' : 'es';

      try {
        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData?.session?.access_token;

        if (!token) {
          throw new Error('Not authenticated');
        }

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/translate`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              text,
              sourceLang: preferredLang.slice(0, 2),
              targetLang,
              roomId,
              saveToHistory: true,
            }),
          }
        );

        if (!response.ok) {
          throw new Error('Translation failed');
        }

        const data = await response.json();
        setLastTranslated(data.translated);
      } catch (error) {
        console.error('Translation error:', error);
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
    };

    recognition.onend = () => {
      if (isRecording) {
        recognition.start();
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsRecording(false);
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const repeatLastTranslation = () => {
    if (lastTranslated) {
      playTTS(lastTranslated, preferredLang === 'es' ? 'en' : 'es');
    }
  };

  const endCall = async () => {
    stopRecording();

    if (user && roomId) {
      await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
    }

    navigate('/vst-panel');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 flex flex-col px-4 py-6 bg-gradient-to-b from-[#6EB5DC] to-[#8CC9E8]">
        <div className="flex justify-between items-center mb-6 max-w-7xl mx-auto w-full">
          <button
            onClick={() => navigate('/vst-panel')}
            className="p-2 bg-white hover:bg-gray-100 rounded-full transition-colors shadow-md"
            aria-label="Go back"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="inline-block px-6 py-2 bg-white rounded-full shadow-md">
            <span className="text-sm font-medium text-gray-700">
              Room: {roomCode}
            </span>
          </div>

          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-md">
            <Users className="w-4 h-4 text-gray-600" />
            <span className="text-sm font-medium text-gray-700">
              {participants.length} {participants.length === 1 ? 'person' : 'people'}
            </span>
          </div>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row gap-4 mb-6 max-w-7xl mx-auto w-full">
          <div className="flex-1 bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Translation Feed
            </h3>

            <div className="bg-gray-50 rounded-xl p-4 h-[400px] overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No messages yet. Start speaking!
                </div>
              ) : (
                messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.from_user === user?.id
                        ? 'bg-blue-100 ml-8'
                        : 'bg-gray-200 mr-8'
                    }`}
                  >
                    <div className="text-xs text-gray-600 mb-1">
                      {msg.profiles?.username || 'Unknown'} •{' '}
                      {msg.source_lang} → {msg.target_lang}
                    </div>
                    <div className="text-sm font-medium">{msg.original_text}</div>
                    <div className="text-sm text-gray-700 mt-1">
                      → {msg.translated_text}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="lg:w-80 bg-white rounded-2xl shadow-xl p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-700">
              Participants
            </h3>

            <div className="space-y-2">
              {participants.map((p) => (
                <div
                  key={p.user_id}
                  className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                >
                  <span className="font-medium text-sm">
                    {p.profiles?.username}
                  </span>
                  <span className="text-xs bg-blue-100 px-2 py-1 rounded">
                    {p.preferred_lang}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto w-full">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="bg-gray-50 rounded-xl p-8 mb-6 min-h-[200px] flex items-center justify-center">
              <div className="text-center">
                {lastOriginal && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">You said:</div>
                    <div className="text-lg font-semibold text-gray-800">
                      {lastOriginal}
                    </div>
                  </div>
                )}
                {lastTranslated && (
                  <div className="mb-4">
                    <div className="text-sm text-gray-600 mb-1">Translated:</div>
                    <div className="text-lg font-semibold text-blue-600">
                      {lastTranslated}
                    </div>
                  </div>
                )}
                {!lastOriginal && !lastTranslated && (
                  <p className="text-gray-400 text-lg">
                    {isRecording
                      ? 'Listening... Speak now'
                      : 'Click the microphone to start speaking'}
                  </p>
                )}
                {isRecording && (
                  <div className="flex justify-center mt-4">
                    <div className="flex gap-1 items-end">
                      {[0, 0.1, 0.2, 0.3, 0.4].map((delay, i) => (
                        <div
                          key={i}
                          className="w-2 bg-red-500 rounded animate-pulse"
                          style={{
                            animationDelay: `${delay}s`,
                            height: `${[2, 3, 4, 3, 2][i]}rem`,
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-center gap-6">
              <button
                onClick={toggleRecording}
                className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-lg ${
                  isRecording
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-black hover:bg-gray-800'
                }`}
              >
                <Mic className="w-7 h-7 text-white" />
              </button>

              <button
                onClick={repeatLastTranslation}
                disabled={!lastTranslated}
                className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Volume2 className="w-7 h-7 text-white" />
              </button>

              <button
                onClick={endCall}
                className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
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
