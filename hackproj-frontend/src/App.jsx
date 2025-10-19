import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import SLdetector from "./SLdetector";
import axios from "axios";

const SOCKET_URL = "http://localhost:5000";
const API_URL = "http://localhost:5000/auth";

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
  
  // --- New State for Profile/Signup Forms ---
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [reEnterPassword, setReEnterPassword] = useState("");


  // ---- Load voices on startup ----
  useEffect(() => {
    // ... (TTS/Voices logic remains unchanged)
  }, []);

  // ---- Text-to-Speech ----
  const playTTS = useCallback((text, lang) => {
    // ... (TTS logic remains unchanged)
  }, [voices]);

  // ---- Socket setup (single instance) ----
  useEffect(() => {
    // ... (Socket logic remains unchanged)
  }, [token, voices, playTTS]);

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

    socket.emit("join_room", { roomId, userId, username, preferredlang });
    setJoined(true);
    // Set screen based on preferred language for the room view
    setScreen(isSignLang ? 'vst-sign' : 'vst-speech');
  };

  // ---- Speech-to-Text ----
  const handleSpeak = () => {
    // ... (Speech-to-Text logic remains unchanged)
  };

  // ---- 🆕 Repeat last translated audio ----
  const repeatTranslation = () => {
    // ... (Repeat logic remains unchanged)
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
                      <button className="control-btn btn-end">
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
                          <select className="form-input" value={preferredlang} onChange={e => setPreferredlang(e.target.value)}>
                              <option value="en">English</option>
                              <option value="es">Spanish</option>
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