/*
import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import SLdetector from "./SLdetector";
import axios from "axios";

const SOCKET_URL = "https://omnivst-backend.onrender.com:5000";
const API_URL = "https://omnivst-backend.onrender.com/auth";

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("room1");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [joined, setJoined] = useState(false);
  const [lastTranslated, setLastTranslated] = useState("");
  const [lastLang, setLastLang] = useState(""); // 🆕 store last language
  const [messages, setMessages] = useState([]);
  const [voices, setVoices] = useState([]);
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [preferredlang, setPreferredlang] = useState("en");
  const [token, setToken] = useState(null);


  // ---- Load voices on startup ----
  useEffect(() => {
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        console.log("✅ Voices loaded:", v.map(vo => `${vo.name} (${vo.lang})`));
        setVoices(v);
      } else {
        console.warn("🕓 Waiting for voices...");
        window.speechSynthesis.onvoiceschanged = () => {
          const voicesNow = window.speechSynthesis.getVoices();
          console.log("✅ Voices ready after onvoiceschanged:", voicesNow.length);
          setVoices(voicesNow);
        };
      }
    };
    loadVoices();
  }, []);

  // ---- Text-to-Speech ----
  const playTTS = useCallback((text, lang) => {
    if (!text) return;
    if (voices.length === 0) return console.warn("⚠️ No voices available yet.");

    const normalized = lang?.toLowerCase().slice(0, 2);
    const targetLangCode = normalized === "es" ? "es-ES" : "en-US";

    const voice =
      voices.find(v => v.lang.startsWith(targetLangCode)) ||
      voices.find(v => v.name.toLowerCase().includes("google")) ||
      voices[0];

    if (!voice) {
      console.warn(`⚠️ No matching voice found for ${targetLangCode}`);
      return;
    }

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = voice;
    utter.lang = voice.lang;
    utter.rate = 1;

    console.log(`🔈 Speaking with: ${voice.name} (${voice.lang})`);
    speechSynthesis.cancel();
    speechSynthesis.speak(utter);
  }, [voices]);

  // ---- Socket setup (single instance) ----
  useEffect(() => {
    if (!token || voices.length === 0) return; // wait until voices are ready

    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on("connect", () => console.log("🟢 Connected to server"));

    s.on("translated_text", (payload) => {
      console.log("📩 Received translation:", payload);
      setMessages(prev => [...prev, payload]);
      playTTS(payload.translated, payload.targetLang);
      setLastTranslated(payload.translated);
      setLastLang(payload.targetLang); // 🆕 store language for repeat
    });

    s.on("user_joined", ({ username }) => console.log(`${username} joined`));

    return () => s.disconnect();
  }, [token, voices, playTTS]);

  // ---- Signup/Login ----
  const handleSignup = async () => {
    if (!username || !email || !password) return alert("Fill all fields");
    try {
      const res = await axios.post(`${API_URL}/signup`, { 
        first_name: "", last_name: "", username, email, password, preferredlang 
      });
      setToken(res.data.token);
      setUserId(res.data.user.user_id);
      alert("Signup successful!");
    } catch (err) {
      console.error(err);
      alert("Signup failed");
    }
  };

  const handleLogin = async () => {
    if (!email || !password) return alert("Fill all fields");
    try {
      const res = await axios.post(`${API_URL}/login`, { emailOrUsername: email, password });
      setToken(res.data.token);
      setUserId(res.data.user.user_id);
      setUsername(res.data.user.username);
      setPreferredlang(res.data.user.preferredlang);
      alert("Login successful!");
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // ---- Join Room ----
  const joinRoom = () => {
    if (!socket) return alert("Not connected to server yet");
    if (!roomId || !username) return alert("Enter a room ID and username");

    socket.emit("join_room", { roomId, userId, username, preferredlang });
    setJoined(true);
  };

  // ---- Speech-to-Text ----
  const handleSpeak = () => {
    if (!socket) return alert("Not connected");
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = preferredlang === "es" ? "es-ES" : "en-US";
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      console.log("🎤 Heard:", text);
      socket.emit("speech_text", {
        roomId,
        userId,
        text,
        sourceLang: preferredlang.slice(0, 2),
        targetLang: preferredlang === "es" ? "en" : "es",
      });
    };
    recognition.onerror = (err) => console.error("Speech recognition error:", err);
    recognition.start();
  };

  // ---- 🆕 Repeat last translated audio ----
  const repeatTranslation = () => {
    if (!lastTranslated) return alert("No translation to repeat yet!");
    playTTS(lastTranslated, lastLang);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>🌐 Realtime Translator</h2>

      {!token ? (
        <div>
          <h3>{isLogin ? "Login" : "Signup"}</h3>
          <input value={username} onChange={e => setUsername(e.target.value)} placeholder="Username" style={{ display: isLogin ? "none" : "block" }} />
          <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email" />
          <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password" />
          {!isLogin && (
            <select value={preferredlang} onChange={e => setPreferredlang(e.target.value)}>
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="sign">Sign Language</option>
            </select>
          )}
          <button onClick={isLogin ? handleLogin : handleSignup}>{isLogin ? "Login" : "Signup"}</button>
          <p onClick={() => setIsLogin(!isLogin)} style={{ cursor: "pointer", color: "blue" }}>
            {isLogin ? "Create an account" : "Already have an account?"}
          </p>
        </div>
      ) : !joined ? (
        <div>
          <input value={roomId} onChange={e => setRoomId(e.target.value)} placeholder="Room ID" />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSpeak}>🎙️ Speak</button>
          <button onClick={repeatTranslation}>🔁 Repeat Last</button> 
          {joined && preferredlang === "sign" && (
            <SLdetector
              onDetect={text => {
                if (socket && text)
                  socket.emit("speech_text", {
                    roomId,
                    userId,
                    text,
                    sourceLang: "sign",
                    targetLang: preferredlang === "sign" ? "en" : "sign",
                  });
              }}
            />
          )}

          <button onClick={() => {
            const v = window.speechSynthesis.getVoices();
            if (v.length > 0) {
              console.log("✅ Manual voice load:", v.map(vo => `${vo.name} (${vo.lang})`));
              setVoices(v);
            } else {
              console.warn("⚠️ Still no voices — wait a second and try again.");
              window.speechSynthesis.getVoices(); // trigger load
            }
          }}>
            🗣️ Initialize Voices
          </button>

          <h4>Last Translation: {lastTranslated}</h4>
          <ul>
            {messages.map((m, i) => (
              <li key={i}>
                <strong>{m.from}</strong>: {m.original} → <em>{m.translated}</em>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default App; 
*/

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Home } from './pages/Home';
import { Auth } from './pages/Auth';
import { VSTPanel } from './pages/VSTPanel';
import { Translate } from './pages/Translate';
import { VoiceTranslate } from './pages/VoiceTranslate';
import { Profile } from './pages/Profile';
import { Preferences } from './pages/Preferences';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-sky-400 to-sky-300">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={<Auth />} />
      <Route
        path="/vst-panel"
        element={
          <ProtectedRoute>
            <VSTPanel />
          </ProtectedRoute>
        }
      />
      <Route
        path="/translate/:roomCode"
        element={
          <ProtectedRoute>
            <Translate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/voice-translate/:roomCode"
        element={
          <ProtectedRoute>
            <VoiceTranslate />
          </ProtectedRoute>
        }
      />
      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />
      <Route
        path="/preferences"
        element={
          <ProtectedRoute>
            <Preferences />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;