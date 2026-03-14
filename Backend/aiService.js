import { GoogleGenerativeAI } from "@google/generative-ai";
import dotenv from "dotenv";
import { getLanguageConfig, normalizeLanguage } from "./languageConfig.js";

dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

function pickVariant(seedText, options) {
  const seed = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return options[seed % options.length];
}

function getFallbackReason(error) {
  if (error?.status === 429) {
    return "quota-exceeded";
  }

  if (error?.status === 401 || error?.status === 403) {
    return "auth-error";
  }

  return "service-unavailable";
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) {
    return [];
  }

  return history
    .filter((message) => (
      message
      && (message.role === "user" || message.role === "ai")
      && typeof message.text === "string"
      && message.text.trim()
    ))
    .slice(-6)
    .map((message) => ({
      role: message.role,
      text: message.text.trim()
    }));
}

function buildModelContents(history, text, languageId) {
  const language = getLanguageConfig(languageId);
  const introPrompt = `
You are a friendly, human-sounding speaking coach for a voice-first language learning app.

Tasks:
1. Reply naturally to the user's spoken message.
2. If the user's wording can be improved, weave in one short correction or smoother version naturally.
3. Keep the tone warm, encouraging, and practical.
4. Help the user practice speaking and listening, not just chat.
5. Use the recent conversation for context when it matters.
6. Do not end every reply with a follow-up question. Only ask one when it feels natural.
7. ${language.promptInstruction}

Format:
Write one short conversational response in plain text.
Do not use headings, labels, scores, bullet points, or markdown.
`.trim();

  return [
    {
      role: "user",
      parts: [{ text: introPrompt }]
    },
    ...history.map((message) => ({
      role: message.role === "ai" ? "model" : "user",
      parts: [{ text: message.text }]
    })),
    {
      role: "user",
      parts: [{ text }]
    }
  ];
}

function buildFallbackReply(text, history = [], languageId = "en-US") {
  const language = getLanguageConfig(languageId);
  const trimmedText = text.trim();
  const normalizedText = trimmedText.toLowerCase();
  const hasEndingPunctuation = /[.!?]$/.test(trimmedText);
  const naturalVersion = hasEndingPunctuation ? trimmedText : `${trimmedText}.`;
  const normalizedHistory = normalizeHistory(history);
  const previousUserMessage = [...normalizedHistory]
    .reverse()
    .find((message) => message.role === "user")?.text;
  const lowerNoPunctuation = normalizedText.replace(/[!?.,]/g, "").trim();
  const interviewFocused = /(introduce myself|introduction|interview|job interview|hr round|recruiter|tell me about yourself|strengths|weaknesses|experience|why should we hire you)/i.test(normalizedText)
    || /(introduce myself|introduction|interview|job interview|hr round|recruiter|tell me about yourself|strengths|weaknesses|experience|why should we hire you)/i.test(previousUserMessage || "");

  if (languageId !== "en-US" && languageId !== "en-IN") {
    if (/^(hi|hello|hey|good morning|good afternoon|good evening|namaste)\b/i.test(trimmedText)) {
      return language.fallback.greeting;
    }

    if (/thank(s| you)?\b/i.test(lowerNoPunctuation)) {
      return language.fallback.thanks;
    }

    if (/(help me|can you help|practice|improve|learn)/i.test(normalizedText)) {
      return language.fallback.help;
    }

    if (trimmedText.endsWith("?")) {
      return `${language.fallback.question} "${naturalVersion}"`;
    }

    return language.fallback.generic.replace("{text}", naturalVersion);
  }

  if (/^how are you\??$/i.test(trimmedText)) {
    return "I'm good, thanks for asking. \"How are you?\" sounds natural. How has your day been?";
  }

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(trimmedText)) {
    return pickVariant(trimmedText, [
      "Hey, nice to hear from you. Your greeting sounds natural.",
      "Hi, that sounds perfectly natural.",
      "Hello. That's a simple and natural way to start the conversation."
    ]);
  }

  if (/thank(s| you)?\b/i.test(lowerNoPunctuation)) {
    return pickVariant(trimmedText, [
      "You're welcome. That sounded natural.",
      "No problem. Your phrasing was clear and natural.",
      "You're welcome. That was easy to understand."
    ]);
  }

  if (/(help me|can you help|practice english|improve my english|improve english)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      "Of course. We can keep it simple and natural, one sentence at a time.",
      "Yes, definitely. Send me a sentence and I'll help you make it sound more natural.",
      "Absolutely. We can practice short, natural English together."
    ]);
  }

  if (/(introduce myself|introduction|interview)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      "Sure. In interviews, a short and confident introduction works best. Start with who you are, what you do, and one strength.",
      "That topic is useful for practice. A strong interview introduction should sound simple, calm, and specific.",
      "Good choice. Interview English sounds best when it is clear, direct, and confident."
    ]);
  }

  if (interviewFocused && trimmedText.endsWith("?")) {
    return pickVariant(trimmedText, [
      `That works as an interview question. A natural version is: "${naturalVersion}" In an interview, keep your answer structured and concise.`,
      `Good interview practice question. "${naturalVersion}" sounds clear. Try answering with two or three direct points.`,
      `That sounds like a real interview prompt. Your wording is fine, and a short confident answer will sound strongest.`
    ]);
  }

  if (interviewFocused) {
    return pickVariant(trimmedText, [
      `That fits interview English well. A polished version is: "${naturalVersion}" Keep the tone calm and professional.`,
      `Nice interview-style sentence. "${naturalVersion}" sounds clear. Try to keep your answer short and confident.`,
      `That works for interview practice. "${naturalVersion}" is easy to understand and sounds professional.`
    ]);
  }

  if (/what('?s| is) your name\??/i.test(normalizedText)) {
    return "I'm MoonSpeak AI. \"What's your name?\" sounds very natural too. What would you like to talk about?";
  }

  if (/where are you from\??/i.test(normalizedText)) {
    return "I'm online, so I don't come from one place, but your question sounds natural. How would you answer that question about yourself?";
  }

  if (languageId === "hi-IN" && /[\u0900-\u097F]/.test(trimmedText)) {
    const bilingualReplies = [
      `Nice bilingual sentence. You can say: "${naturalVersion}" Bilkul natural lag raha hai.`,
      `That mix of English and Hindi works well. "${naturalVersion}" sounds smooth.`,
      `Good code-switching. Your sentence is clear and natural: "${naturalVersion}".`
    ];
    return pickVariant(trimmedText, bilingualReplies);
  }

  if (previousUserMessage && trimmedText.endsWith("?")) {
    const questionReplies = [
      `Good question. Following up from "${previousUserMessage}", that sounds clear and natural.`,
      `That's a clear question. Earlier you mentioned "${previousUserMessage}" — the connection makes sense.`,
      `Nice follow-up. You can also say: "${naturalVersion}"`,
    ];
    return pickVariant(trimmedText, questionReplies);
  }

  if (trimmedText.endsWith("?")) {
    const genericQuestionReplies = [
      `That's a good question. You can also phrase it as: "${naturalVersion}"`,
      `Good question. Your phrasing is clear and natural.`,
      `That sounds natural. The question is easy to understand.`,
    ];
    return pickVariant(trimmedText, genericQuestionReplies);
  }

  const genericReplies = [
    `Got it. That came across clearly. You could also say: "${naturalVersion}"`,
    `That makes sense. A slightly more natural way might be: "${naturalVersion}"`,
    `Interesting. Your message is easy to understand. One smooth version is: "${naturalVersion}"`,
    `Nice. That's pretty natural already. You could also put it as: "${naturalVersion}"`,
    `I hear you. Another way to say that is: "${naturalVersion}"`,
  ];
  if (languageId === "hi-IN") {
    const bilingualGenericReplies = [
      `That sounds natural. You can say: "${naturalVersion}" Thoda Hindi mix karna bhi okay hai.`,
      `Good line. "${naturalVersion}" sounds clear, and bilingual delivery is fine here.`,
      `Nice. Your message is easy to follow. "${naturalVersion}" Keep it natural and confident.`
    ];
    return pickVariant(trimmedText, bilingualGenericReplies);
  }
  return pickVariant(trimmedText, genericReplies);
}

export async function generateReply(text, history = [], languageId = "en-US") {
  const normalizedHistory = normalizeHistory(history);
  const safeLanguageId = normalizeLanguage(languageId);

  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    const result = await model.generateContent({
      contents: buildModelContents(normalizedHistory, text, safeLanguageId)
    });

    const response = result.response.text();

    return {
      reply: response,
      source: "gemini",
      fallbackReason: null
    };

  } catch (error) {

    console.error("Gemini Error:", error);

    return {
      reply: buildFallbackReply(text, normalizedHistory, safeLanguageId),
      source: "local-fallback",
      fallbackReason: getFallbackReason(error)
    };

  }

}
