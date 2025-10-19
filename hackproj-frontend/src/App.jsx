import { useEffect, useState, useCallback, React } from "react";
import { io } from "socket.io-client";
import SLdetector from "./SLdetector";
import axios from "axios";
import './App.css';

const SOCKET_URL = "https://omnivst-backend.onrender.com";
const API_URL = "https://omnivst-backend.onrender.com/auth";

// Component to simulate the Navigation Header
const AppHeader = ({ token, setScreen }) => (
    <header className="app-header">
        <div className="logo-container">
            {/* Placeholder for Logo Image */}
            <img src="/omnivst-logo.png" alt="OmniVST" style={{ width: '40px', marginRight: '10px' }} />
            <span>OmniVST</span>
        </div>
        <nav className="nav-links">
            <a href="#" onClick={() => setScreen('home')}>Home</a>
            <a href="#" onClick={() => setScreen('vst-panel')}>VST Panel</a>
            <a href="#" onClick={() => setScreen('profile')}>Profile</a>
            {token && <button className="btn-review" onClick={() => setScreen('preferences')}>Review</button>}
        </nav>
    </header>
);

const GOOGLE_LANGUAGES = [
  { code: "af", name: "Afrikaans" },
  { code: "sq", name: "Albanian" },
  { code: "am", name: "Amharic" },
  { code: "ar", name: "Arabic" },
  { code: "hy", name: "Armenian" },
  { code: "az", name: "Azerbaijani" },
  { code: "eu", name: "Basque" },
  { code: "be", name: "Belarusian" },
  { code: "bn", name: "Bengali" },
  { code: "bs", name: "Bosnian" },
  { code: "bg", name: "Bulgarian" },
  { code: "ca", name: "Catalan" },
  { code: "ceb", name: "Cebuano" },
  { code: "zh-CN", name: "Chinese (Simplified)" },
  { code: "zh-TW", name: "Chinese (Traditional)" },
  { code: "co", name: "Corsican" },
  { code: "hr", name: "Croatian" },
  { code: "cs", name: "Czech" },
  { code: "da", name: "Danish" },
  { code: "nl", name: "Dutch" },
  { code: "en", name: "English" },
  { code: "eo", name: "Esperanto" },
  { code: "et", name: "Estonian" },
  { code: "fil", name: "Filipino" },
  { code: "fi", name: "Finnish" },
  { code: "fr", name: "French" },
  { code: "gl", name: "Galician" },
  { code: "ka", name: "Georgian" },
  { code: "de", name: "German" },
  { code: "el", name: "Greek" },
  { code: "gu", name: "Gujarati" },
  { code: "ht", name: "Haitian Creole" },
  { code: "ha", name: "Hausa" },
  { code: "haw", name: "Hawaiian" },
  { code: "he", name: "Hebrew" },
  { code: "hi", name: "Hindi" },
  { code: "hmn", name: "Hmong" },
  { code: "hu", name: "Hungarian" },
  { code: "is", name: "Icelandic" },
  { code: "ig", name: "Igbo" },
  { code: "id", name: "Indonesian" },
  { code: "ga", name: "Irish" },
  { code: "it", name: "Italian" },
  { code: "ja", name: "Japanese" },
  { code: "jw", name: "Javanese" },
  { code: "kn", name: "Kannada" },
  { code: "kk", name: "Kazakh" },
  { code: "km", name: "Khmer" },
  { code: "ko", name: "Korean" },
  { code: "ku", name: "Kurdish" },
  { code: "ky", name: "Kyrgyz" },
  { code: "lo", name: "Lao" },
  { code: "la", name: "Latin" },
  { code: "lv", name: "Latvian" },
  { code: "lt", name: "Lithuanian" },
  { code: "lb", name: "Luxembourgish" },
  { code: "mk", name: "Macedonian" },
  { code: "mg", name: "Malagasy" },
  { code: "ms", name: "Malay" },
  { code: "ml", name: "Malayalam" },
  { code: "mt", name: "Maltese" },
  { code: "mi", name: "Maori" },
  { code: "mr", name: "Marathi" },
  { code: "mn", name: "Mongolian" },
  { code: "my", name: "Myanmar (Burmese)" },
  { code: "ne", name: "Nepali" },
  { code: "no", name: "Norwegian" },
  { code: "ny", name: "Nyanja (Chichewa)" },
  { code: "or", name: "Odia (Oriya)" },
  { code: "ps", name: "Pashto" },
  { code: "fa", name: "Persian" },
  { code: "pl", name: "Polish" },
  { code: "pt", name: "Portuguese" },
  { code: "pa", name: "Punjabi" },
  { code: "ro", name: "Romanian" },
  { code: "ru", name: "Russian" },
  { code: "sm", name: "Samoan" },
  { code: "gd", name: "Scots Gaelic" },
  { code: "sr", name: "Serbian" },
  { code: "st", name: "Sesotho" },
  { code: "sn", name: "Shona" },
  { code: "sd", name: "Sindhi" },
  { code: "si", name: "Sinhala" },
  { code: "sk", name: "Slovak" },
  { code: "sl", name: "Slovenian" },
  { code: "so", name: "Somali" },
  { code: "es", name: "Spanish" },
  { code: "su", name: "Sundanese" },
  { code: "sw", name: "Swahili" },
  { code: "sv", name: "Swedish" },
  { code: "tg", name: "Tajik" },
  { code: "ta", name: "Tamil" },
  { code: "te", name: "Telugu" },
  { code: "th", name: "Thai" },
  { code: "tr", name: "Turkish" },
  { code: "uk", name: "Ukrainian" },
  { code: "ur", name: "Urdu" },
  { code: "uz", name: "Uzbek" },
  { code: "vi", name: "Vietnamese" },
  { code: "cy", name: "Welsh" },
  { code: "xh", name: "Xhosa" },
  { code: "yi", name: "Yiddish" },
  { code: "yo", name: "Yoruba" },
  { code: "zu", name: "Zulu" },
];

function App() {
  // Add state to control which screen is active
  const [screen, setScreen] = useState('home'); // 'home', 'auth', 'room-setup', 'vst-speech', 'vst-sign', 'preferences', 'profile'
  
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
  const [sameLang, setSameLang] = useState(false);
  
  // --- New State for Profile/Signup Forms ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");

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
    if (!token || voices.length === 0) return;

    const s = io(SOCKET_URL, { auth: { token } });
    setSocket(s);

    s.on("connect", () => console.log("🟢 Connected to server"));

    // 🆕 Handle translation message
    s.on("translated_text", (payload) => {
      console.log("📩 Received translation:", payload);
      setMessages(prev => [...prev, payload]);

      // 🆕 Conditional translation playback
      if (sameLang) {
        console.log("🎧 Same language detected — skipping translation playback");
        playTTS(payload.original, payload.sourceLang); // play original
      } else {
        playTTS(payload.translated, payload.targetLang);
      }

      setLastTranslated(payload.translated);
      setLastLang(payload.targetLang);
    });

    // 🆕 Detect if both users share the same language
    s.on("room_langs", ({ sameLang, langs }) => {
      console.log("🌍 Room languages:", langs);
      setSameLang(sameLang);
    });

    s.on("user_joined", ({ username }) => console.log(`${username} joined`));

    return () => s.disconnect();
  }, [token, voices, playTTS, sameLang]);

  // ---- Signup/Login ----
  const handleSignup = async () => {
    if (!username || !email || !password || !firstName || !lastName || password !== reEnterPassword) {
         return alert("Please fill all fields and ensure passwords match.");
    }
    try {
      const res = await axios.post(`${API_URL}/signup`, { 
        first_name: firstName, last_name: lastName, username, email, password, preferredlang 
      });
      setToken(res.data.token);
      setUserId(res.data.user.user_id);
      alert("Signup successful! You are now logged in.");
      setScreen('room-setup'); // Navigate after successful login
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
      setScreen('room-setup'); // Navigate after successful login
    } catch (err) {
      console.error(err);
      alert("Login failed");
    }
  };

  // ---- Join Room ----
  const joinRoom = (isSignLang) => {
    if (!socket) return alert("Not connected to server yet");
    if (!roomId || !username) return alert("Enter a room ID and username");

    console.log("🧠 Joining room:", roomId, "with lang:", preferredlang);

    socket.emit("join_room", { roomId, userId, username, preferredlang });
    setJoined(true);
    setScreen(isSignLang ? 'vst-sign' : 'vst-speech');
  };

  // ---- 🆕 Leave Room ----
  const leaveRoom = () => {
    if (socket) {
      socket.emit("leave_room", { roomId, userId });
      setJoined(false);
      setRoomId(""); // clear state
      setMessages([]);
      setSameLang(false);
      setScreen('room-setup');
      console.log("🚪 Left the room");
    }
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
  
  // ==========================================================
  //                       SCREEN RENDERING                     
  // ==========================================================

  // --- 1. Landing Screen (Screenshot 2025-10-19 093807.png) ---
  const renderLanding = () => (
      <div className="screen-container">
          <div className="landing-content">
              {/* Placeholder for Logo/Image */}
              <img src="/omnivst-logo-large.png" alt="OmniVST Logo" style={{ width: '250px', marginBottom: '20px' }} />
              <h1 className="landing-title">OmniVST</h1>
              <h2 className="landing-tagline">Sign. Speak. Understand.</h2>
              <p>OmniVST breaks language and accessibility barriers with AI-powered speech and sign translation.</p>
              <button className="btn-primary btn-landing-login" onClick={() => setScreen('auth')}>
                  Sign Up/ Login
              </button>
          </div>
      </div>
  );

  // --- 2. Auth Screens (Login/Signup) ---
  const renderAuth = () => (
      <div className="screen-container">
          <div className="white-card auth-form-container">
              <h3>{isLogin ? "Login" : "Create Account"}</h3>
              
              {/* Signup Fields (Conditional Rendering) */}
              {!isLogin && (
                <div className="form-row">
                    <div className="form-field-group">
                        <label>First Name</label>
                        <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                    </div>
                    <div className="form-field-group">
                        <label>Last Name</label>
                        <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                    </div>
                </div>
              )}
              {!isLogin && (
                  <div className="form-row">
                      <div className="form-field-group">
                          <label>Username</label>
                          <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
                      </div>
                      <div className="form-field-group">
                          <label>Email Address</label>
                          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                  </div>
              )}
              
              {/* Login/Common Fields */}
              {isLogin && (
                  <div className="form-field-group">
                      <label>Username / Email Address</label>
                      <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                  </div>
              )}
              
              <div className="form-row">
                  <div className="form-field-group">
                      <label>Password</label>
                      <input type="password" className="form-input" value={password} onChange={e => setPassword(e.target.value)} />
                  </div>
                  {!isLogin && (
                      <div className="form-field-group">
                          <label>Re- Enter Password</label>
                          <input type="password" className="form-input" value={reEnterPassword} onChange={e => setReEnterPassword(e.target.value)} />
                      </div>
                  )}
              </div>

              {!isLogin && (
                  <div className="form-field-group profile-full-width">
                      <label>Preferred Language</label>
                      <select className="form-input" value={preferredlang} onChange={e => setPreferredlang(e.target.value)}>
                          <option value="en">English</option>
                          <option value="es">Spanish</option>
                          <option value="sign">Sign Language</option>
                      </select>
                  </div>
              )}

              <button className="btn-primary" onClick={isLogin ? handleLogin : handleSignup}>
                  {isLogin ? "Login" : "Sign Up"}
              </button>
              
              <p className="toggle-text" onClick={() => setIsLogin(!isLogin)}>
                  {isLogin ? "Don't have an account? Sign Up." : "Already have an account? Login."}
              </p>
          </div>
      </div>
  );

  // --- 3. Room Join/Create Screen (Screenshot 2025-10-19 095331.png) ---
  const renderRoomSetup = () => (
      <>
          <AppHeader token={token} setScreen={setScreen} />
          <div className="screen-container">
              <div className="room-setup-area">
                  <h2>Start a Conversation.</h2>
                  <div className="room-input-group">
                      <button className="btn-room-action" onClick={() => joinRoom(preferredlang === 'sign')}>
                          Create Room
                      </button>
                      <input 
                          className="room-id-input" 
                          value={roomId} 
                          onChange={e => setRoomId(e.target.value)} 
                          placeholder="Room ID" 
                      />
                      <button className="btn-room-action" onClick={() => joinRoom(preferredlang === 'sign')}>
                          Join Room
                      </button>
                  </div>
              </div>
          </div>
      </>
  );

  // --- 4. VST Room Screens (Shared base view) ---
  const renderVSTPanel = (isSignLang) => (
      <>
          <AppHeader token={token} setScreen={setScreen} />
          <div className="screen-container">
              <div className="vst-room-main">
                  {/* Small output box at the top */}
                  <div className="translation-output-box"></div> 
                  
                  {/* Sign Language Video Area (Conditional) */}
                  {isSignLang && (
                      <div className="sign-video-area">
                          {/* Placeholder for camera feed/SLDetector */}
                          <p>Sign Language Detector / User Video</p>
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
                      </div>
                  )}
                  
                  {/* Main Controls */}
                  <div className="controls-bar">
                    <button className="control-btn btn-mic" onClick={handleSpeak}>
                      {isSignLang ? '🤟' : '🎙️'} 
                    </button>
                    <button className="control-btn btn-end" onClick={leaveRoom}>
                      <span style={{color: 'white'}}>📞</span>
                    </button>
                  </div>
                  
                  {/* Translation History/Messages can be overlaid here */}
                  <div style={{ position: 'absolute', bottom: 30, left: 30, width: '90%' }}>
                      <h4>Last Translation: {lastTranslated}</h4>
                      <ul>
                          {messages.slice(-5).map((m, i) => ( // Show last 5 messages
                              <li key={i}>
                                  <strong>{m.from}</strong>: {m.original} → <em>{m.translated}</em>
                              </li>
                          ))}
                      </ul>
                  </div>
              </div>
          </div>
      </>
  );

  // --- 5. Preferences/Review Mode Screen (image_d5753b.png) ---
  const renderPreferences = () => (
      <>
          <AppHeader token={token} setScreen={setScreen} />
          <div className="screen-container">
              <div className="white-card preferences-list">
                  <h2>Preferences</h2>
                  <a href="#" onClick={() => {/* navigate to history */}}>Translation History</a>
                  <a href="#" onClick={() => {/* navigate to saved phrases */}}>Saved Phrases</a>
                  <a href="#" onClick={() => {/* navigate to language pairs */}}>Language Pairs</a>
                  <a href="#" onClick={() => {/* navigate to review mode */}}>Review Mode</a>
              </div>
          </div>
      </>
  );

  // --- 6. Profile Edit Screen (image_d571b6.png) ---
  const renderProfile = () => (
      <>
          <AppHeader token={token} setScreen={setScreen} />
          <div className="screen-container">
              <div className="white-card">
                  <h2>Profile</h2>
                  <div className="profile-form-grid">
                      <div className="form-field-group">
                          <label>First Name</label>
                          <input className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} />
                      </div>
                      <div className="form-field-group">
                          <label>Last Name</label>
                          <input className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} />
                      </div>
                      <div className="form-field-group">
                          <label>Username</label>
                          <input className="form-input" value={username} onChange={e => setUsername(e.target.value)} />
                      </div>
                      <div className="form-field-group">
                          <label>Email Address</label>
                          <input className="form-input" value={email} onChange={e => setEmail(e.target.value)} />
                      </div>
                      <div className="form-field-group profile-full-width">
                          <label>Preferred Language</label>
                          <select
                            className="form-input"
                            value={preferredlang}
                            onChange={(e) => setPreferredlang(e.target.value)}
                          >
                            {GOOGLE_LANGUAGES.map((lang) => (
                              <option key={lang.code} value={lang.code}>
                                {lang.name}
                              </option>
                            ))}
                            <option value="sign">Sign Language</option>
                          </select>

                      </div>
                      <div className="form-field-group profile-full-width">
                          <label>Saved Phrases</label>
                          {/* Placeholder for a list or display area */}
                          <textarea className="saved-phrases-textarea" disabled defaultValue="[Phrase 1], [Phrase 2], [Phrase 3]..."></textarea>
                      </div>
                  </div>
                  <button className="btn-primary" style={{ marginTop: '20px' }}>Save Profile</button>
              </div>
          </div>
      </>
  );

  // ==========================================================
  //                       MAIN APP SWITCH
  // ==========================================================
  
  const getScreenComponent = () => {
    // Determine the user's login state for initial routing
    if (!token && screen !== 'auth') {
        return renderLanding();
    }

    switch (screen) {
        case 'auth':
            return renderAuth();
        case 'room-setup':
            return renderRoomSetup();
        case 'vst-speech':
            return renderVSTPanel(false); // Speech-to-Speech
        case 'vst-sign':
            return renderVSTPanel(true);  // Sign-to-Speech
        case 'preferences':
            return renderPreferences();
        case 'profile':
            return renderProfile();
        case 'home':
        default:
            // If logged in but on 'home', default to room setup
            return token ? renderRoomSetup() : renderLanding();
    }
  };

  return (
    <div className="main-app-wrapper">
      {getScreenComponent()}
    </div>
  );
}

export default App;