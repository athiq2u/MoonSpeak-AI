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

function getVoiceOptions(languageId = DEFAULT_LANGUAGE_ID) {
  const language = getLanguageConfig(languageId);

  return {
    voiceId: "en-US-natalie",
    model: "FALCON",
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
          ...getVoiceOptions(languageId)
        },
        {
          headers: {
            "Content-Type": "application/json",
            "api-key": process.env.MURF_API_KEY
          },
          responseType: "stream"
        }
      );

      console.log(`MURF FALCON STREAM SUCCESS: ${streamUrl} (${languageId})`);
      return {
        stream: response.data,
        contentType: response.headers["content-type"] || "audio/mpeg",
        deliveryMode
      };
    } catch (error) {
      lastError = error;
      console.log(`MURF FALCON STREAM FAILED: ${streamUrl} (${languageId})`);

      if (error.response) {
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }
  }

  throw lastError;
}

async function tryGenerateVoice(text, languageId, deliveryMode) {
  const response = await axios.post(
    MURF_GENERATE_URL,
    {
      text,
      ...getVoiceOptions(languageId)
    },
    {
      headers: {
        "Content-Type": "application/json",
        "api-key": process.env.MURF_API_KEY
      }
    }
  );

  console.log(`MURF GENERATE SUCCESS (${languageId})`);
  return {
    ...response.data,
    deliveryMode
  };
}

export async function streamVoice(text, languageId = DEFAULT_LANGUAGE_ID) {
  const safeLanguageId = normalizeLanguage(languageId);

  try {
    return await tryStreamVoice(text, safeLanguageId, "falcon-stream");
  } catch (error) {
    if (safeLanguageId !== DEFAULT_LANGUAGE_ID) {
      console.log(`MURF STREAM FALLBACK TO DEFAULT VOICE (${DEFAULT_LANGUAGE_ID})`);
      return tryStreamVoice(text, DEFAULT_LANGUAGE_ID, "falcon-stream-default-voice");
    }

    throw error;
  }
}

export async function generateVoice(text, languageId = DEFAULT_LANGUAGE_ID) {
  const safeLanguageId = normalizeLanguage(languageId);

  try {
    return await tryGenerateVoice(text, safeLanguageId, "fallback-generate");
  } catch (error) {
    console.log("===== MURF GENERATE ERROR =====");
    if (error.response) {
      console.log(error.response.data);
    } else {
      console.log(error.message);
    }

    if (safeLanguageId !== DEFAULT_LANGUAGE_ID) {
      console.log(`MURF GENERATE FALLBACK TO DEFAULT VOICE (${DEFAULT_LANGUAGE_ID})`);
      return tryGenerateVoice(text, DEFAULT_LANGUAGE_ID, "fallback-generate-default-voice");
    }

    throw error;
  }
}

export async function downloadGeneratedAudio(audioUrl) {
  const response = await axios.get(audioUrl, {
    responseType: "stream"
  });

  return {
    stream: response.data,
    contentType: response.headers["content-type"] || "audio/mpeg",
    deliveryMode: "fallback-generate"
  };
}
