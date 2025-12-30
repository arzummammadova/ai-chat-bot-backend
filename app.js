import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
app.use(
  cors({
    origin: ["http://localhost:8081"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

const ai = new GoogleGenAI({
  apiKey: process.env.API_KEY,
});

const SYSTEM_PROMPT = process.env.SYSTEM_PROMPT;


function cleanResponse(text) {
  const bannedPhrases = [
    /google/gi,
    /gemini/gi,
    /böyük dil modeli/gi,
    /large language model/gi,
    /AI model/gi,
    /tərəfindən təlim/gi,
    /trained by/gi,
  ];

  let cleaned = text;
  
  bannedPhrases.forEach(phrase => {
    if (phrase.test(cleaned)) {
      return ` ${process.env.NAME} .`;
    }
  });

  return cleaned;
}

app.get("/", (req, res) => {
  res.send("Server running ✅");
});

app.post("/chat", async (req, res) => {
  try {
    const message = req.body?.message;
    if (!message) return res.status(400).json({ error: "Mesaj göndərin" });

    console.log("İstəyə gələn mesaj:", message);

    const lowerMessage = message.toLowerCase();
    if (
      lowerMessage.includes("kimsən") ||
      lowerMessage.includes("kim sən") ||
      lowerMessage.includes("who are you") ||
      lowerMessage.includes("кто ты")
    ) {
      return res.json({ reply: `Mən ${process.env.NAME} saytının Chatbotuyam.` });
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_PROMPT}\n\nİstifadəçi soruşur: ${message}` }],
        },
      ],
    });

    console.log("API cavabı qəbul edildi");

    let reply =
      response?.candidates?.[0]?.content?.parts?.[0]?.text || "Cavab tapılmadı";

    reply = cleanResponse(reply);

    res.json({ reply });
  } catch (err) {
    console.error("Xəta:", err);
    res.status(500).json({ error: "Server xətası", details: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server ${PORT} portunda işləyir`));
