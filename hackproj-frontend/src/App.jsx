//import axios from "axios";
import { useEffect, useState } from "react";
import { io } from "socket.io-client";

const SOCKET_URL = "http://localhost:5000";

function App() {
  const [socket, setSocket] = useState(null);
  const [roomId, setRoomId] = useState("room1");
  const [username, setUsername] = useState("");
  const [userId, setUserId] = useState("");
  const [joined, setJoined] = useState(false);
  const [lastTranslated, setLastTranslated] = useState("");
  const [messages, setMessages] = useState([]);
  const [voices, setVoices] = useState([]);

  // ---- Load voices on startup ----
  useEffect(() => {
    const tryLoad = () => {
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        setVoices(voices);
        console.log("✅ Voices loaded automatically.");
      } else {
        console.warn("⚠️ Voices not ready. Waiting for user interaction...");
        const handler = () => {
          const newVoices = window.speechSynthesis.getVoices();
          if (newVoices.length > 0) {
            setVoices(newVoices);
            console.log("✅ Voices loaded after user interaction.");
            window.removeEventListener("click", handler);
          }
        };
        window.addEventListener("click", handler, { once: true });
      }
    };
    tryLoad();
  }, []);


  // ---- Socket setup ----
  useEffect(() => {
    const s = io(SOCKET_URL);
    setSocket(s);

    s.on("connect", () => console.log("🟢 Connected to server"));
    s.on("translated_text", (payload) => {
      console.log("📩 Received translation:", payload);
      setMessages((prev) => [...prev, payload]);
      playTTS(payload.translated, payload.targetLang);
      setLastTranslated(payload.translated);
    });

    s.on("user_joined", ({ username }) => console.log(`${username} joined`));

    return () => s.disconnect();
  }, []);

  // ---- Join Room ----
  const joinRoom = () => {
    if (!socket || !username) return alert("Enter your username first!");
    const id = crypto.randomUUID();
    setUserId(id);

    socket.emit("join_room", {
      roomId,
      userId: id,
      username,
    });
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

  // ---- Text-to-Speech ----
  const playTTS = (text, lang) => {
    if (!text) return;
    if (voices.length === 0) {
      console.warn("⚠️ No voices available yet.");
      return;
    }

    if (voices.length === 0) {
      const fallback = window.speechSynthesis.getVoices();
      if (fallback.length > 0) setVoices(fallback);
    }

    const normalized = lang?.toLowerCase().slice(0, 2);
    const targetLangCode = normalized === "es" ? "es-ES" : "en-US";

    const selectedVoice =
      voices.find(v => v.lang.startsWith(targetLangCode)) ||
      voices.find(v => v.name.toLowerCase().includes("google")) ||
      voices[0];

    const utter = new SpeechSynthesisUtterance(text);
    utter.voice = selectedVoice;
    utter.lang = selectedVoice.lang;
    utter.rate = 1;

    console.log(`🔈 Using voice: ${selectedVoice.name} (${selectedVoice.lang})`);

    // Cancel queued speech and play
    setTimeout(() => {
      speechSynthesis.cancel();
      speechSynthesis.speak(utter);
    }, 250);
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
          <button onClick={() => playTTS("Hello, this is a test", "en")}>
            🔊 Test English Audio
          </button>
          <button onClick={() => console.log(voices)}>
            🧠 List Voices (Debug)
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
