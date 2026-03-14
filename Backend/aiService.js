import { GoogleGenerativeAI } from "@google/generative-ai";
import axios from "axios";
import dotenv from "dotenv";
import { getLanguageConfig, normalizeLanguage } from "./languageConfig.js";

dotenv.config();

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const OPENAI_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";
const AI_PROVIDER_PRIORITY = (process.env.AI_PROVIDER_PRIORITY || "gemini-first").toLowerCase();
const OPENAI_CHAT_URL = "https://api.openai.com/v1/chat/completions";
const genAI = process.env.GEMINI_API_KEY
  ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  : null;

function buildProviderOrder() {
  if (AI_PROVIDER_PRIORITY === "openai-first") {
    return [
      { name: "openai", fn: generateWithOpenAI },
      { name: "gemini", fn: generateWithGemini }
    ];
  }

  return [
    { name: "gemini", fn: generateWithGemini },
    { name: "openai", fn: generateWithOpenAI }
  ];
}

function pickVariant(seedText, options, recentReplies = []) {
  const filteredOptions = options.filter((option) => !recentReplies.includes(option));
  const candidateOptions = filteredOptions.length > 0 ? filteredOptions : options;
  const seed = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return candidateOptions[seed % candidateOptions.length];
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

function buildCoachPrompt(languageId) {
  const language = getLanguageConfig(languageId);

  return `
You are a friendly, human-sounding speaking coach for a voice-first language learning app.

Tasks:
1. Reply naturally to the user's spoken message.
2. If the user's wording can be improved, weave in one short correction or smoother version naturally.
3. Keep the tone warm, encouraging, and practical.
4. Help the user practice speaking and listening, not just chat.
5. Use the recent conversation for context when it matters.
6. Do not end every reply with a follow-up question. Only ask one when it feels natural.
7. ${language.promptInstruction}
8. Give meaningful, content-rich coaching with concrete phrasing the user can reuse.

Format:
Write a natural response with 3 to 5 short sentences in plain text.
Target around 30 to 80 words unless the user only says a tiny greeting.
Do not use headings, labels, scores, bullet points, or markdown.
`.trim();
}

function countWords(value = "") {
  return value
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .length;
}

function isTinyGreeting(text = "") {
  return /^(hi|hello|hey|good morning|good afternoon|good evening|thanks|thank you)[!.]?$/i.test(text.trim());
}

function buildEnrichmentTail(userText, languageId, history = []) {
  const recentAiReplies = normalizeHistory(history)
    .filter((message) => message.role === "ai")
    .slice(-3)
    .map((message) => message.text);
  const trimmedText = userText.trim();
  const normalizedText = trimmedText.toLowerCase();

  if (languageId !== "en-US" && languageId !== "en-IN") {
    return pickVariant(trimmedText, [
      getLanguageConfig(languageId).fallback.help,
      getLanguageConfig(languageId).fallback.question,
      getLanguageConfig(languageId).fallback.generic.replace("{text}", trimmedText || "a short response")
    ], recentAiReplies);
  }

  if (isTinyGreeting(trimmedText)) {
    return pickVariant(trimmedText, [
      "You can keep going with one simple sentence about your day, your work, or what you want to practice.",
      "A natural next step is to add a small detail so the conversation feels more real and less abrupt.",
      "Try following it with one easy line about what is on your mind today."
    ], recentAiReplies);
  }

  if (/(introduce myself|introduction|interview|job interview|hr round|tell me about yourself)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      "A strong next step is to say your background first, then your current role or focus, and finish with one strength or result.",
      "To sound more confident, keep your answer in three parts: who you are, what you do, and why that matters for the role.",
      "The most natural interview answers sound clear and specific, so add one real example instead of only general statements."
    ], recentAiReplies);
  }

  if (/(today|meeting|office|work|project|friend|family|school|college|presentation|weekend|travel)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      "If you want to sound more natural, add one feeling or reaction because that makes everyday speech feel more human.",
      "A good speaking habit here is to add one concrete detail, since small details make real conversation sound smoother.",
      "You can make it stronger by adding what happened next or how you felt about it."
    ], recentAiReplies);
  }

  if (trimmedText.endsWith("?")) {
    return pickVariant(trimmedText, [
      "That kind of clear question works well in real conversation because it is direct and easy to answer.",
      "Questions like this sound best when they stay short, clear, and natural, and yours already does that well.",
      "This is a useful speaking pattern because it keeps the conversation moving naturally."
    ], recentAiReplies);
  }

  return pickVariant(trimmedText, [
    "If you want, we can turn that into a more natural everyday response and practice two or three variations.",
    "A good next step is to say the same idea in a slightly simpler way and compare which version sounds more natural.",
    "This is a useful sentence to practice because it can be reused in real conversation with only small changes."
  ], recentAiReplies);
}

function enrichReply(reply, userText, languageId, history = []) {
  const trimmedReply = (reply || "").trim();

  if (!trimmedReply) {
    return trimmedReply;
  }

  const minWords = isTinyGreeting(userText) ? 14 : 28;
  if (countWords(trimmedReply) >= minWords) {
    return trimmedReply;
  }

  return `${trimmedReply} ${buildEnrichmentTail(userText, languageId, history)}`.trim();
}

function buildModelContents(history, text, languageId) {
  const introPrompt = buildCoachPrompt(languageId);

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

function buildOpenAIMessages(history, text, languageId) {
  const prompt = buildCoachPrompt(languageId);

  return [
    {
      role: "system",
      content: prompt
    },
    ...history.map((message) => ({
      role: message.role === "ai" ? "assistant" : "user",
      content: message.text
    })),
    {
      role: "user",
      content: text
    }
  ];
}

function makeProviderError(message, status = 503) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function getHttpStatus(error) {
  return error?.status || error?.response?.status;
}

function getProviderErrorCode(error) {
  return error?.response?.data?.error?.code || null;
}

function getProviderErrorSummary(provider, error) {
  return {
    provider,
    status: getHttpStatus(error) || null,
    code: getProviderErrorCode(error),
    message: error?.response?.data?.error?.message || error?.message || "Unknown provider error"
  };
}

async function generateWithOpenAI(text, history, languageId) {
  if (!process.env.OPENAI_API_KEY) {
    throw makeProviderError("OPENAI_API_KEY is missing.", 401);
  }

  const response = await axios.post(
    OPENAI_CHAT_URL,
    {
      model: OPENAI_MODEL,
      messages: buildOpenAIMessages(history, text, languageId),
      temperature: 0.7,
      max_tokens: 320
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json"
      }
    }
  );

  const reply = response?.data?.choices?.[0]?.message?.content?.trim();

  if (!reply) {
    throw makeProviderError("OpenAI returned an empty response.");
  }

  return reply;
}

async function generateWithGemini(text, history, languageId) {
  if (!genAI) {
    throw makeProviderError("GEMINI_API_KEY is missing.", 401);
  }

  const model = genAI.getGenerativeModel({
    model: GEMINI_MODEL
  });

  const result = await model.generateContent({
    contents: buildModelContents(history, text, languageId)
  });

  const reply = result.response.text()?.trim();

  if (!reply) {
    throw makeProviderError("Gemini returned an empty response.");
  }

  return reply;
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
  const recentAiReplies = normalizedHistory
    .filter((message) => message.role === "ai")
    .slice(-3)
    .map((message) => message.text);
  const lowerNoPunctuation = normalizedText.replace(/[!?.,]/g, "").trim();
  const interviewFocused = /(introduce myself|introduction|interview|job interview|hr round|recruiter|tell me about yourself|strengths|weaknesses|experience|why should we hire you)/i.test(normalizedText)
    || /(introduce myself|introduction|interview|job interview|hr round|recruiter|tell me about yourself|strengths|weaknesses|experience|why should we hire you)/i.test(previousUserMessage || "");
  const dailyLifeFocused = /(today|yesterday|office|college|school|weekend|friend|family|meeting|presentation|travel|trip|work|project)/i.test(normalizedText);

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
    return pickVariant(trimmedText, [
      'I\'m doing well, thanks. "How are you?" sounds completely natural, and it is a good everyday opener. You can keep the conversation going by adding one small detail about your day.',
      'I\'m good, thanks for asking. Your question sounds natural and friendly. A nice next step would be something simple like, "My day has been busy, but good."',
      'Doing well here. "How are you?" is exactly the kind of easy, natural question people use in real conversation. If you want, we can practice how to answer it more smoothly too.'
    ], recentAiReplies);
  }

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(trimmedText)) {
    return pickVariant(trimmedText, [
      'Hey, nice to hear from you. That greeting sounds natural and relaxed. If you want to continue naturally, add one simple line about what you are doing right now.',
      'Hi, that sounds perfectly natural. Real conversations often start exactly like that. You could continue with something like, "I wanted to practice speaking for a few minutes today."',
      'Hello, that is a smooth and friendly way to begin. It already sounds human and comfortable. Now try adding one more sentence so the conversation feels more complete.',
      'Good start. That kind of greeting feels normal and easy in daily conversation. A natural next step is to share a small thought, plan, or question.'
    ], recentAiReplies);
  }

  if (/thank(s| you)?\b/i.test(lowerNoPunctuation)) {
    return pickVariant(trimmedText, [
      'You\'re welcome. That sounded natural and polite. Short responses like that work very well in real conversation.',
      'No problem. Your phrasing was clear, friendly, and easy to understand. That is exactly the tone people expect in everyday English.',
      'You\'re welcome. That came across smoothly. If you want to sound even warmer, you can also say, "Thanks, I really appreciate it."'
    ], recentAiReplies);
  }

  if (/(help me|can you help|practice english|improve my english|improve english)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      'Of course. We can keep it simple and natural, one sentence at a time. I can help you with fluency, confidence, and more realistic phrasing.',
      'Yes, definitely. Send me a sentence, short story, or interview answer, and I will help make it sound smoother and more natural.',
      'Absolutely. We can practice natural English together like a real conversation, not just grammar correction. That usually helps people speak with more confidence.',
      'Sure, I can help with that. The best way is to practice short, useful sentences that you could actually say in daily life, at work, or in an interview.'
    ], recentAiReplies);
  }

  if (/(introduce myself|introduction|interview)/i.test(normalizedText)) {
    return pickVariant(trimmedText, [
      'Sure. In interviews, a short and confident introduction works best. Start with who you are, what you do, and one strength with a real example behind it.',
      'That topic is useful for practice. A strong interview introduction should sound simple, calm, and specific. It should not feel memorized or too dramatic.',
      'Good choice. Interview English sounds best when it is clear, direct, and confident. A strong answer usually has three parts: background, current focus, and value you bring.',
      'Yes, let\'s work on that. The best self-introductions sound professional but still human. Think of it as a short personal summary, not a speech.'
    ], recentAiReplies);
  }

  if (interviewFocused && trimmedText.endsWith("?")) {
    return pickVariant(trimmedText, [
      `That works as an interview question. A natural version is: "${naturalVersion}" In an interview, keep your answer structured, calm, and concise so it sounds confident.`,
      `Good interview practice question. "${naturalVersion}" sounds clear. A strong answer usually has two or three direct points and one concrete example.`,
      `That sounds like a real interview prompt. Your wording is fine, and the best answer will sound strongest if it feels specific rather than memorized.`,
      `That is a realistic interview-style question. The language works well. When you answer, focus on clarity first, then add one result or achievement to make it convincing.`
    ], recentAiReplies);
  }

  if (interviewFocused) {
    return pickVariant(trimmedText, [
      `That fits interview English well. A polished version is: "${naturalVersion}" Keep the tone calm, professional, and easy to follow.`,
      `Nice interview-style sentence. "${naturalVersion}" sounds clear. Try to keep the answer short, confident, and supported by one meaningful example.`,
      `That works for interview practice. "${naturalVersion}" is easy to understand and sounds professional. The next step is making it sound more personal and less rehearsed.`,
      `This is good interview practice. Your sentence already has the right direction. To sound stronger, keep the wording simple and focus on what you actually did or learned.`
    ], recentAiReplies);
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
      `Good question. Following up from "${previousUserMessage}", that sounds clear and natural. It feels like a real continuation of the conversation.`,
      `That's a clear question. Earlier you mentioned "${previousUserMessage}" and this follow-up connects well. That kind of flow makes speech sound more natural.`,
      `Nice follow-up. You can also say: "${naturalVersion}" That version sounds smooth and conversational.`,
      `That works well as a follow-up question. It feels connected to what you said earlier, which is a big part of sounding natural in real conversation.`,
    ];
    return pickVariant(trimmedText, questionReplies, recentAiReplies);
  }

  if (trimmedText.endsWith("?")) {
    const genericQuestionReplies = [
      `That's a good question. You can also phrase it as: "${naturalVersion}" That version sounds clear and natural.`,
      `Good question. Your phrasing is clear and natural. This is the kind of sentence people use easily in normal conversation.`,
      `That sounds natural. The question is easy to understand, and the tone feels human and direct.`,
      `That question works well. It is simple, natural, and easy for the listener to follow. Those are strong habits for spoken English.`,
    ];
    return pickVariant(trimmedText, genericQuestionReplies, recentAiReplies);
  }

  if (dailyLifeFocused) {
    return pickVariant(trimmedText, [
      `That sounds like something you could say in real life. "${naturalVersion}" is clear, natural, and easy to follow. If you want, we can make it sound a little warmer or more confident depending on the situation.`,
      `Nice everyday sentence. "${naturalVersion}" feels practical and human, not textbook-like. That is a good direction for spoken English.`,
      `That works well for daily conversation. Your idea is clear, and the sentence already sounds usable in a real situation. A small detail or example would make it even stronger.`,
      `This feels realistic and natural. "${naturalVersion}" would make sense in a conversation about work, study, or daily life. That kind of useful practice helps a lot.`
    ], recentAiReplies);
  }

  const genericReplies = [
    `Got it. That came across clearly. You could also say: "${naturalVersion}" That version feels smooth and natural in conversation.`,
    `That makes sense. A slightly more natural way might be: "${naturalVersion}" It keeps the meaning clear and sounds a bit more polished.`,
    `Interesting. Your message is easy to understand. One smooth version is: "${naturalVersion}" That wording feels relaxed and human.`,
    `Nice. That's pretty natural already. You could also put it as: "${naturalVersion}" Both versions work, but this one flows a little better.`,
    `I hear you. Another way to say that is: "${naturalVersion}" It sounds clear, conversational, and easy for the listener to follow.`,
    `That works well. Your idea is clear, and the sentence is understandable. With one small wording change, it can sound even more natural in spoken English.`,
  ];
  if (languageId === "hi-IN") {
    const bilingualGenericReplies = [
      `That sounds natural. You can say: "${naturalVersion}" Thoda Hindi mix karna bhi okay hai.`,
      `Good line. "${naturalVersion}" sounds clear, and bilingual delivery is fine here.`,
      `Nice. Your message is easy to follow. "${naturalVersion}" Keep it natural and confident.`
    ];
    return pickVariant(trimmedText, bilingualGenericReplies, recentAiReplies);
  }
  return pickVariant(trimmedText, genericReplies, recentAiReplies);
}

export async function generateReply(text, history = [], languageId = "en-US") {
  const normalizedHistory = normalizeHistory(history);
  const safeLanguageId = normalizeLanguage(languageId);
  const providerErrors = [];

  const providers = buildProviderOrder();
  for (const provider of providers) {
    try {
      const reply = await provider.fn(text, normalizedHistory, safeLanguageId);

      return {
        reply: enrichReply(reply, text, safeLanguageId, normalizedHistory),
        source: provider.name,
        fallbackReason: null
      };

    } catch (error) {
      providerErrors.push({ provider: provider.name, error });
      console.error(`${provider.name} Error:`, getProviderErrorSummary(provider.name, error));
    }
  }

  const primaryProviderError = providerErrors.find((entry) => getHttpStatus(entry.error) === 429)
    || providerErrors.find((entry) => [401, 403].includes(getHttpStatus(entry.error)))
    || providerErrors[0];

  const fallbackDetails = providerErrors.map((entry) => ({
    provider: entry.provider,
    status: getHttpStatus(entry.error) || null,
    code: getProviderErrorCode(entry.error)
  }));

  return {
    reply: enrichReply(buildFallbackReply(text, normalizedHistory, safeLanguageId), text, safeLanguageId, normalizedHistory),
    source: "local-fallback",
    fallbackReason: getFallbackReason(primaryProviderError?.error),
    fallbackDetails
  };

}
