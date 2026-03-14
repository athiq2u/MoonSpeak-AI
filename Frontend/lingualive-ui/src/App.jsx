import { useState, useRef, useEffect, useEffectEvent, useMemo } from "react";
import "./App.css";
import chatbotAvatar from "./assets/ai-chatbot.svg";

const DEFAULT_PRODUCTION_API_BASE_URL = "https://moonspeak-ai-backend.onrender.com";
const isLocalDevHost = typeof window !== "undefined"
  && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const resolvedApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (isLocalDevHost ? "/api" : DEFAULT_PRODUCTION_API_BASE_URL);
const API_BASE_URL = resolvedApiBaseUrl.replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/speak`;
const API_HEALTH_URL = `${API_BASE_URL}/healthz`;
const MAX_CHARS = 500;
const API_TIMEOUT_MS = 12000;
const STORAGE_KEY = "lingualive_chat";
const DEFAULT_LANGUAGE_ID = "en-US";
const TUTOR_NAME = "Moon";

const LANGUAGE_OPTIONS = [
  {
    id: "en-US",
    label: "English (US)",
    recognition: "en-US",
    summary: "General English speaking practice",
    suggestions: [
      "Let's practice a job interview introduction.",
      "Help me sound more natural in English.",
      "Ask me a simple speaking question."
    ],
    demoPrompt: "Let's practice a short self introduction in English."
  },
  {
    id: "en-IN",
    label: "English (India)",
    recognition: "en-IN",
    summary: "Indian English speaking practice",
    suggestions: [
      "Help me sound confident in Indian English.",
      "Ask me an HR round question.",
      "Let's practice a short office introduction."
    ],
    demoPrompt: "Let's practice a confident interview introduction in Indian English."
  },
  {
    id: "hi-IN",
    label: "Hindi",
    recognition: "hi-IN",
    summary: "Hindi speaking practice",
    suggestions: [
      "Mujhse ek simple speaking question poochho.",
      "Hindi mein meri introduction practice karao.",
      "Hello everyone, aaj hum AI ke baare mein seekhenge."
    ],
    demoPrompt: "Hello everyone, aaj hum AI ke baare mein seekhenge."
  },
  {
    id: "es-ES",
    label: "Spanish",
    recognition: "es-ES",
    summary: "Spanish conversation practice",
    suggestions: [
      "Ayudame a sonar mas natural en espanol.",
      "Hazme una pregunta simple para hablar.",
      "Practiquemos una breve presentacion personal."
    ],
    demoPrompt: "Practiquemos una breve presentacion personal en espanol."
  },
  {
    id: "fr-FR",
    label: "French",
    recognition: "fr-FR",
    summary: "French conversation practice",
    suggestions: [
      "Aide-moi a parler plus naturellement en francais.",
      "Pose-moi une question simple pour parler.",
      "Pratiquons une courte presentation personnelle."
    ],
    demoPrompt: "Pratiquons une courte presentation personnelle en francais."
  },
  {
    id: "de-DE",
    label: "German",
    recognition: "de-DE",
    summary: "German conversation practice",
    suggestions: [
      "Hilf mir, natuerlicher Deutsch zu sprechen.",
      "Stell mir eine einfache Sprechfrage.",
      "Lass uns eine kurze Selbstvorstellung ueben."
    ],
    demoPrompt: "Lass uns eine kurze Selbstvorstellung auf Deutsch ueben."
  },
  {
    id: "it-IT",
    label: "Italian",
    recognition: "it-IT",
    summary: "Italian conversation practice",
    suggestions: [
      "Aiutami a parlare in modo piu naturale in italiano.",
      "Fammi una domanda semplice per parlare.",
      "Facciamo una breve presentazione personale."
    ],
    demoPrompt: "Facciamo una breve presentazione personale in italiano."
  },
  {
    id: "pt-BR",
    label: "Portuguese",
    recognition: "pt-BR",
    summary: "Portuguese conversation practice",
    suggestions: [
      "Ajude-me a soar mais natural em portugues.",
      "Faca uma pergunta simples para eu responder.",
      "Vamos praticar uma apresentacao pessoal curta."
    ],
    demoPrompt: "Vamos praticar uma apresentacao pessoal curta em portugues."
  },
  {
    id: "ja-JP",
    label: "Japanese",
    recognition: "ja-JP",
    summary: "Japanese conversation practice",
    suggestions: [
      "Nihongo de motto shizen ni hanaseru you ni tetsudatte.",
      "Kantan na kaiwa no shitsumon o shite.",
      "Mijikai jikoshoukai no renshuu o shiyou."
    ],
    demoPrompt: "Mijikai jikoshoukai no renshuu o shiyou."
  },
  {
    id: "ko-KR",
    label: "Korean",
    recognition: "ko-KR",
    summary: "Korean conversation practice",
    suggestions: [
      "Hangugeo reul deo jayeonseureopge malhago sip-eoyo.",
      "Gan danhan malhagi jilmun-eul haejuseyo.",
      "Jjalg-eun jagi sogae yeonseub-eul haejuseyo."
    ],
    demoPrompt: "Jjalg-eun jagi sogae yeonseub-eul haejuseyo."
  },
  {
    id: "zh-CN",
    label: "Chinese",
    recognition: "zh-CN",
    summary: "Chinese conversation practice",
    suggestions: [
      "Bang wo yong geng ziran de fangshi shuo zhongwen.",
      "Wen wo yi ge jiandan de kouyu wenti.",
      "Women lianxi yi xia jiandan de ziwo jieshao."
    ],
    demoPrompt: "Women lianxi yi xia jiandan de ziwo jieshao."
  },
  {
    id: "ar-SA",
    label: "Arabic",
    recognition: "ar-SA",
    summary: "Arabic conversation practice",
    suggestions: [
      "Saedni li atahaddath bishakl tabi'i akthar.",
      "Isalni sualan basitan lilmuhadatha.",
      "Linatadarrab ala ta'aruf qasir."
    ],
    demoPrompt: "Linatadarrab ala ta'aruf qasir."
  },
  {
    id: "bn-IN",
    label: "Bengali",
    recognition: "bn-IN",
    summary: "Bengali conversation practice",
    suggestions: [
      "Amake Banglay aro natural bhabe kotha bolte help koro.",
      "Amake ekta shohoj speaking question koro.",
      "Cholo ekta chhoto self introduction practice kori."
    ],
    demoPrompt: "Cholo ekta chhoto self introduction practice kori."
  },
  {
    id: "ta-IN",
    label: "Tamil",
    recognition: "ta-IN",
    summary: "Tamil speaking practice",
    suggestions: [
      "Enakku Tamil la innum natural aa pesa help pannunga.",
      "Oru simple speaking question kekkunga.",
      "Oru short introduction practice pannalaam."
    ],
    demoPrompt: "Oru short introduction practice pannalaam."
  },
  {
    id: "te-IN",
    label: "Telugu",
    recognition: "te-IN",
    summary: "Telugu speaking practice",
    suggestions: [
      "Nenu Telugu lo inka natural ga maatladadaniki help cheyyandi.",
      "Oka simple speaking question adugandi.",
      "Short self introduction practice cheddam."
    ],
    demoPrompt: "Short self introduction practice cheddam."
  }
];

const LANGUAGE_MAP = Object.fromEntries(LANGUAGE_OPTIONS.map((language) => [language.id, language]));

function getLanguage(id) {
  return LANGUAGE_MAP[id] || LANGUAGE_MAP[DEFAULT_LANGUAGE_ID];
}

function pickClientVariant(seedText, options, recentReplies = []) {
  const filtered = options.filter((option) => !recentReplies.includes(option));
  const pool = filtered.length > 0 ? filtered : options;
  const seed = [...seedText].reduce((total, char) => total + char.charCodeAt(0), 0);
  return pool[seed % pool.length];
}

function buildClientFallbackReply(text, history, languageId) {
  const trimmedText = text.trim();
  const normalizedText = trimmedText.toLowerCase();
  const recentAiReplies = history
    .filter((message) => message.role === "ai")
    .slice(-3)
    .map((message) => message.text);
  const activeLanguage = getLanguage(languageId);

  if (/^(hi|hello|hey|good morning|good afternoon|good evening)\b/i.test(trimmedText)) {
    return pickClientVariant(trimmedText, [
      `Hi, that sounds natural. Since you started well, add one more line about what you want to practice in ${activeLanguage.label} today.`,
      `Hello, that is a friendly and real sounding opener. A good next step is to say one small thing about your day or your goal.`,
      `Nice start. That greeting feels human and comfortable. Now continue with one simple sentence so the conversation feels complete.`
    ], recentAiReplies);
  }

  if (/(introduce myself|introduction|interview|job interview|hr round|tell me about yourself)/i.test(normalizedText)) {
    return pickClientVariant(trimmedText, [
      "That is a strong practice topic. For a good self introduction, start with who you are, then mention your current focus, and finish with one strength or achievement.",
      "Interview introductions sound best when they are clear and calm. Try giving your background, your current role or studies, and one reason you are a good fit.",
      "Good choice. A natural interview answer should sound professional but not memorized. Keep it short, specific, and easy to follow."
    ], recentAiReplies);
  }

  if (trimmedText.endsWith("?")) {
    return pickClientVariant(trimmedText, [
      `That is a clear question, and it sounds natural. You can also say: "${trimmedText}" with a calm tone and a short pause before the main point.`,
      "Good question. This works well in real conversation because it is direct and easy to understand. That is a strong speaking habit.",
      "That sounds natural. Questions like this are useful because they keep the conversation moving and feel human, not textbook-like."
    ], recentAiReplies);
  }

  if (/(today|meeting|office|work|project|school|college|friend|family|travel|presentation)/i.test(normalizedText)) {
    return pickClientVariant(trimmedText, [
      `That sounds realistic and useful for daily conversation. You could make it even stronger by adding one feeling or one detail about what happened.`,
      `This already feels like something you could say in real life. A small example or reaction would make it sound even more natural.`,
      `Good everyday sentence. The meaning is clear, and it sounds human. If you want, the next step is to say the same idea in a smoother way.`
    ], recentAiReplies);
  }

  return pickClientVariant(trimmedText, [
    `I understood that clearly. A more natural speaking pattern is to keep the sentence simple, then add one example or detail.`,
    `That idea makes sense and sounds understandable. To make it feel more fluent, try saying it with one short supporting sentence after it.`,
    `This is a useful line to practice. It already works, and with a small wording change it can sound even more natural in conversation.`
  ], recentAiReplies);
}

function App() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [chat, setChat] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE_ID);
  const [voiceDeliveryMode, setVoiceDeliveryMode] = useState("idle");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState("");
  const [isTutorExcited, setIsTutorExcited] = useState(false);
  const [backendStatus, setBackendStatus] = useState(isLocalDevHost ? "checking" : "offline");

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const utteranceRef = useRef(null);
  const mediaSourceUrlRef = useRef(null);
  const abortControllerRef = useRef(null);
  const tutorExciteTimerRef = useRef(null);
  const activeLanguage = getLanguage(selectedLanguage);
  const practiceMissions = useMemo(() => ([
    {
      title: "Warm Up",
      prompt: activeLanguage.demoPrompt
    },
    {
      title: "Story Mode",
      prompt: `Help me tell a short story in ${activeLanguage.label} with better fluency and natural transitions.`
    },
    {
      title: "Interview Drill",
      prompt: "Give me one realistic interview question, then help me improve my answer with better structure and vocabulary."
    },
    {
      title: "Confidence Boost",
      prompt: `I feel nervous while speaking ${activeLanguage.label}. Give me one confidence routine and one speaking exercise.`
    }
  ]), [activeLanguage]);
  const leftPanelFocusPrompts = useMemo(() => ([
    {
      label: "Icebreaker",
      prompt: `Give me one natural 2-line conversation starter in ${activeLanguage.label}.`
    },
    {
      label: "Daily Talk",
      prompt: `Help me explain my day in ${activeLanguage.label} in a natural way.`
    },
    {
      label: "Interview",
      prompt: "Ask me one interview question and improve my answer in simple, natural language."
    }
  ]), [activeLanguage]);
  const coachGuideTips = useMemo(() => ([
    `Keep answers short, clear, and natural in ${activeLanguage.label}.`,
    "Add one real detail so your speaking sounds more human.",
    "If you pause, restart with one simple sentence and continue calmly."
  ]), [activeLanguage]);
  const chatStats = useMemo(() => {
    const userMessages = chat.filter((message) => message.role === "user");
    const aiMessages = chat.filter((message) => message.role === "ai");
    const totalAiWords = aiMessages.reduce((total, message) => {
      const wordCount = message.text.trim().split(/\s+/).filter(Boolean).length;
      return total + wordCount;
    }, 0);

    return {
      turns: userMessages.length,
      aiReplies: aiMessages.length,
      avgAiWords: aiMessages.length ? Math.round(totalAiWords / aiMessages.length) : 0
    };
  }, [chat]);
  const tutorState = isListening
    ? "listening"
    : isLoading
      ? "thinking"
      : isSpeaking
        ? "speaking"
        : "ready";

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat, isLoading]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(chat));
    } catch {
      // storage unavailable — ignore
    }
  }, [chat]);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
      if (tutorExciteTimerRef.current) {
        clearTimeout(tutorExciteTimerRef.current);
      }
      if (mediaSourceUrlRef.current) {
        URL.revokeObjectURL(mediaSourceUrlRef.current);
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const triggerTutorExcitement = () => {
    if (tutorExciteTimerRef.current) {
      clearTimeout(tutorExciteTimerRef.current);
    }
    setIsTutorExcited(true);
    tutorExciteTimerRef.current = setTimeout(() => setIsTutorExcited(false), 900);
  };

  const cleanupAudioPlayback = () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;

    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.removeAttribute("src");
      audioRef.current.load();
    }

    if (mediaSourceUrlRef.current) {
      URL.revokeObjectURL(mediaSourceUrlRef.current);
      mediaSourceUrlRef.current = null;
    }
  };

  const speakWithBrowserVoice = useEffectEvent((replyText, languageId) => {
    if (typeof window === "undefined" || !window.speechSynthesis || !replyText) {
      return false;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(replyText);
    utterance.lang = getLanguage(languageId).recognition || languageId;
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    return true;
  });

  const streamAudio = useEffectEvent(async (url) => {
    if (!url) {
      return;
    }

    cleanupAudioPlayback();
    setIsAudioLoading(true);
    setIsSpeaking(false);
    setVoiceDeliveryMode("connecting");

    const controller = new AbortController();
    abortControllerRef.current = controller;

    try {
      const response = await fetch(url, { signal: controller.signal });

      if (!response.ok || !response.body) {
        throw new Error("Audio stream could not be started.");
      }

      const detectedMode = response.headers.get("X-MoonSpeak-Voice-Mode") || "falcon-stream";
      setVoiceDeliveryMode(detectedMode);

      const mediaType = "audio/mpeg";
      const audio = audioRef.current;

      if (!audio || !window.MediaSource || !MediaSource.isTypeSupported(mediaType)) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        mediaSourceUrlRef.current = blobUrl;
        audio.src = blobUrl;
        audio.play().catch(() => {});
        setIsAudioLoading(false);
        return;
      }

      const mediaSource = new MediaSource();
      const objectUrl = URL.createObjectURL(mediaSource);
      mediaSourceUrlRef.current = objectUrl;

      await new Promise((resolve, reject) => {
        mediaSource.addEventListener("sourceopen", resolve, { once: true });
        mediaSource.addEventListener("error", () => reject(new Error("Audio player failed to initialize.")), { once: true });
        audio.src = objectUrl;
      });

      const sourceBuffer = mediaSource.addSourceBuffer(mediaType);
      const reader = response.body.getReader();
      const queue = [];
      let readingDone = false;
      let playbackStarted = false;

      const appendNextChunk = () => {
        if (sourceBuffer.updating || queue.length === 0) {
          if (readingDone && !sourceBuffer.updating && queue.length === 0 && mediaSource.readyState === "open") {
            mediaSource.endOfStream();
          }
          return;
        }

        sourceBuffer.appendBuffer(queue.shift());
      };

      sourceBuffer.addEventListener("updateend", () => {
        if (!playbackStarted && audio.paused) {
          audio.play().catch(() => {});
          playbackStarted = true;
          setIsAudioLoading(false);
        }
        appendNextChunk();
      });

      while (true) {
        const { value, done } = await reader.read();
        if (done) {
          readingDone = true;
          appendNextChunk();
          break;
        }

        queue.push(value.buffer.slice(value.byteOffset, value.byteOffset + value.byteLength));
        appendNextChunk();
      }
    } catch (error) {
      if (error.name !== "AbortError") {
        console.error(error);
        setAssistantNotice("Live voice is taking a short break. You can keep practicing while text coaching stays active.");
        setVoiceDeliveryMode("error");
      }
    } finally {
      setIsAudioLoading(false);
    }
  });

  useEffect(() => {
    if (audioUrl) {
      streamAudio(audioUrl);
    }
  }, [audioUrl]);

  const checkBackendConnection = useEffectEvent(async () => {
    setBackendStatus("checking");

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 5000);
      const response = await fetch(API_HEALTH_URL, { signal: controller.signal });
      window.clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      if (response.ok && contentType.includes("application/json")) {
        setBackendStatus("online");
        return true;
      }

      setBackendStatus("offline");
      return false;
    } catch {
      setBackendStatus("offline");
      return false;
    }
  });

  useEffect(() => {
    checkBackendConnection();
  }, [checkBackendConnection]);

  const requestReply = async (message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) return;

    setIsLoading(true);
    setAudioUrl("");
    setIsSpeaking(false);
    setText("");
    setAssistantNotice("");

    setChat(prev => [...prev, { role: "user", text: trimmedMessage }]);

    const applyClientFallback = (notice) => {
      setBackendStatus("offline");
      const clientReply = buildClientFallbackReply(trimmedMessage, chat.slice(-6), selectedLanguage);
      setChat(prev => [
        ...prev,
        {
          role: "ai",
          text: clientReply,
          source: "client-fallback",
          isFallback: true
        }
      ]);
      setAudioUrl("");
      const browserVoiceWorked = speakWithBrowserVoice(clientReply, selectedLanguage);
      setVoiceDeliveryMode(browserVoiceWorked ? "browser-voice" : "error");
      setAssistantNotice(notice || (browserVoiceWorked
        ? "Smart practice is active with built-in voice support."
        : "Smart practice is active with built-in coaching support."));
    };

    try {
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), API_TIMEOUT_MS);
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmedMessage, history: chat.slice(-6), language: selectedLanguage }),
        signal: controller.signal,
      });
      window.clearTimeout(timeoutId);

      const contentType = response.headers.get("content-type") || "";
      const isJsonResponse = contentType.includes("application/json");
      const responseBody = isJsonResponse
        ? await response.json()
        : await response.text();

      if (!isJsonResponse) {
        const looksLikeHtml = typeof responseBody === "string" && /<html|<!doctype/i.test(responseBody);
        if (looksLikeHtml) {
          applyClientFallback(
            isLocalDevHost
              ? "Live coach is starting up, so demo mode is active for now."
              : "Live coach is still being connected for this deployment, so demo mode is active right now."
          );
          return;
        }

        applyClientFallback("Live coach is taking a short break, so demo mode is active right now.");
        return;
      }

      const data = responseBody;
      setBackendStatus("online");

      if (!response.ok) {
        throw new Error(data.error || "The server could not process your message.");
      }

      const nextReply = data.reply || "I heard you, but could not build a reply just now.";
      setChat(prev => [
        ...prev,
        {
          role: "ai",
          text: nextReply,
          source: data.replySource || "unknown",
          isFallback: Boolean(data.isFallback)
        }
      ]);
      setAudioUrl(data.audioStreamUrl || data.audioFile || "");
      setAssistantNotice(data.assistantNotice || "");

    } catch (error) {
      console.error(error);
      const isNetworkError = error instanceof TypeError && /fetch/i.test(error.message || "");
      const isTimeoutError = error?.name === "AbortError";
      applyClientFallback(
        isTimeoutError
          ? "Live coach took a little too long, so demo mode is active for now."
          :
        isNetworkError
          ? "Connection is taking a short break, so demo mode is active for now."
          : "Demo mode is active right now while the live coach resets."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = () => requestReply(text);

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const clearChat = () => {
    setChat([]);
    cleanupAudioPlayback();
    setAudioUrl("");
    setVoiceDeliveryMode("idle");
    setAssistantNotice("");
  };

  const runLanguageDemo = () => {
    requestReply(activeLanguage.demoPrompt);
  };

  const runCoachPrompt = () => {
    triggerTutorExcitement();
    requestReply(activeLanguage.suggestions[0] || activeLanguage.demoPrompt);
  };

  const runChallengePrompt = () => {
    triggerTutorExcitement();
    requestReply(activeLanguage.suggestions[1] || activeLanguage.demoPrompt);
  };

  const runRoleplayPrompt = () => {
    triggerTutorExcitement();
    requestReply(activeLanguage.suggestions[2] || activeLanguage.demoPrompt);
  };

  const startListening = () => {
    if (isLoading || isListening) return;
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAssistantNotice("Voice input works best in Chrome. You can still use text practice anytime.");
      return;
    }
    setAssistantNotice("");
    setIsListening(true);
    const recognition = new SpeechRecognition();
    recognition.lang = activeLanguage.recognition;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setText(speechText);
      requestReply(speechText);
    };
    recognition.onerror = () => {
      setAssistantNotice("I could not catch that clearly. Try speaking once more or use text practice.");
      setIsListening(false);
    };
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const isActive = isListening || isLoading || isSpeaking;
  const charsLeft = MAX_CHARS - text.length;

  return (
    <main className="app-shell">
      <header className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy-panel">
            <p className="eyebrow">Powered by Murf Falcon</p>
            <h1>MoonSpeak AI</h1>
            <p className="hero-copy">
              Meet {TUTOR_NAME}, your robot voice tutor powered by Murf Falcon. Pick a language, speak naturally, get a quick coaching reply, and hear it back instantly.
            </p>

            <div className="use-case-row" aria-label="Supported practice modes">
              <span className="use-case-pill">14 Language Options</span>
              <span className="use-case-pill">Falcon Streaming</span>
              <span className="use-case-pill">Browser Speech Input</span>
            </div>

            <p className="falcon-note">
              Current language: {activeLanguage.label}. If a Murf locale is unavailable, audio falls back to the default English voice.
            </p>

            <div className="status-row">
              <span className="status-pill">
                <span className="status-dot" />
                Coach Live
              </span>
              <span className={`status-pill status-pill-muted ${isActive ? "status-pill-active" : ""}`}>
                {isListening ? "🎙 Listening…" : isLoading ? "⏳ Thinking…" : isSpeaking ? "🔊 Speaking…" : "Ready"}
              </span>
              <div className={`signal-bars ${isActive ? "signal-bars-active" : ""}`} aria-hidden="true">
                <span /><span /><span /><span />
              </div>
            </div>

            {assistantNotice && (
              <div className="message-banner message-banner-info" role="status">
                {assistantNotice}
              </div>
            )}
          </div>

          <div className="hero-figure" aria-hidden="true">
            <div className="hero-figure-glow hero-figure-glow-one" />
            <div className="hero-figure-glow hero-figure-glow-two" />
            <div className="hero-figure-card">
              <div className="hero-figure-badge">AI Speaking Coach</div>
              <div className="hero-figure-avatar-wrap">
                <div className="hero-figure-ring" />
                <img
                  className="hero-figure-avatar"
                  src={chatbotAvatar}
                  alt=""
                />
              </div>
              <div className="hero-figure-metrics">
                <div className="hero-metric-tile">
                  <span className="hero-metric-label">Language</span>
                  <strong>{activeLanguage.label}</strong>
                </div>
                <div className="hero-metric-tile">
                  <span className="hero-metric-label">Turns</span>
                  <strong>{chatStats.turns}</strong>
                </div>
                <div className="hero-metric-tile">
                  <span className="hero-metric-label">Coach Mode</span>
                  <strong>{isListening ? "Listening" : isLoading ? "Thinking" : isSpeaking ? "Speaking" : "Ready"}</strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="workspace-panel">
        <section className="chat-panel">
          <div className="panel-heading">
            <div>
              <h2>Conversation</h2>
            </div>
            {chat.length > 0 && (
              <button className="clear-button" onClick={clearChat}>Clear</button>
            )}
          </div>

          <div className="left-focus-card" aria-label="Today's speaking focus">
            <div className="left-focus-head">
              <p className="left-focus-kicker">Today's focus</p>
              <p className="left-focus-copy">
                Quick warmup ideas for {activeLanguage.label}. Tap one to start instantly.
              </p>
            </div>
            <div className="left-focus-actions">
              {leftPanelFocusPrompts.map((item) => (
                <button
                  key={item.label}
                  type="button"
                  className="left-focus-btn"
                  onClick={() => requestReply(item.prompt)}
                  disabled={isLoading || isListening}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div className="stats-strip" aria-live="polite">
            <span className="stats-chip">Turns: {chatStats.turns}</span>
            <span className="stats-chip">AI replies: {chatStats.aiReplies}</span>
            <span className="stats-chip">Avg words/reply: {chatStats.avgAiWords}</span>
          </div>

          <div className="chat-feed">
            {chat.length === 0 && !isLoading ? (
              <div className="empty-state">
                <p className="empty-icon">💬</p>
                <p className="empty-copy">Choose a language and start speaking with {TUTOR_NAME}.</p>
                <label className="language-picker" htmlFor="language-picker-empty">
                  <span className="language-picker-label">Practice language</span>
                  <select
                    id="language-picker-empty"
                    className="language-select"
                    value={selectedLanguage}
                    onChange={(event) => setSelectedLanguage(event.target.value)}
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language.id} value={language.id}>{language.label}</option>
                    ))}
                  </select>
                  <span className="language-picker-hint">{activeLanguage.summary}</span>
                </label>
                <div className="suggestion-chips">
                  {activeLanguage.suggestions.map(s => (
                    <button key={s} className="chip" onClick={() => requestReply(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              chat.map((message, index) => (
                <div key={index} className={`chat-bubble chat-bubble-${message.role}`}>
                  <div className="chat-meta-row">
                    <span className="chat-role">{message.role === "user" ? "You" : TUTOR_NAME}</span>
                    {message.role === "ai" && (
                      <span className={`chat-source-badge ${message.isFallback ? "chat-source-badge-fallback" : "chat-source-badge-gemini"}`}>
                        {message.isFallback
                          ? "Coach Assist"
                          : "AI Coach"}
                      </span>
                    )}
                  </div>
                  <p>{message.text}</p>
                </div>
              ))
            )}

            {isLoading && (
              <div className="chat-bubble chat-bubble-ai">
                <span className="chat-role">{TUTOR_NAME}</span>
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>
        </section>

        <section className="composer-panel">
          <div className="panel-heading">
            <div>
              <h2>Voice First</h2>
            </div>
          </div>

          <aside className={`tutor-side tutor-side-${tutorState} ${isTutorExcited ? "tutor-side-excited" : ""}`} aria-label={`${TUTOR_NAME} tutor side assistant`}>
            <div className="tutor-avatar-wrap" aria-hidden="true">
              <div className="tutor-aura" />
              <button
                type="button"
                className="tutor-fab"
                onClick={triggerTutorExcitement}
                title="Tap Moon"
                aria-label="Tap tutor avatar"
              >
                <img
                  className={`tutor-chatbot-pic tutor-chatbot-pic-${tutorState}`}
                  src={chatbotAvatar}
                  alt="AI chatbot avatar"
                />
              </button>
              <div className="tutor-wave tutor-wave-one" />
              <div className="tutor-wave tutor-wave-two" />
              <div className="tutor-wave tutor-wave-three" />
            </div>

            <div className="tutor-mini-copy">
              <p className="tutor-mini-title">{TUTOR_NAME}</p>
              <p className="tutor-mini-status">{isListening ? "Listening" : isLoading ? "Thinking" : isSpeaking ? "Speaking" : "Ready"}</p>
              <div className="tutor-mini-actions">
                <button type="button" className="tutor-mini-btn" onClick={runCoachPrompt}>Coach me</button>
                <button type="button" className="tutor-mini-btn" onClick={runChallengePrompt}>Challenge</button>
                <button type="button" className="tutor-mini-btn" onClick={runRoleplayPrompt}>Roleplay</button>
              </div>
            </div>
          </aside>

          <label className="language-picker language-picker-compact" htmlFor="language-picker-composer">
            <span className="language-picker-label">Practice language</span>
            <select
              id="language-picker-composer"
              className="language-select"
              value={selectedLanguage}
              onChange={(event) => setSelectedLanguage(event.target.value)}
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </select>
            <span className="language-picker-hint">{activeLanguage.summary}</span>
          </label>

          <div className="voice-launch-card">
            <p className="voice-launch-label">Primary input · {activeLanguage.label}</p>
            <button
              onClick={startListening}
              className={`primary-button voice-primary-button ${isListening ? "mic-button-active" : ""}`}
              disabled={isLoading || isListening}
            >
              {isListening ? "🔴 Listening…" : "🎙 Start Speaking"}
            </button>
            <p className="voice-copy">
              Speak in {activeLanguage.label}. Typing is still available as backup.
            </p>
          </div>

          <div className="mission-card">
            <p className="mission-title">Practice Missions</p>
            <div className="mission-grid">
              {practiceMissions.map((mission) => (
                <button
                  key={mission.title}
                  type="button"
                  className="mission-btn"
                  onClick={() => {
                    triggerTutorExcitement();
                    requestReply(mission.prompt);
                  }}
                  disabled={isLoading || isListening}
                >
                  {mission.title}
                </button>
              ))}
            </div>
          </div>

          <div className="coach-guide-card">
            <p className="coach-guide-title">Coach Guide</p>
            <div className="coach-guide-list">
              {coachGuideTips.map((tip) => (
                <div key={tip} className="coach-guide-item">
                  <span className="coach-guide-dot" aria-hidden="true" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          <textarea
            autoFocus
            id="practice-input"
            value={text}
            placeholder="Type only if you want to use text instead of voice…"
            onChange={(e) => setText(e.target.value.slice(0, MAX_CHARS))}
            onKeyDown={handleKeyDown}
            className="composer-input"
            rows={5}
            disabled={isLoading || isListening}
          />
          <p className={`char-count ${charsLeft < 50 ? "char-count-warn" : ""}`}>
            {charsLeft} / {MAX_CHARS}
          </p>

          <div className="action-row">
            <button
              onClick={handleSend}
              className="secondary-button"
              disabled={isLoading || isListening || !text.trim()}
            >
              {isLoading ? <span className="btn-spinner" /> : null}
              {isLoading ? "Sending…" : "Send"}
            </button>
          </div>

          {audioUrl && (
            <div className="audio-card">
              <div className="audio-card-header">
                <span className="reply-label">🔊 Live voice playback</span>
                <span className={`delivery-badge delivery-badge-${voiceDeliveryMode}`}>
                  {voiceDeliveryMode === "falcon-stream"
                    ? "Falcon Live"
                      : voiceDeliveryMode === "falcon-stream-default-voice"
                        ? "English Voice Fallback"
                    : voiceDeliveryMode === "fallback-generate"
                      ? "Fallback Audio"
                        : voiceDeliveryMode === "fallback-generate-default-voice"
                          ? "Generated English Fallback"
                            : voiceDeliveryMode === "browser-voice"
                              ? "Browser Voice"
                      : voiceDeliveryMode === "connecting"
                        ? "Connecting"
                        : voiceDeliveryMode === "error"
                                ? "Voice Pause"
                          : "Ready"}
                </span>
              </div>
              <p className="voice-copy">
                {isAudioLoading
                  ? "Buffering low-latency audio..."
                  : voiceDeliveryMode === "falcon-stream"
                    ? "Streaming directly from Murf Falcon."
                    : voiceDeliveryMode === "falcon-stream-default-voice"
                      ? "The selected locale was unavailable, so playback switched to the default English voice."
                    : voiceDeliveryMode === "fallback-generate"
                      ? "Falcon was unavailable, so playback switched to generated audio."
                      : voiceDeliveryMode === "fallback-generate-default-voice"
                        ? "The selected locale and Falcon stream were unavailable, so playback switched to generated English audio."
                      : voiceDeliveryMode === "browser-voice"
                        ? "Backend audio is unavailable, so playback switched to the browser voice on this device."
                      : voiceDeliveryMode === "error"
                        ? "Live voice paused for a moment, but coaching is still active."
                      : "Voice playback is ready."}
              </p>
              <audio
                ref={audioRef}
                controls
                className="audio-player"
                onPlay={() => setIsSpeaking(true)}
                onPause={() => setIsSpeaking(false)}
                onEnded={() => setIsSpeaking(false)}
              />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

export default App;
