import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { downloadGeneratedAudio, generateVoice, streamVoice } from "./murfService.js";
import { generateReply } from "./aiService.js";
import { getLanguageConfig, normalizeLanguage } from "./languageConfig.js";

dotenv.config({ path: "./.env" });

const app = express();
const MAX_TEXT_LENGTH = 500;
const PORT = Number(process.env.PORT) || 5000;

app.set("trust proxy", 1);
app.use(cors());
app.use(express.json({ limit: "32kb" }));

app.get("/", (_req, res) => {
  res.json({ status: "ok", message: "MoonSpeak AI API running" });
});

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.get("/tts-stream", async (req, res) => {
  const text = typeof req.query.text === "string" ? req.query.text.trim().slice(0, MAX_TEXT_LENGTH) : "";
  const legacyMode = typeof req.query.mode === "string" ? req.query.mode : "";
  const requestedLanguage = typeof req.query.language === "string"
    ? req.query.language
    : legacyMode === "bilingual"
      ? "hi-IN"
      : "en-US";
  const safeLanguage = normalizeLanguage(requestedLanguage);

  if (!text) {
    return res.status(400).json({ error: "Text is required." });
  }

  try {
    const murfStream = await streamVoice(text, safeLanguage);
    res.setHeader("Content-Type", murfStream.contentType);
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-MoonSpeak-Voice-Mode", murfStream.deliveryMode);
    murfStream.stream.pipe(res);
  } catch (error) {
    console.error(`[${new Date().toLocaleTimeString()}] TTS STREAM ERROR:`, error.message);

    try {
      const fallbackVoice = await generateVoice(text, safeLanguage);
      if (fallbackVoice.audioFile) {
        const fallbackAudio = await downloadGeneratedAudio(fallbackVoice.audioFile);
        res.setHeader("Content-Type", fallbackAudio.contentType);
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-MoonSpeak-Voice-Mode", fallbackVoice.deliveryMode || fallbackAudio.deliveryMode);
        return fallbackAudio.stream.pipe(res);
      }
    } catch (fallbackError) {
      console.error(`[${new Date().toLocaleTimeString()}] TTS FALLBACK ERROR:`, fallbackError.message);
    }

    if (!res.headersSent) {
      res.status(500).json({ error: "Voice streaming failed." });
    }
  }
});

app.post("/speak", async (req, res) => {

  const { text, history, mode, language } = req.body;

  if (!text || typeof text !== "string") {
    return res.status(400).json({ error: "Text is required." });
  }

  const trimmedText = text.trim().slice(0, MAX_TEXT_LENGTH);

  if (!trimmedText) {
    return res.status(400).json({ error: "Text cannot be empty." });
  }

  const safeHistory = Array.isArray(history) ? history.slice(0, 12) : [];
  const requestedLanguage = typeof language === "string"
    ? language
    : mode === "bilingual"
      ? "hi-IN"
      : "en-US";
  const safeLanguage = normalizeLanguage(requestedLanguage);
  const safeLanguageConfig = getLanguageConfig(safeLanguage);

  try {

    const ts = new Date().toLocaleTimeString();
    console.log(`[${ts}] User: "${trimmedText.slice(0, 80)}${trimmedText.length > 80 ? "…" : ""}"`);

    const aiResult = await generateReply(trimmedText, safeHistory, safeLanguage);
    const reply = aiResult.reply;
    console.log(`[${ts}] AI:   "${reply.slice(0, 80)}${reply.length > 80 ? "…" : ""}"`);

    const isFallback = aiResult.source === "local-fallback";
    const unavailableProviders = Array.isArray(aiResult.fallbackDetails)
      ? aiResult.fallbackDetails.map((detail) => detail.provider).join(" + ")
      : "AI providers";
    const assistantNotice = isFallback
      ? `${unavailableProviders} unavailable, using local fallback.`
      : null;

    const streamParams = new URLSearchParams({
      text: reply,
      language: safeLanguage
    });
    const audioStreamUrl = `${req.protocol}://${req.get("host")}/tts-stream?${streamParams.toString()}`;

    res.json({
      reply,
      audioFile: audioStreamUrl,
      audioStreamUrl,
      audioMode: "falcon-stream-or-fallback",
      replySource: aiResult.source,
      isFallback,
      fallbackReason: aiResult.fallbackReason,
      fallbackDetails: aiResult.fallbackDetails || [],
      language: safeLanguage,
      languageLabel: safeLanguageConfig.label,
      assistantNotice
    });

  } catch (error) {

    console.error(`[${new Date().toLocaleTimeString()}] ERROR:`, error.message);
    res.status(500).json({ error: "Something went wrong. Please try again." });

  }

});

app.listen(PORT, () => {
  console.log(`MoonSpeak AI API running on port ${PORT}`);
});
