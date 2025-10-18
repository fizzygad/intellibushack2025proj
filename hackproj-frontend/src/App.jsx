import { useEffect, useState, useCallback } from "react";
import { io } from "socket.io-client";
import SLdetector from "./SLdetector";

const SOCKET_URL = "http://localhost:5000";

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
    if (voices.length === 0) return; // wait until voices are ready

    const s = io(SOCKET_URL);
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
  }, [voices, playTTS]);

  // ---- Join Room ----
  const joinRoom = () => {
    if (!socket || !username) return alert("Enter your username first!");
    const id = crypto.randomUUID();
    setUserId(id);

    socket.emit("join_room", { roomId, userId: id, username });
    setJoined(true);
  };

  // ---- Speech-to-Text ----
  const handleSpeak = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = "en-US";
    recognition.onresult = (e) => {
      const text = e.results[0][0].transcript;
      console.log("🎤 Heard:", text);
      socket.emit("speech_text", {
        roomId,
        userId,
        text,
        sourceLang: "en",
        targetLang: "es",
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
      {!joined ? (
        <div>
          <input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
          />
          <input
            value={roomId}
            onChange={(e) => setRoomId(e.target.value)}
            placeholder="Room ID"
          />
          <button onClick={joinRoom}>Join Room</button>
        </div>
      ) : (
        <div>
          <button onClick={handleSpeak}>🎙️ Speak</button>
          <button onClick={repeatTranslation}>🔁 Repeat Last</button> {/* 🆕 */}
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
          <button onClick={() => playTTS("Hola, esto es una prueba", "es")}>
            🔊 Test Spanish Audio
          </button>
          <SLdetector
            onDetect={(text) => {
              console.log("🤟 Detected sign:", text);
              if (socket && text) {
                socket.emit("speech_text", {
                  roomId,
                  userId,
                  text,
                  sourceLang: "en",
                  targetLang: "es",
                });
              }
            }}
          />

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
