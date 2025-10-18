import express from "express";
import axios from "axios";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import pkg from "pg";


dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());


const { Pool } = pkg;
//import { Pool } from "pg";

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// PostgreSQL setup
const pool = new Pool({
  user: process.env.POSTGRES_USER || "fizzygad",
  password: process.env.POSTGRES_PASSWORD,
  host: process.env.POSTGRES_HOST || "postgres",
  port: process.env.POSTGRES_PORT || 5432,
  database: process.env.POSTGRES_DB || "minidatabase",
});

app.get("/", (req, res) => res.send("Server running!"));

io.on("connection", (socket) => {
  console.log(" Connected:", socket.id);

  socket.on("join_room", async ({ roomId, userId, username }) => {
    socket.join(roomId);
    socket.data = { roomId, userId, username };

    try {
      // Ensure the user exists
      await pool.query(
        `INSERT INTO users (user_id, username, created_at)
        VALUES ($1, $2, NOW())
        ON CONFLICT (user_id) DO NOTHING`,
        [userId, username]
      );

      // Ensure the room exists
      await pool.query(
        `INSERT INTO rooms (room_id, created_at)
        VALUES ($1, NOW())
        ON CONFLICT (room_id) DO NOTHING`,
        [roomId]
      );

      // Add participant
      await pool.query(
        `INSERT INTO participants (room_id, user_id, username, joined_at)
        VALUES ($1, $2, $3, NOW())
        ON CONFLICT (room_id, user_id) DO NOTHING`,
        [roomId, userId, username]
      );

      io.to(roomId).emit("user_joined", { userId, username });
    } catch (err) {
      console.error("❌ Error in join_room:", err);
    }
  });



  socket.on("speech_text", async ({ roomId, userId, text, sourceLang, targetLang }) => {
    try {
      const response = await axios.post(
        `https://translation.googleapis.com/language/translate/v2`,
        {},
        {
          params: {
            q: text,
            source: sourceLang,
            target: targetLang,
            key: process.env.WEBSPEECH_API_KEY,
          },
        }
      );

      const translatedText = response.data.data.translations[0].translatedText;

      await pool.query(
        `INSERT INTO translations (room_id, from_user, original_text,
        translated_text, source_lang, target_lang, created_at) VALUES ($1, $2, $3, $4,
        $5, $6, NOW())`,
        [roomId, userId, text, translatedText, sourceLang, targetLang]
      );

      socket.to(roomId).emit("translated_text", {
        from: userId,
        original: text,
        translated: translatedText,
        sourceLang,
        targetLang,
      });
    } catch (err) {
      console.error(" Translation error:", err.message);
      socket.emit("error_event", { message: "Translation failed." });
    }
  });

  socket.on("disconnect", () => console.log(" Disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(` Server running on port ${PORT}`));