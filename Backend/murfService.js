import axios from "axios";
import dotenv from "dotenv";
import { DEFAULT_LANGUAGE_ID, getLanguageConfig, normalizeLanguage } from "./languageConfig.js";

dotenv.config();

const MURF_STREAM_URLS = [
  process.env.MURF_STREAM_URL,
  "https://in.api.murf.ai/v1/speech/stream",
  "https://global.api.murf.ai/v1/speech/stream"
].filter(Boolean);
const MURF_GENERATE_URL = "https://api.murf.ai/v1/speech/generate";
const MURF_SPEECH_RATE = -4;
const MURF_REQUEST_TIMEOUT_MS = Number(process.env.MURF_REQUEST_TIMEOUT_MS || 15000);
const BUILTIN_MURF_STREAM_VOICE_MAP = {
  "en-US": "en-US-alina",
  "en-IN": "en-US-natalie",
  "hi-IN": "en-US-natalie",
  "es-ES": "en-US-natalie",
  "fr-FR": "en-US-natalie",
  "bn-IN": "en-US-natalie",
  "ta-IN": "en-US-natalie",
  "te-IN": "en-US-natalie"
};
const BUILTIN_MURF_GENERATE_VOICE_MAP = {
  "en-US": "en-US-alina",
  "en-IN": "en-IN-isha",
  "hi-IN": "hi-IN-rahul",
  "es-ES": "es-ES-carla",
  "fr-FR": "fr-FR-adelie",
  "de-DE": "de-DE-josephine",
  "it-IT": "it-IT-giorgio",
  "pt-BR": "pt-BR-isadora",
  "ja-JP": "ja-JP-denki",
  "ko-KR": "ko-KR-hwan",
  "zh-CN": "zh-CN-baolin",
  "bn-IN": "bn-IN-arnab",
  "ta-IN": "ta-IN-sarvesh",
  "te-IN": "en-UK-hazel"
};
const MURF_DEFAULT_VOICE_ID = process.env.MURF_DEFAULT_VOICE_ID || BUILTIN_MURF_STREAM_VOICE_MAP[DEFAULT_LANGUAGE_ID] || "Natalie";

function readVoiceMapFromEnv() {
  const rawMap = process.env.MURF_VOICE_MAP;

  if (!rawMap) {
    return {};
  }

  try {
    const parsedMap = JSON.parse(rawMap);
    return parsedMap && typeof parsedMap === "object" ? parsedMap : {};
  } catch (error) {
    console.error("MURF_VOICE_MAP could not be parsed as JSON:", sanitizeProviderMessage(error));
    return {};
  }
}

const MURF_VOICE_MAP = readVoiceMapFromEnv();

function sanitizeProviderMessage(error) {
  const rawMessage = error?.response?.data?.error?.message
    || error?.response?.data?.message
    || error?.message
    || "Unknown Murf provider error";

  return String(rawMessage)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 220);
}

function getMurfErrorSummary(error) {
  return {
    status: error?.response?.status || null,
    code: error?.response?.data?.error?.code || null,
    message: sanitizeProviderMessage(error)
  };
}

function toLanguageEnvKey(languageId) {
  return String(languageId || DEFAULT_LANGUAGE_ID)
    .replace(/[^a-z0-9]/gi, "_")
    .toUpperCase();
}

function getVoiceId(languageId = DEFAULT_LANGUAGE_ID, mode = "stream") {
  const safeLanguageId = normalizeLanguage(languageId);
  const envVoiceKey = `MURF_VOICE_${toLanguageEnvKey(safeLanguageId)}`;
  const builtInMap = mode === "generate"
    ? BUILTIN_MURF_GENERATE_VOICE_MAP
    : BUILTIN_MURF_STREAM_VOICE_MAP;

  return process.env[envVoiceKey]
    || MURF_VOICE_MAP[safeLanguageId]
    || builtInMap[safeLanguageId]
    || MURF_DEFAULT_VOICE_ID;
}

function getStreamVoiceOptions(languageId = DEFAULT_LANGUAGE_ID) {
  const language = getLanguageConfig(languageId);

  return {
    voiceId: getVoiceId(languageId, "stream"),
    model: "FALCON",
    locale: language.locale,
    format: "MP3",
    sampleRate: 24000,
    rate: MURF_SPEECH_RATE
  };
}

function getGenerateVoiceOptions(languageId = DEFAULT_LANGUAGE_ID) {
  const language = getLanguageConfig(languageId);

  return {
    voiceId: getVoiceId(languageId, "generate"),
    modelVersion: "GEN2",
    locale: language.locale,
    format: "MP3",
    sampleRate: 24000,
    rate: MURF_SPEECH_RATE
  };
}

async function tryStreamVoice(text, languageId, deliveryMode) {
  let lastError;

  for (const streamUrl of MURF_STREAM_URLS) {
    try {
      const response = await axios.post(
        streamUrl,
        {
          text,
          ...getStreamVoiceOptions(languageId)
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.MURF_API_KEY
          },
          responseType: "stream",
          timeout: MURF_REQUEST_TIMEOUT_MS
        }
      );

      return {
        stream: response.data,
        contentType: response.headers["content-type"] || "audio/mpeg",
        deliveryMode
      };
    } catch (error) {
      lastError = error;
      console.error("MURF FALCON STREAM ERROR:", getMurfErrorSummary(error));
    }
  }

  throw lastError;
}

async function tryGenerateVoice(text, languageId, deliveryMode) {
  const response = await axios.post(
    MURF_GENERATE_URL,
    {
      text,
      ...getGenerateVoiceOptions(languageId)
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.MURF_API_KEY
      },
      timeout: MURF_REQUEST_TIMEOUT_MS
    }
  );

  return {
    ...response.data,
    deliveryMode
  };
}

export async function streamVoice(text, languageId = DEFAULT_LANGUAGE_ID) {
  const safeLanguageId = normalizeLanguage(languageId);
  return tryStreamVoice(text, safeLanguageId, "falcon-stream");
}

export async function generateVoice(text, languageId = DEFAULT_LANGUAGE_ID) {
  const safeLanguageId = normalizeLanguage(languageId);

  try {
    return await tryGenerateVoice(text, safeLanguageId, "fallback-generate");
  } catch (error) {
    console.error("MURF GENERATE ERROR:", getMurfErrorSummary(error));

    if (safeLanguageId !== DEFAULT_LANGUAGE_ID) {
      return tryGenerateVoice(text, DEFAULT_LANGUAGE_ID, "fallback-generate-default-voice");
    }

    throw error;
  }
}

export async function downloadGeneratedAudio(audioUrl) {
  const response = await axios.get(audioUrl, {
    responseType: "stream",
    timeout: MURF_REQUEST_TIMEOUT_MS
  });

  return {
    stream: response.data,
    contentType: response.headers["content-type"] || "audio/mpeg",
    deliveryMode: "fallback-generate"
  };
}
