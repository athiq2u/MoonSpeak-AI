import { memo, useState, useRef, useEffect, useMemo, useCallback } from "react";
import "./App.css";
import chatbotAvatar from "./assets/ai-chatbot.svg";

const DEFAULT_PRODUCTION_API_BASE_URL = "https://moonspeak-ai-backend.onrender.com";
const isLocalDevHost = typeof window !== "undefined"
  && ["localhost", "127.0.0.1"].includes(window.location.hostname);
const resolvedApiBaseUrl = import.meta.env.VITE_API_BASE_URL
  || (isLocalDevHost ? "/api" : DEFAULT_PRODUCTION_API_BASE_URL);
const API_BASE_URL = resolvedApiBaseUrl.replace(/\/$/, "");
const API_URL = `${API_BASE_URL}/speak`;
const TTS_STREAM_URL = `${API_BASE_URL}/tts-stream`;
const MAX_CHARS = 500;
const API_TIMEOUT_MS = 12000;
const DAILY_TURN_GOAL = 8;
const FOCUS_SECONDS_GOAL = 300;
const STORAGE_KEY = "lingualive_chat";
const STREAK_STORAGE_KEY = "lingualive_streak";
const ACHIEVEMENTS_STORAGE_KEY = "lingualive_achievements";
const THEME_STORAGE_KEY = "lingualive_theme";
const FEATURE_TOUR_STORAGE_KEY = "lingualive_feature_tour_seen";
const FEATURE_TOUR_VERSION = "2026.03.17";
const DEFAULT_LANGUAGE_ID = "en-US";
const TUTOR_NAME = "Moon";
const MANUAL_PLAYBACK_NOTICE = "Tap play to hear the reply on this phone. Some mobile browsers block autoplay until you interact.";
const MAX_RENDERED_MESSAGES = 120;
const MAX_PERSISTED_MESSAGES = 240;

const OPENING_GREETING_BY_LANGUAGE = {
  "en-US": "Welcome to MoonSpeak platform. I am Moon, your speaking coach. Let us practice and level up your confidence today.",
  "en-IN": "Welcome to MoonSpeak platform. I am Moon, your speaking coach. Let us practice and level up your confidence today.",
  "hi-IN": "MoonSpeak me aapka swagat hai. Main Moon hoon, aapki speaking coach. Aaj confidence ke saath practice karte hain.",
  "es-ES": "Bienvenido a MoonSpeak. Soy Moon, tu coach de habla. Vamos a practicar y mejorar tu confianza hoy.",
  "fr-FR": "Bienvenue sur MoonSpeak. Je suis Moon, votre coach de parole. Pratiquons et renforcons votre confiance aujourd'hui.",
  "de-DE": "Willkommen bei MoonSpeak. Ich bin Moon, dein Sprachcoach. Lass uns uben und heute dein Selbstvertrauen starken.",
  "it-IT": "Benvenuto su MoonSpeak. Sono Moon, la tua coach di conversazione. Facciamo pratica e aumentiamo la tua sicurezza oggi.",
  "pt-BR": "Bem-vindo ao MoonSpeak. Eu sou Moon, sua coach de fala. Vamos praticar e aumentar sua confianca hoje.",
  "ja-JP": "MoonSpeak e youkoso. Watashi wa Moon, anata no speaking coach desu. Kyou wa jishin wo takameru renshuu wo shimashou.",
  "ko-KR": "MoonSpeak e osin geol hwanyeonghamnida. Jeoneun Moon, dangsinui speaking coach imnida. Oneul jasin-gameul keyeobsi dallyeobwayo.",
  "zh-CN": "Huanying lai dao MoonSpeak. Wo shi Moon, ni de kouyu jiaolian. Women jintian yiqi lianxi bing tisheng zixin.",
  "ar-SA": "Marhaban bik fi MoonSpeak. Ana Moon, mudarribat al-muhadatha ladayk. Haya natadarrab wa nuqawwi thiqatak alyawm.",
  "bn-IN": "MoonSpeak e shagotom. Ami Moon, tomar speaking coach. Aaj amra practice kore confidence barabo.",
  "ta-IN": "MoonSpeak ku varaverkiren. Naan Moon, ungal speaking coach. Inru namma practice panni ungal confidence ah uyarthalaam."
};

function getOpeningGreeting(languageId) {
  return OPENING_GREETING_BY_LANGUAGE[languageId] || OPENING_GREETING_BY_LANGUAGE[DEFAULT_LANGUAGE_ID];
}

function getLocalDateKey() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function normalizeSpeechText(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function calculateShadowAccuracy(expectedText, spokenText) {
  const expectedWords = normalizeSpeechText(expectedText);
  const spokenWords = normalizeSpeechText(spokenText);

  if (expectedWords.length === 0 || spokenWords.length === 0) {
    return { score: 0, wordResults: [] };
  }

  const spokenSet = new Set(spokenWords);
  const wordResults = expectedWords.map((word) => ({ word, matched: spokenSet.has(word) }));
  const matchedCount = wordResults.filter((wr) => wr.matched).length;
  const score = Math.min(100, Math.round((matchedCount / expectedWords.length) * 100));
  return { score, wordResults };
}

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

function createMessageId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

function buildSmartFollowUps(messageText, languageLabel) {
  const text = (messageText || "").toLowerCase();

  if (/interview|hr|role|recruiter|experience|strength|weakness/.test(text)) {
    return [
      "Give me one stronger version of my interview answer.",
      "Ask me a follow-up interview question.",
      "Score my answer for confidence and clarity."
    ];
  }

  if (/story|describe|daily|day|weekend|travel|meeting|project/.test(text)) {
    return [
      "Help me say this more naturally.",
      "Give me 2 better vocabulary alternatives.",
      "Ask me a follow-up so I can continue speaking."
    ];
  }

  return [
    `Give me a short speaking challenge in ${languageLabel}.`,
    "Ask me one natural follow-up question.",
    "Give me one better way to say my last response."
  ];
}

const WELCOME_CHIPS = [
  { label: "🎤 Start practicing", prompt: "Let's start a quick speaking practice right now." },
  { label: "🌍 What can you teach?", prompt: "What languages and skills can you help me practice?" },
  { label: "⚡ Give me a challenge", prompt: "Give me a fun speaking challenge to try right now." },
];

const REFRESH_TASKS = [
  {
    lead: "Refresh Challenge",
    task: "Describe your mood in exactly 7 words.",
    prompt: "My mood in 7 words is:"
  },
  {
    lead: "Quick Voice Drill",
    task: "Introduce yourself like you're meeting a new teammate.",
    prompt: "Hi, I am introducing myself to a new teammate."
  },
  {
    lead: "Confidence Boost",
    task: "Say one thing you did well today.",
    prompt: "One thing I did well today is"
  },
  {
    lead: "Speaking Sprint",
    task: "Explain your current goal in two short sentences.",
    prompt: "My current goal is"
  }
];

function pickRefreshTask() {
  return REFRESH_TASKS[Math.floor(Math.random() * REFRESH_TASKS.length)];
}

const SCENARIO_CARDS = [
  {
    id: "interview",
    icon: "💼",
    title: "Job Interview",
    prompt: "Let's run a mock job interview. Ask me one HR question, then coach my answer with better structure and confident vocabulary."
  },
  {
    id: "travel",
    icon: "✈️",
    title: "Travel Talk",
    prompt: "Help me practice real travel English — at the airport, booking a hotel, or ordering food at a restaurant."
  },
  {
    id: "story",
    icon: "📖",
    title: "Storytelling",
    prompt: "Help me tell a short personal story in a natural, engaging way with smooth transitions and confident delivery."
  },
  {
    id: "debate",
    icon: "🎤",
    title: "Debate Club",
    prompt: "Give me a strong opinion topic to argue. Then help me structure my point clearly and speak with conviction."
  }
];

const VOCABULARY_TIPS = [
  { word: "Instead of 'good'", tip: "Use: excellent, fantastic, outstanding, wonderful, impressive" },
  { word: "Instead of 'bad'", tip: "Use: poor, disappointing, inadequate, unsatisfactory, weak" },
  { word: "Instead of 'big'", tip: "Use: enormous, vast, massive, substantial, significant" },
  { word: "Instead of 'small'", tip: "Use: tiny, minimal, compact, limited, modest" },
  { word: "Instead of 'very'", tip: "Use: extremely, incredibly, remarkably, exceptionally, incredibly" }
];

const PRONUNCIATION_GUIDES = [
  { pattern: "th sounds", guide: "Place tongue between teeth. 'th' in 'think' is voiceless; 'th' in 'this' is voiced." },
  { pattern: "r vs l", guide: "R: roll tongue back. L: tongue behind top teeth. Practice: 'red' vs 'led'" },
  { pattern: "word stress", guide: "English is stress-timed. Stress key syllables: PHO-to, pho-TOG-ra-phy" },
  { pattern: "linking sounds", guide: "Connect words smoothly. 'Did you' → 'didja', 'want to' → 'wanna'" },
  { pattern: "schwa sound ə", guide: "The most common vowel sound. Appears in unstressed syllables: 'about', 'across'" }
];

const GRAMMAR_TIPS = [
  { topic: "Present Perfect", tip: "Use when action started in past and continues to now. 'I have lived here for 5 years.'" },
  { topic: "Phrasal Verbs", tip: "Verb + preposition = new meaning. 'look up' ≠ 'look'. Master 50-100 common ones." },
  { topic: "Conditionals", tip: "If + simple present, will + verb (future). 'If you study, you will pass.'" },
  { topic: "Articles (a/an/the)", tip: "a/an: indefinite (one of many). the: definite (specific one). Practice with nouns." },
  { topic: "Subject-verb agreement", tip: "Singular subject → singular verb. 'The team is strong' not 'are strong.'" }
];

const CONVERSATION_TOPICS = [
  { emoji: "🍕", topic: "Food & Restaurants", prompt: "Let's discuss your favorite cuisines and where you love to eat." },
  { emoji: "🎬", topic: "Movies & Entertainment", prompt: "Share what movies or shows you enjoy and why." },
  { emoji: "✈️", topic: "Travel & Culture", prompt: "Tell me about a place you've visited or dream to visit." },
  { emoji: "🎯", topic: "Goals & Ambitions", prompt: "What are your short-term and long-term goals?" },
  { emoji: "👥", topic: "People & Relationships", prompt: "Talk about a meaningful person in your life." },
  { emoji: "🎓", topic: "Learning & Skills", prompt: "What new skill would you love to learn and why?" }
];

const DIFFICULTY_LEVELS = [
  { level: "Beginner", emoji: "🟢", description: "Simple words, short sentences, basic topics", prompt: "Let's use simple, everyday English. Ask me easy questions." },
  { level: "Intermediate", emoji: "🟡", description: "Varied vocabulary, complex sentences, current events", prompt: "Let's speak at intermediate level with varied vocabulary." },
  { level: "Advanced", emoji: "🔴", description: "Sophisticated vocabulary, nuanced topics, idiomatic phrases", prompt: "Challenge me with advanced-level English and sophisticated vocabulary." }
];

const FEATURE_TOUR_STEPS = [
  {
    title: "What is new",
    description: "MoonSpeak now includes a guided onboarding flow so users can quickly discover main features.",
    points: [
      "Voice-first practice with instant replies.",
      "Practice and extras workspaces are easier to navigate.",
      "Progress, streak, and challenge tools are ready out of the box."
    ],
    page: "practice",
    selector: '[data-tour="workspace-nav"]'
  },
  {
    title: "Voice first practice",
    description: "Start speaking in one tap, switch language quickly, and get coach responses instantly.",
    points: [
      "Tap Start Speaking in Voice First.",
      "Use Replay Last to hear the latest response.",
      "Type in the composer anytime as backup."
    ],
    page: "practice",
    selector: '[data-tour="voice-first"]'
  },
  {
    title: "Extras and tools",
    description: "Use ready-made scenarios, difficulty levels, and conversation topics to train faster.",
    points: [
      "Try Interview, Travel, Story, and Debate prompts.",
      "Pick Beginner, Intermediate, or Advanced level.",
      "Use quick tools for grammar and pronunciation practice."
    ],
    page: "extras",
    selector: '[data-tour="extras-scenarios"]'
  },
  {
    title: "Coach lab",
    description: "Track progress and run challenge drills to improve confidence over time.",
    points: [
      "Monitor XP, goals, and streak progress.",
      "Use Coach Wheel for random speaking tasks.",
      "Run Shadow Drill for voice matching."
    ],
    page: "coach-lab",
    selector: '[data-tour="coach-progress"]'
  }
];

function formatPracticeTime(totalSeconds) {
  if (totalSeconds < 60) { return `${totalSeconds}s`; }
  return `${Math.floor(totalSeconds / 60)}m ${totalSeconds % 60}s`;
}

const WelcomeBubble = memo(function WelcomeBubble({
  message,
  tutorName,
  onChipClick,
  onAvatarTap,
  welcomePlaybackHint
}) {
  const [displayedText, setDisplayedText] = useState("");
  const [isDone, setIsDone] = useState(false);
  const [isAvatarPoked, setIsAvatarPoked] = useState(false);
  const fullText = message.text;

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayedText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(interval);
        setIsDone(true);
      }
    }, 22);
    return () => clearInterval(interval);
  }, [fullText]);

  const handleAvatarTap = () => {
    setIsAvatarPoked(true);
    window.setTimeout(() => setIsAvatarPoked(false), 420);
    onAvatarTap?.();
  };

  return (
    <div className="chat-message-row chat-message-row-ai">
      <button
        type="button"
        className={`chat-avatar-button ${isAvatarPoked ? "chat-avatar-button-poked" : ""} ${!isDone ? "chat-avatar-button-typing" : ""}`}
        onClick={handleAvatarTap}
        title="Tap Moon"
        aria-label="Tap Moon avatar"
      >
        <img src={chatbotAvatar} alt="" className="chat-avatar-image" />
      </button>

      <div className="chat-bubble chat-bubble-ai welcome-bubble">
        <div className="chat-meta-row">
          <span className="chat-role">{tutorName}</span>
        </div>
        <p>
          {displayedText}
          {!isDone && <span className="welcome-cursor" aria-hidden="true">▌</span>}
        </p>
        {isDone && (
          <div className="welcome-chips">
            {WELCOME_CHIPS.map((chip) => (
              <button
                key={chip.label}
                type="button"
                className="welcome-chip"
                onClick={() => onChipClick(chip.prompt)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        )}
        {isDone && welcomePlaybackHint ? (
          <p className="welcome-playback-hint">{welcomePlaybackHint}</p>
        ) : null}
      </div>
    </div>
  );
});

function getSourceBadge(message) {
  if (message.isFallback) {
    return { label: "Built-in Coach", tone: "fallback" };
  }

  if (message.source === "openrouter") {
    return { label: "OpenRouter AI", tone: "openrouter" };
  }

  if (message.source === "openai") {
    return { label: "OpenAI", tone: "openai" };
  }

  if (message.source === "gemini") {
    return { label: "Gemini", tone: "gemini" };
  }

  return { label: "AI Coach", tone: "gemini" };
}

const ChatBubble = memo(function ChatBubble({ message, tutorName, onTaskClick }) {
  const [isAvatarPoked, setIsAvatarPoked] = useState(false);
  const isAiMessage = message.role === "ai";
  const isRefreshTask = message.source === "refresh-task" && typeof message.taskPrompt === "string";
  const sourceBadge = getSourceBadge(message);

  const handleAvatarTap = () => {
    setIsAvatarPoked(true);
    window.setTimeout(() => setIsAvatarPoked(false), 420);
  };

  return (
    <div className={`chat-message-row chat-message-row-${message.role}`}>
      {isAiMessage && (
        <button
          type="button"
          className={`chat-avatar-button ${isAvatarPoked ? "chat-avatar-button-poked" : ""}`}
          onClick={handleAvatarTap}
          title="Tap Moon"
          aria-label="Tap Moon avatar"
        >
          <img src={chatbotAvatar} alt="" className="chat-avatar-image" />
        </button>
      )}

      <div className={`chat-bubble chat-bubble-${message.role}`}>
        <div className="chat-meta-row">
          <span className="chat-role">{message.role === "user" ? "You" : tutorName}</span>
          {isAiMessage && (
            <span className={`chat-source-badge chat-source-badge-${sourceBadge.tone}`}>
              {sourceBadge.label}
            </span>
          )}
        </div>
        <p>{message.text}</p>
        {isRefreshTask && (
          <div className="refresh-task-actions">
            <button
              type="button"
              className="welcome-chip"
              onClick={() => onTaskClick(message.taskPrompt)}
            >
              Try this task
            </button>
          </div>
        )}
      </div>
    </div>
  );
});

const FeatureTourModal = memo(function FeatureTourModal({
  isOpen,
  step,
  stepIndex,
  totalSteps,
  isLastStep,
  spotlightRect,
  onBack,
  onNext,
  onSkip,
  onOpenPage
}) {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="feature-tour-overlay" role="dialog" aria-modal="true" aria-label="Feature tour">
      {spotlightRect ? (
        <div
          className="feature-tour-spotlight"
          style={{
            top: `${spotlightRect.top}px`,
            left: `${spotlightRect.left}px`,
            width: `${spotlightRect.width}px`,
            height: `${spotlightRect.height}px`
          }}
          aria-hidden="true"
        />
      ) : null}
      <div className="feature-tour-card">
        <p className="feature-tour-kicker">Feature Tour</p>
        <h3>{step.title}</h3>
        <p className="feature-tour-copy">{step.description}</p>
        <ul className="feature-tour-points">
          {step.points.map((point) => (
            <li key={point}>{point}</li>
          ))}
        </ul>

        <div className="feature-tour-progress" aria-hidden="true">
          {Array.from({ length: totalSteps }).map((_, idx) => (
            <span
              key={`tour-dot-${idx + 1}`}
              className={`feature-tour-dot ${idx === stepIndex ? "feature-tour-dot-active" : ""}`}
            />
          ))}
        </div>

        <div className="feature-tour-actions">
          <button type="button" className="panel-ghost-btn" onClick={onSkip}>Skip</button>
          {step.page ? (
            <button
              type="button"
              className="panel-ghost-btn"
              onClick={() => onOpenPage(step.page)}
            >
              Open section
            </button>
          ) : null}
          <button
            type="button"
            className="panel-ghost-btn"
            onClick={onBack}
            disabled={stepIndex === 0}
          >
            Back
          </button>
          <button type="button" className="primary-button" onClick={onNext}>
            {isLastStep ? "Finish" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
});

function App() {
  const [text, setText] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [chat, setChat] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];

      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .slice(-MAX_PERSISTED_MESSAGES)
        .map((message) => ({
          ...message,
          id: message?.id || createMessageId()
        }));
    } catch {
      return [];
    }
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [activeWorkspacePage, setActiveWorkspacePage] = useState("practice");
  const [selectedLanguage, setSelectedLanguage] = useState(DEFAULT_LANGUAGE_ID);
  const [themeMode, setThemeMode] = useState(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      return saved === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const [voiceDeliveryMode, setVoiceDeliveryMode] = useState("idle");
  const [isAudioLoading, setIsAudioLoading] = useState(false);
  const [assistantNotice, setAssistantNotice] = useState("");
  const [isTutorExcited, setIsTutorExcited] = useState(false);
  const [backendStatus, setBackendStatus] = useState("offline");
  const [needsManualPlayback, setNeedsManualPlayback] = useState(false);
  const [dailyStreak, setDailyStreak] = useState(() => {
    try {
      const saved = localStorage.getItem(STREAK_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : null;

      if (parsed && typeof parsed.count === "number" && typeof parsed.lastActive === "string") {
        return {
          count: Math.max(1, parsed.count),
          lastActive: parsed.lastActive
        };
      }
    } catch {
      // storage unavailable - keep defaults
    }

    return {
      count: 1,
      lastActive: ""
    };
  });
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [coachWheelResult, setCoachWheelResult] = useState("");
  const [shadowCountdown, setShadowCountdown] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [sessionBestXp, setSessionBestXp] = useState(0);
  const [sessionBestStreak, setSessionBestStreak] = useState(1);
  const [shadowDrillResult, setShadowDrillResult] = useState(null);
  const [unlockedAchievementIds, setUnlockedAchievementIds] = useState(() => {
    try {
      const saved = localStorage.getItem(ACHIEVEMENTS_STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  });
  const [voiceTurns, setVoiceTurns] = useState(0);
  const [bestShadowScore, setBestShadowScore] = useState(0);
  const [languagesUsed, setLanguagesUsed] = useState(() => new Set([DEFAULT_LANGUAGE_ID]));
  const [practiceSeconds, setPracticeSeconds] = useState(0);
  const [isFeatureTourOpen, setIsFeatureTourOpen] = useState(false);
  const [featureTourStepIndex, setFeatureTourStepIndex] = useState(0);
  const [featureTourSpotlight, setFeatureTourSpotlight] = useState(null);

  const chatEndRef = useRef(null);
  const audioRef = useRef(null);
  const openingAudioRef = useRef(null);
  const utteranceRef = useRef(null);
  const mediaSourceUrlRef = useRef(null);
  const abortControllerRef = useRef(null);
  const tutorExciteTimerRef = useRef(null);
  const heroFigureRef = useRef(null);
  const heroFigureCardRef = useRef(null);
  const hasPlayedOpenGreetingRef = useRef(false);
  const openGreetingTimeoutRef = useRef(null);
  const latestReplyForVoiceRef = useRef({ text: "", languageId: DEFAULT_LANGUAGE_ID });
  const wheelSpinTimerRef = useRef(null);
  const shadowCountdownTimerRef = useRef(null);
  const shadowRecognitionRef = useRef(null);
  const shadowTranscriptRef = useRef("");
  const shadowExpectedTextRef = useRef("");
  const sessionTimerRef = useRef(null);
  const hasStartedPracticeRef = useRef(false);
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
  const coachWheelPrompts = useMemo(() => ([
    activeLanguage.demoPrompt,
    ...activeLanguage.suggestions,
    `Give me a 30-second speaking warmup in ${activeLanguage.label}.`,
    `Challenge me with one real-life speaking scenario in ${activeLanguage.label}.`,
    `Help me upgrade this sentence in ${activeLanguage.label}: I want to speak better every day.`
  ]), [activeLanguage]);
  const labChallengePacks = useMemo(() => ([
    {
      title: "Fluency Sprint",
      prompt: `Run a 60-second fluency sprint in ${activeLanguage.label}. Give me one prompt and then evaluate clarity, pace, and confidence.`
    },
    {
      title: "Interview Pressure",
      prompt: `Give me a tough interview question in ${activeLanguage.label}, then coach me to improve structure and impact.`
    },
    {
      title: "Story Builder",
      prompt: `Help me build a 4-step short story in ${activeLanguage.label}: setup, conflict, turning point, ending.`
    },
    {
      title: "Debate Booster",
      prompt: `Start a mini debate in ${activeLanguage.label}. Ask my opinion, challenge it once, then help me strengthen my argument.`
    }
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
  const achievementCatalog = useMemo(() => {
    const definitions = [
      {
        id: "turns-10",
        title: "Conversation Starter",
        description: "Complete 10 turns in conversation.",
        unlocked: chatStats.turns >= 10
      },
      {
        id: "streak-3",
        title: "Streak Builder",
        description: "Reach a 3-day speaking streak.",
        unlocked: dailyStreak.count >= 3
      },
      {
        id: "session-xp-100",
        title: "Century Sprint",
        description: "Earn 100 XP in a single session.",
        unlocked: sessionXp >= 100
      },
      {
        id: "voice-5",
        title: "Voice First",
        description: "Complete 5 turns using voice input.",
        unlocked: voiceTurns >= 5
      },
      {
        id: "shadow-master",
        title: "Shadow Master",
        description: "Score 90% or higher on a Shadow Drill.",
        unlocked: bestShadowScore >= 90
      },
      {
        id: "explorer",
        title: "Language Explorer",
        description: "Practice in 3 or more different languages.",
        unlocked: languagesUsed.size >= 3
      }
    ];

    return definitions.map((achievement) => ({
      ...achievement,
      unlocked: achievement.unlocked || unlockedAchievementIds.includes(achievement.id)
    }));
  }, [chatStats.turns, dailyStreak.count, sessionXp, voiceTurns, bestShadowScore, languagesUsed, unlockedAchievementIds]);
  const tutorState = isListening
    ? "listening"
    : isLoading
      ? "thinking"
      : isSpeaking
        ? "speaking"
        : "ready";
  const latestAiMessage = [...chat].reverse().find((message) => message.role === "ai") || null;
  const smartFollowUps = useMemo(() => {
    if (!latestAiMessage) {
      return [];
    }

    return buildSmartFollowUps(latestAiMessage.text, activeLanguage.label);
  }, [latestAiMessage, activeLanguage.label]);
  const recentUserPrompts = useMemo(() => {
    const seen = new Set();
    return [...chat]
      .reverse()
      .filter((message) => message.role === "user" && typeof message.text === "string")
      .map((message) => message.text.trim())
      .filter((prompt) => {
        if (!prompt || seen.has(prompt)) {
          return false;
        }
        seen.add(prompt);
        return true;
      })
      .slice(0, 5);
  }, [chat]);
  const aiStatusTone = latestAiMessage?.isFallback
    ? "warning"
    : backendStatus === "online"
      ? "live"
      : backendStatus === "checking"
        ? "checking"
        : "offline";
  const aiStatusLabel = latestAiMessage?.isFallback
    ? "Built-in coach"
    : backendStatus === "online"
      ? "AI live"
      : backendStatus === "checking"
        ? "Checking AI"
        : "Backend offline";
    const activeFeatureTourStep = FEATURE_TOUR_STEPS[featureTourStepIndex] || FEATURE_TOUR_STEPS[0];
    const isLastFeatureTourStep = featureTourStepIndex === FEATURE_TOUR_STEPS.length - 1;

    const updateFeatureTourSpotlight = useCallback(() => {
      if (!isFeatureTourOpen || typeof document === "undefined") {
        setFeatureTourSpotlight(null);
        return;
      }

      const selector = activeFeatureTourStep?.selector;

      if (!selector) {
        setFeatureTourSpotlight(null);
        return;
      }

      const targetElement = document.querySelector(selector);

      if (!targetElement) {
        setFeatureTourSpotlight(null);
        return;
      }

      const rect = targetElement.getBoundingClientRect();
      const padding = 8;
      setFeatureTourSpotlight({
        top: Math.max(6, rect.top - padding),
        left: Math.max(6, rect.left - padding),
        width: Math.max(20, rect.width + (padding * 2)),
        height: Math.max(20, rect.height + (padding * 2))
      });
    }, [activeFeatureTourStep, isFeatureTourOpen]);

    const closeFeatureTour = useCallback((markSeen = true) => {
      setIsFeatureTourOpen(false);

      if (!markSeen) {
        return;
      }

      try {
        localStorage.setItem(FEATURE_TOUR_STORAGE_KEY, FEATURE_TOUR_VERSION);
      } catch {
        // storage unavailable - ignore
      }
    }, []);

    const openFeatureTour = useCallback(() => {
      setFeatureTourStepIndex(0);
      setIsFeatureTourOpen(true);
    }, []);

    const handleFeatureTourNext = useCallback(() => {
      if (isLastFeatureTourStep) {
        closeFeatureTour(true);
        return;
      }

      setFeatureTourStepIndex((currentStep) => Math.min(FEATURE_TOUR_STEPS.length - 1, currentStep + 1));
    }, [closeFeatureTour, isLastFeatureTourStep]);

    const handleFeatureTourBack = useCallback(() => {
      setFeatureTourStepIndex((currentStep) => Math.max(0, currentStep - 1));
    }, []);

    const handleFeatureTourSkip = useCallback(() => {
      closeFeatureTour(true);
    }, [closeFeatureTour]);

    useEffect(() => {
      try {
        const seenVersion = localStorage.getItem(FEATURE_TOUR_STORAGE_KEY);

        if (seenVersion !== FEATURE_TOUR_VERSION) {
          setFeatureTourStepIndex(0);
          setIsFeatureTourOpen(true);
        }
      } catch {
        setFeatureTourStepIndex(0);
        setIsFeatureTourOpen(true);
      }
    }, []);

    useEffect(() => {
      if (!isFeatureTourOpen || typeof document === "undefined") {
        return undefined;
      }

      const previousOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";

      return () => {
        document.body.style.overflow = previousOverflow;
      };
    }, [isFeatureTourOpen]);

    useEffect(() => {
      if (!isFeatureTourOpen || !activeFeatureTourStep?.page) {
        return;
      }

      setActiveWorkspacePage(activeFeatureTourStep.page);
    }, [activeFeatureTourStep, isFeatureTourOpen]);

    useEffect(() => {
      if (!isFeatureTourOpen || typeof window === "undefined") {
        setFeatureTourSpotlight(null);
        return undefined;
      }

      const focusTimer = window.setTimeout(() => {
        if (typeof document === "undefined") {
          return;
        }

        const selector = activeFeatureTourStep?.selector;
        if (selector) {
          const targetElement = document.querySelector(selector);
          targetElement?.scrollIntoView({ block: "center", inline: "nearest", behavior: "smooth" });
        }

        window.setTimeout(updateFeatureTourSpotlight, 220);
      }, 120);

      const handleLayoutChange = () => updateFeatureTourSpotlight();
      window.addEventListener("resize", handleLayoutChange);
      window.addEventListener("scroll", handleLayoutChange, true);

      return () => {
        window.clearTimeout(focusTimer);
        window.removeEventListener("resize", handleLayoutChange);
        window.removeEventListener("scroll", handleLayoutChange, true);
      };
    }, [activeFeatureTourStep, isFeatureTourOpen, updateFeatureTourSpotlight]);

  useEffect(() => {
    const controller = new AbortController();

    const checkBackend = async () => {
      setBackendStatus("checking");

      try {
        const response = await fetch(`${API_BASE_URL}/healthz`, {
          signal: controller.signal,
          cache: "no-store"
        });

        setBackendStatus(response.ok ? "online" : "offline");
      } catch {
        setBackendStatus("offline");
      }
    };

    checkBackend();

    return () => controller.abort();
  }, []);

    const experiencePoints = useMemo(() => (
      (chatStats.turns * 12) + (dailyStreak.count * 25)
    ), [chatStats.turns, dailyStreak.count]);
    const coachLevel = useMemo(() => Math.max(1, Math.floor(experiencePoints / 120) + 1), [experiencePoints]);
    const currentLevelFloor = useMemo(() => (coachLevel - 1) * 120, [coachLevel]);
    const nextLevelTarget = useMemo(() => coachLevel * 120, [coachLevel]);
    const xpIntoCurrentLevel = useMemo(() => experiencePoints - currentLevelFloor, [experiencePoints, currentLevelFloor]);
    const xpRangeForLevel = useMemo(() => Math.max(1, nextLevelTarget - currentLevelFloor), [nextLevelTarget, currentLevelFloor]);
    const levelProgressPercent = useMemo(() => Math.min(100, Math.round((xpIntoCurrentLevel / xpRangeForLevel) * 100)), [xpIntoCurrentLevel, xpRangeForLevel]);
    const xpToNextLevel = useMemo(() => Math.max(0, nextLevelTarget - experiencePoints), [nextLevelTarget, experiencePoints]);
    const dailyGoalTurns = useMemo(() => Math.min(DAILY_TURN_GOAL, chatStats.turns), [chatStats.turns]);
    const dailyGoalPercent = useMemo(() => Math.round((dailyGoalTurns / DAILY_TURN_GOAL) * 100), [dailyGoalTurns]);
    const focusGoalSeconds = useMemo(() => Math.min(FOCUS_SECONDS_GOAL, practiceSeconds), [practiceSeconds]);
    const focusGoalPercent = useMemo(() => Math.round((focusGoalSeconds / FOCUS_SECONDS_GOAL) * 100), [focusGoalSeconds]);

  useEffect(() => {
      const hasConversationStarted = chat.some((message) => message.role === "user");

      if (!hasConversationStarted && !isLoading) {
        return;
      }

      chatEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [chat, isLoading]);

    useEffect(() => {
      if (typeof window === "undefined") {
        return undefined;
      }

      const previousScrollRestoration = window.history?.scrollRestoration;

      if (window.history && "scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }

      window.scrollTo(0, 0);

      return () => {
        if (window.history && typeof previousScrollRestoration === "string") {
          window.history.scrollRestoration = previousScrollRestoration;
        }
      };
    }, []);

  useEffect(() => {
    setChat((previousChat) => {
      if (previousChat.length > 0) {
        return previousChat;
      }

      return [
        {
          id: createMessageId(),
          role: "ai",
          text: "Hi there! I'm Moon, your speaking coach. I'm here to help you sound more natural and confident in any language. Where would you like to start?",
          source: "welcome",
          isFallback: false
        }
      ];
    });
  }, []);

  useEffect(() => {
    setChat((previousChat) => {
      const selectedTask = pickRefreshTask();
      const withoutPreviousRefreshTask = previousChat.filter((message) => message.source !== "refresh-task");

      return [
        ...withoutPreviousRefreshTask,
        {
          id: createMessageId(),
          role: "ai",
          text: `${selectedTask.lead}: ${selectedTask.task}`,
          source: "refresh-task",
          taskPrompt: selectedTask.prompt,
          isFallback: true
        }
      ];
    });
  }, []);

  useEffect(() => {
    try {
      const persistableChat = chat
        .filter((message) => message.source !== "refresh-task")
        .slice(-MAX_PERSISTED_MESSAGES);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(persistableChat));
    } catch {
      // storage unavailable — ignore
    }
  }, [chat]);

  useEffect(() => {
    try {
      localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(dailyStreak));
    } catch {
      // storage unavailable - ignore
    }
  }, [dailyStreak]);

  useEffect(() => {
    try {
      localStorage.setItem(ACHIEVEMENTS_STORAGE_KEY, JSON.stringify(unlockedAchievementIds));
    } catch {
      // storage unavailable - ignore
    }
  }, [unlockedAchievementIds]);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, themeMode);
    } catch {
      // storage unavailable - ignore
    }

    if (typeof document !== "undefined") {
      document.body.classList.toggle("theme-dark", themeMode === "dark");
      document.body.classList.toggle("theme-light", themeMode === "light");
    }
  }, [themeMode]);

  useEffect(() => {
    setSessionBestXp((previousBest) => Math.max(previousBest, sessionXp));
  }, [sessionXp]);

  useEffect(() => {
    setSessionBestStreak((previousBest) => Math.max(previousBest, dailyStreak.count));
  }, [dailyStreak.count]);

  useEffect(() => {
    const newlyUnlocked = achievementCatalog.filter((achievement) => (
      achievement.unlocked && !unlockedAchievementIds.includes(achievement.id)
    ));

    if (newlyUnlocked.length === 0) {
      return;
    }

    setUnlockedAchievementIds((previousIds) => [
      ...previousIds,
      ...newlyUnlocked
        .map((achievement) => achievement.id)
        .filter((id) => !previousIds.includes(id))
    ]);

    setAssistantNotice(`Achievement unlocked: ${newlyUnlocked[0].title}`);
  }, [achievementCatalog, unlockedAchievementIds]);

  useEffect(() => {
    const openingAudio = openingAudioRef.current;

    return () => {
      abortControllerRef.current?.abort();
      if (tutorExciteTimerRef.current) {
        clearTimeout(tutorExciteTimerRef.current);
      }
      if (wheelSpinTimerRef.current) {
        clearTimeout(wheelSpinTimerRef.current);
      }
      if (shadowCountdownTimerRef.current) {
        clearInterval(shadowCountdownTimerRef.current);
      }
      if (openGreetingTimeoutRef.current) {
        clearTimeout(openGreetingTimeoutRef.current);
      }
      if (shadowRecognitionRef.current) {
        shadowRecognitionRef.current.stop();
      }
      if (mediaSourceUrlRef.current) {
        URL.revokeObjectURL(mediaSourceUrlRef.current);
      }
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      if (openingAudio) {
        openingAudio.pause();
        openingAudio.removeAttribute("src");
        openingAudio.load();
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

  const updateHeroFigureInteraction = (event) => {
    if (typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const figure = heroFigureRef.current;
    const card = heroFigureCardRef.current;

    if (!figure || !card) {
      return;
    }

    const rect = figure.getBoundingClientRect();
    const pointerX = (event.clientX - rect.left) / rect.width;
    const pointerY = (event.clientY - rect.top) / rect.height;
    const rotateY = (pointerX - 0.5) * 16;
    const rotateX = (0.5 - pointerY) * 14;

    card.style.setProperty("--hero-pointer-x", `${pointerX * 100}%`);
    card.style.setProperty("--hero-pointer-y", `${pointerY * 100}%`);
    card.style.setProperty("--hero-rotate-x", `${rotateX}deg`);
    card.style.setProperty("--hero-rotate-y", `${rotateY}deg`);
  };

  const resetHeroFigureInteraction = () => {
    const card = heroFigureCardRef.current;

    if (!card) {
      return;
    }

    card.style.setProperty("--hero-pointer-x", "50%");
    card.style.setProperty("--hero-pointer-y", "50%");
    card.style.setProperty("--hero-rotate-x", "0deg");
    card.style.setProperty("--hero-rotate-y", "0deg");
  };

  const cleanupAudioPlayback = useCallback(() => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setNeedsManualPlayback(false);

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
  }, []);

  const buildTtsStreamUrl = useCallback((textToSpeak, languageId) => {
    const params = new URLSearchParams({
      text: textToSpeak,
      language: languageId
    });

    return `${TTS_STREAM_URL}?${params.toString()}`;
  }, []);

  const playOpeningGreetingStream = useCallback((languageId, { fromUserGesture = false } = {}) => new Promise((resolve) => {
    if (typeof window === "undefined") {
      resolve(false);
      return;
    }

    const openingAudio = openingAudioRef.current;

    if (!openingAudio) {
      resolve(false);
      return;
    }

    if (openGreetingTimeoutRef.current) {
      clearTimeout(openGreetingTimeoutRef.current);
      openGreetingTimeoutRef.current = null;
    }

    let settled = false;
    const finish = (didStart) => {
      if (settled) {
        return;
      }

      settled = true;

      if (openGreetingTimeoutRef.current) {
        clearTimeout(openGreetingTimeoutRef.current);
        openGreetingTimeoutRef.current = null;
      }

      openingAudio.removeEventListener("playing", handlePlaying);
      openingAudio.removeEventListener("error", handleError);
      resolve(didStart);
    };

    const handlePlaying = () => {
      setIsSpeaking(true);
      finish(true);
    };

    const handleError = () => {
      setIsSpeaking(false);
      finish(false);
    };

    openingAudio.pause();
    openingAudio.currentTime = 0;
    openingAudio.src = buildTtsStreamUrl(getOpeningGreeting(languageId), languageId);
    openingAudio.onended = () => setIsSpeaking(false);
    openingAudio.onpause = () => {
      if (!openingAudio.ended) {
        setIsSpeaking(false);
      }
    };
    openingAudio.addEventListener("playing", handlePlaying);
    openingAudio.addEventListener("error", handleError);
    openingAudio.load();

    const playPromise = openingAudio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => finish(false));
    }

    openGreetingTimeoutRef.current = window.setTimeout(() => finish(false), fromUserGesture ? 6000 : 2500);
  }), [buildTtsStreamUrl]);

  const playOpeningGreetingWithBrowserVoice = useCallback((languageId) => new Promise((resolve) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      resolve(false);
      return;
    }

    if (openGreetingTimeoutRef.current) {
      clearTimeout(openGreetingTimeoutRef.current);
      openGreetingTimeoutRef.current = null;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(getOpeningGreeting(languageId));
    utterance.lang = getLanguage(languageId).recognition || languageId;
    utterance.rate = 1;
    utterance.pitch = 1;

    let settled = false;
    const finish = (didStart) => {
      if (settled) {
        return;
      }

      settled = true;

      if (openGreetingTimeoutRef.current) {
        clearTimeout(openGreetingTimeoutRef.current);
        openGreetingTimeoutRef.current = null;
      }

      resolve(didStart);
    };

    utterance.onstart = () => {
      setIsSpeaking(true);
      finish(true);
    };
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      finish(false);
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    openGreetingTimeoutRef.current = window.setTimeout(() => finish(false), 2200);
  }), []);

  const playOpeningGreeting = useCallback(async (languageId, { fromUserGesture = false } = {}) => {
    const streamWorked = await playOpeningGreetingStream(languageId, { fromUserGesture });
    const didStart = streamWorked || await playOpeningGreetingWithBrowserVoice(languageId);

    if (didStart) {
      hasPlayedOpenGreetingRef.current = true;
      setAssistantNotice((currentNotice) => (
        currentNotice === "Tap Moon to hear the welcome voice on this phone." ? "" : currentNotice
      ));
    } else if (fromUserGesture) {
      setAssistantNotice("Welcome voice is unavailable on this phone, but coaching is ready.");
    }

    return didStart;
  }, [playOpeningGreetingStream, playOpeningGreetingWithBrowserVoice]);

  const speakWithBrowserVoice = useCallback((replyText, languageId) => {
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
  }, []);

  useEffect(() => {
    if (hasPlayedOpenGreetingRef.current) {
      return;
    }

    let cancelled = false;

    void playOpeningGreeting(selectedLanguage).then((didSpeak) => {
      if (!cancelled && !didSpeak && !hasPlayedOpenGreetingRef.current) {
        setAssistantNotice("Tap Moon to hear the welcome voice on this phone.");
      }
    });

    return () => {
      cancelled = true;
    };
  }, [selectedLanguage, playOpeningGreeting]);

  const handleTutorAvatarTap = useCallback(() => {
    triggerTutorExcitement();

    if (!hasPlayedOpenGreetingRef.current) {
      void playOpeningGreeting(selectedLanguage, { fromUserGesture: true });
    }
  }, [playOpeningGreeting, selectedLanguage]);

  const handleLanguageChange = useCallback((languageId) => {
    setSelectedLanguage(languageId);
    setLanguagesUsed((prev) => new Set([...prev, languageId]));

    if (!hasPlayedOpenGreetingRef.current) {
      void playOpeningGreeting(languageId, { fromUserGesture: true });
    }
  }, [playOpeningGreeting]);

  const welcomePlaybackHint = useMemo(() => {
    if (assistantNotice === "Tap Moon to hear the welcome voice on this phone.") {
      return "Phone autoplay can be blocked. Tap Moon to play the intro.";
    }

    if (assistantNotice === "Welcome voice is unavailable on this phone, but coaching is ready.") {
      return assistantNotice;
    }

    return "If the intro stays silent on your phone, tap Moon.";
  }, [assistantNotice]);

  const attemptAudioPlayback = useCallback(async (replyText, languageId) => {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    try {
      await audio.play();
      setNeedsManualPlayback(false);
      setAssistantNotice((currentNotice) => (
        currentNotice === MANUAL_PLAYBACK_NOTICE ? "" : currentNotice
      ));
      return true;
    } catch (error) {
      if (error?.name === "NotAllowedError") {
        setNeedsManualPlayback(true);
        setVoiceDeliveryMode("manual-play");
        setAssistantNotice(MANUAL_PLAYBACK_NOTICE);
        return false;
      }

      const browserVoiceWorked = speakWithBrowserVoice(replyText, languageId);
      setNeedsManualPlayback(false);
      setVoiceDeliveryMode(browserVoiceWorked ? "browser-voice" : "error");
      setAssistantNotice(browserVoiceWorked
        ? "Streaming audio paused, so playback switched to the browser voice on this device."
        : "Voice playback paused for a moment. You can tap play to retry while coaching stays active.");
      return browserVoiceWorked;
    }
  }, [speakWithBrowserVoice]);

  const streamAudio = useCallback(async (url, replyText, languageId) => {
    if (!url) {
      return;
    }

    cleanupAudioPlayback();
    setIsAudioLoading(true);
    setIsSpeaking(false);
    setVoiceDeliveryMode("connecting");
    setNeedsManualPlayback(false);

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

      if (!audio) {
        throw new Error("Audio player is unavailable.");
      }

      if (!audio || !window.MediaSource || !MediaSource.isTypeSupported(mediaType)) {
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        mediaSourceUrlRef.current = blobUrl;
        audio.src = blobUrl;
        await attemptAudioPlayback(replyText, languageId);
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
          playbackStarted = true;
          void attemptAudioPlayback(replyText, languageId);
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
        const browserVoiceWorked = speakWithBrowserVoice(replyText, languageId);
        setNeedsManualPlayback(false);
        setAssistantNotice(browserVoiceWorked
          ? "Live voice paused, so playback switched to the browser voice on this device."
          : "Live voice is taking a short break. You can tap play to retry while text coaching stays active.");
        setVoiceDeliveryMode(browserVoiceWorked ? "browser-voice" : "error");
      }
    } finally {
      setIsAudioLoading(false);
    }
  }, [attemptAudioPlayback, cleanupAudioPlayback, speakWithBrowserVoice]);

  useEffect(() => {
    if (audioUrl) {
      streamAudio(
        audioUrl,
        latestReplyForVoiceRef.current.text,
        latestReplyForVoiceRef.current.languageId
      );
    }
  }, [audioUrl, streamAudio]);

  const requestReply = async (message) => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return;
    }

    if (!hasStartedPracticeRef.current) {
      hasStartedPracticeRef.current = true;
      sessionTimerRef.current = setInterval(() => {
        setPracticeSeconds((s) => s + 1);
      }, 1000);
    }

    setDailyStreak((previousStreak) => {
      const todayKey = getLocalDateKey();

      if (!previousStreak.lastActive) {
        return {
          count: previousStreak.count,
          lastActive: todayKey
        };
      }

      if (previousStreak.lastActive === todayKey) {
        return previousStreak;
      }

      const previousDate = new Date(`${previousStreak.lastActive}T00:00:00`);
      const todayDate = new Date(`${todayKey}T00:00:00`);
      const dayDiff = Math.round((todayDate - previousDate) / 86400000);

      if (dayDiff === 1) {
        return {
          count: previousStreak.count + 1,
          lastActive: todayKey
        };
      }

      return {
        count: 1,
        lastActive: todayKey
      };
    });
    setSessionXp((currentXp) => currentXp + 12);
    setShadowDrillResult(null);

    setIsLoading(true);
    setAudioUrl("");
    setIsSpeaking(false);
    setText("");
    setAssistantNotice("");
    setNeedsManualPlayback(false);
    latestReplyForVoiceRef.current = { text: "", languageId: selectedLanguage };

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
      latestReplyForVoiceRef.current = { text: clientReply, languageId: selectedLanguage };
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
      latestReplyForVoiceRef.current = { text: nextReply, languageId: selectedLanguage };
      setChat(prev => [
        ...prev,
        {
          role: "ai",
          text: nextReply,
          source: data.replySource || "unknown",
          isFallback: Boolean(data.isFallback)
        }
      ]);
      setNeedsManualPlayback(false);
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
    latestReplyForVoiceRef.current = { text: "", languageId: selectedLanguage };
    setAudioUrl("");
    setVoiceDeliveryMode("idle");
    setAssistantNotice("");
    setShadowCountdown(0);
    setShadowDrillResult(null);

    if (shadowCountdownTimerRef.current) {
      clearInterval(shadowCountdownTimerRef.current);
      shadowCountdownTimerRef.current = null;
    }
    if (shadowRecognitionRef.current) {
      shadowRecognitionRef.current.stop();
      shadowRecognitionRef.current = null;
    }
  };

  const replayLatestReply = async () => {
    const { text: replyText, languageId } = latestReplyForVoiceRef.current;

    if (!replyText) {
      return;
    }

    if (audioRef.current?.src) {
      const started = await attemptAudioPlayback(replyText, languageId);
      if (started) {
        setVoiceDeliveryMode((currentMode) => (currentMode === "manual-play" ? "ready" : currentMode));
      }
      return;
    }

    const browserVoiceWorked = speakWithBrowserVoice(replyText, languageId);
    setVoiceDeliveryMode(browserVoiceWorked ? "browser-voice" : "error");
    setAssistantNotice(browserVoiceWorked
      ? "Replay is using the browser voice on this device."
      : "Voice playback is unavailable right now, but text coaching is still active.");
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

  const spinCoachWheel = () => {
    if (isLoading || isListening || isWheelSpinning) {
      return;
    }

    triggerTutorExcitement();
    setIsWheelSpinning(true);
    setCoachWheelResult("");

    const spinMs = 1100;
    wheelSpinTimerRef.current = setTimeout(() => {
      const selectedPrompt = coachWheelPrompts[Math.floor(Math.random() * coachWheelPrompts.length)] || activeLanguage.demoPrompt;
      setCoachWheelResult(selectedPrompt);
      setText(selectedPrompt);
      setAssistantNotice("Coach wheel selected a challenge. Edit it or tap Send to start.");
      setIsWheelSpinning(false);
      wheelSpinTimerRef.current = null;
    }, spinMs);
  };

  const startShadowDrill = () => {
    const { text: replyText, languageId } = latestReplyForVoiceRef.current;

    if (!replyText || isLoading || isListening) {
      setAssistantNotice("Generate one coach reply first, then start Shadow Drill.");
      return;
    }

    triggerTutorExcitement();
    setShadowDrillResult(null);
    setAssistantNotice("Shadow Drill started. Listen and repeat with the countdown.");
    setShadowCountdown(5);
    void replayLatestReply();
    shadowTranscriptRef.current = "";
    shadowExpectedTextRef.current = replyText;

    if (shadowRecognitionRef.current) {
      shadowRecognitionRef.current.stop();
      shadowRecognitionRef.current = null;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.lang = getLanguage(languageId).recognition || languageId;
      recognition.interimResults = true;
      recognition.continuous = true;
      recognition.maxAlternatives = 1;
      recognition.onresult = (event) => {
        const nextFinalParts = [];

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          if (result.isFinal) {
            nextFinalParts.push(result[0].transcript);
          }
        }

        if (nextFinalParts.length > 0) {
          shadowTranscriptRef.current = `${shadowTranscriptRef.current} ${nextFinalParts.join(" ")}`.trim();
        }
      };
      recognition.onerror = () => {
        setAssistantNotice("Shadow Drill could not capture your voice clearly. Try again in Chrome.");
      };

      try {
        recognition.start();
        shadowRecognitionRef.current = recognition;
      } catch {
        shadowRecognitionRef.current = null;
      }
    }

    if (shadowCountdownTimerRef.current) {
      clearInterval(shadowCountdownTimerRef.current);
    }

    shadowCountdownTimerRef.current = setInterval(() => {
      setShadowCountdown((currentValue) => {
        if (currentValue <= 1) {
          clearInterval(shadowCountdownTimerRef.current);
          shadowCountdownTimerRef.current = null;

          if (shadowRecognitionRef.current) {
            shadowRecognitionRef.current.stop();
            shadowRecognitionRef.current = null;
          }

          const spokenText = shadowTranscriptRef.current.trim();
          const { score, wordResults } = calculateShadowAccuracy(shadowExpectedTextRef.current, spokenText);
          const grade = score >= 85 ? "Excellent" : score >= 65 ? "Good" : score >= 40 ? "Keep going" : "Needs another try";
          setBestShadowScore((prev) => Math.max(prev, score));
          setShadowDrillResult({
            score,
            spokenText,
            grade,
            wordResults
          });
          setAssistantNotice(
            spokenText
              ? `Shadow Drill complete: ${score}% match (${grade}).`
              : `Shadow Drill complete in ${getLanguage(languageId).label}. No speech was captured, so try once more.`
          );
          return 0;
        }

        return currentValue - 1;
      });
    }, 1000);
  };

  const startListening = () => {
    if (isLoading || isListening) {
      return;
    }
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
      setVoiceTurns((v) => v + 1);
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
    <main className={`app-shell theme-${themeMode}`}>
      <header className="hero-panel">
        <div className="hero-grid">
          <div className="hero-copy-panel">
            <p className="eyebrow">Powered by Murf Falcon</p>
            <h1>MoonSpeak AI</h1>
            <p className="hero-copy">
              Meet {TUTOR_NAME}, your robot voice tutor powered by Murf Falcon. Pick a language, speak naturally, get a quick coaching reply, and hear it back instantly.
            </p>

            <p className="falcon-note">
              Current language: {activeLanguage.label}. If a Murf locale is unavailable, audio falls back to the default English voice.
            </p>

            <div className="workspace-nav" role="tablist" aria-label="Workspace pages" data-tour="workspace-nav">
              <button
                type="button"
                role="tab"
                aria-selected={activeWorkspacePage === "practice"}
                className={`workspace-nav-button ${activeWorkspacePage === "practice" ? "workspace-nav-button-active" : ""}`}
                onClick={() => setActiveWorkspacePage("practice")}
              >
                Practice
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeWorkspacePage === "extras"}
                className={`workspace-nav-button ${activeWorkspacePage === "extras" ? "workspace-nav-button-active" : ""}`}
                onClick={() => setActiveWorkspacePage("extras")}
              >
                More Tools
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeWorkspacePage === "coach-lab"}
                className={`workspace-nav-button ${activeWorkspacePage === "coach-lab" ? "workspace-nav-button-active" : ""}`}
                onClick={() => setActiveWorkspacePage("coach-lab")}
              >
                Coach Lab
              </button>
            </div>

            <div className="status-row">
              <span className={`status-pill ${aiStatusTone === "warning" ? "status-pill-warning" : aiStatusTone !== "live" ? "status-pill-neutral" : ""}`}>
                <span className={`status-dot ${aiStatusTone === "warning" ? "status-dot-warning" : aiStatusTone !== "live" ? "status-dot-neutral" : ""}`} />
                {aiStatusLabel}
              </span>
              <span className={`status-pill status-pill-muted ${isActive ? "status-pill-active" : ""}`}>
                {isListening ? "🎙 Listening…" : isLoading ? "⏳ Thinking…" : isSpeaking ? "🔊 Speaking…" : "Ready"}
              </span>
              <button type="button" className="status-check-button" onClick={openFeatureTour}>
                ✨ Tour
              </button>
              <button
                type="button"
                className="status-check-button"
                onClick={() => setThemeMode((currentMode) => (currentMode === "dark" ? "light" : "dark"))}
              >
                {themeMode === "dark" ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>

            {assistantNotice && (
              <div className="message-banner message-banner-info" role="status">
                {assistantNotice}
              </div>
            )}
          </div>

          <div
            ref={heroFigureRef}
            className="hero-figure"
            aria-hidden="true"
            onPointerMove={updateHeroFigureInteraction}
            onPointerLeave={resetHeroFigureInteraction}
            onPointerCancel={resetHeroFigureInteraction}
          >
            <div className="hero-figure-glow hero-figure-glow-one" />
            <div className="hero-figure-glow hero-figure-glow-two" />
            <div ref={heroFigureCardRef} className="hero-figure-card">
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

      {activeWorkspacePage === "practice" ? (
      <div className="workspace-panel">
        <section className="chat-panel">
          <div className="panel-heading">
            <div>
              <h2>Conversation</h2>
            </div>
            <div className="panel-heading-actions">
              <button
                type="button"
                className="panel-ghost-btn"
                onClick={() => setActiveWorkspacePage("extras")}
              >
                More Tools
              </button>
              {chat.length > 0 && (
                <button className="clear-button" onClick={clearChat}>Clear</button>
              )}
            </div>
          </div>

          <div className="stats-strip" aria-live="polite">
            <span className="stats-chip">Turns: {chatStats.turns}</span>
            <span className="stats-chip">AI replies: {chatStats.aiReplies}</span>
            <span className="stats-chip">Avg words/reply: {chatStats.avgAiWords}</span>
            {practiceSeconds > 0 && (
              <span className="stats-chip stats-chip-time">⏱ {formatPracticeTime(practiceSeconds)}</span>
            )}
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
                    onChange={(event) => handleLanguageChange(event.target.value)}
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
                message.source === "welcome" ? (
                  <WelcomeBubble
                    key={message.id || `${message.role}-${index}`}
                    message={message}
                    tutorName={TUTOR_NAME}
                    onChipClick={requestReply}
                    onAvatarTap={handleTutorAvatarTap}
                    welcomePlaybackHint={welcomePlaybackHint}
                  />
                ) : (
                  <ChatBubble
                    key={message.id || `${message.role}-${index}`}
                    message={message}
                    tutorName={TUTOR_NAME}
                    onTaskClick={requestReply}
                  />
                )
              ))
            )}

            {isLoading && (
              <div className="chat-message-row chat-message-row-ai">
                <button
                  type="button"
                  className="chat-avatar-button chat-avatar-button-typing"
                  onClick={triggerTutorExcitement}
                  title="Tap Moon"
                  aria-label="Tap Moon avatar"
                >
                  <img src={chatbotAvatar} alt="" className="chat-avatar-image" />
                </button>
                <div className="chat-bubble chat-bubble-ai">
                  <span className="chat-role">{TUTOR_NAME}</span>
                  <div className="typing-dots">
                    <span /><span /><span />
                  </div>
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
                onClick={handleTutorAvatarTap}
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
              onChange={(event) => handleLanguageChange(event.target.value)}
            >
              {LANGUAGE_OPTIONS.map((language) => (
                <option key={language.id} value={language.id}>{language.label}</option>
              ))}
            </select>
            <span className="language-picker-hint">{activeLanguage.summary}</span>
          </label>

          <div className="voice-launch-card" data-tour="voice-first">
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
            <button
              type="button"
              className="secondary-button voice-tools-button"
              onClick={() => setActiveWorkspacePage("extras")}
            >
              Open More Tools
            </button>
            <div className="quick-action-row">
              <button
                type="button"
                className="quick-action-btn"
                onClick={() => setActiveWorkspacePage("coach-lab")}
              >
                Coach Lab
              </button>
              <button
                type="button"
                className="quick-action-btn"
                onClick={replayLatestReply}
                disabled={!latestReplyForVoiceRef.current.text || isAudioLoading}
              >
                Replay Last
              </button>
            </div>
          </div>

          <div className="practice-progress-card" aria-live="polite">
            <div className="practice-progress-head">
              <p className="practice-progress-title">Practice Progress</p>
              <span className="practice-progress-level">Level {coachLevel}</span>
            </div>
            <div className="practice-progress-row">
              <span className="practice-progress-chip">XP: {experiencePoints}</span>
              <span className="practice-progress-chip">Next: {xpToNextLevel} XP</span>
            </div>
            <div className="practice-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgressPercent}>
              <span className="practice-progress-fill" style={{ width: `${levelProgressPercent}%` }} />
            </div>
          </div>

          <div className="practice-goals-grid" aria-live="polite">
            <div className="practice-goal-card">
              <p className="practice-goal-title">Daily Goal</p>
              <p className="practice-goal-copy">Turns: {dailyGoalTurns}/{DAILY_TURN_GOAL}</p>
              <div className="practice-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={dailyGoalPercent}>
                <span className="practice-progress-fill" style={{ width: `${dailyGoalPercent}%` }} />
              </div>
            </div>
            <div className="practice-goal-card">
              <p className="practice-goal-title">Focus Time</p>
              <p className="practice-goal-copy">{formatPracticeTime(practiceSeconds)} / {formatPracticeTime(FOCUS_SECONDS_GOAL)}</p>
              <div className="practice-progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={focusGoalPercent}>
                <span className="practice-progress-fill" style={{ width: `${focusGoalPercent}%` }} />
              </div>
            </div>
          </div>

          <textarea
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
                      : voiceDeliveryMode === "manual-play"
                              ? "Tap To Play"
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
                      : voiceDeliveryMode === "manual-play"
                        ? "Autoplay was blocked on this phone. Tap the play button below to hear the reply."
                      : voiceDeliveryMode === "error"
                        ? "Live voice paused for a moment, but coaching is still active."
                      : "Voice playback is ready."}
              </p>
              {(voiceDeliveryMode === "falcon-stream-default-voice" ||
                voiceDeliveryMode === "fallback-generate-default-voice") && (
                <p className="tts-fallback-notice">
                  ⚠️ <strong>{activeLanguage?.label ?? selectedLanguage}</strong> voice isn&apos;t available in your Murf plan yet — this reply played in English instead.
                </p>
              )}
              <div className="audio-actions">
                <button
                  type="button"
                  className="secondary-button audio-replay-button"
                  onClick={replayLatestReply}
                  disabled={!latestReplyForVoiceRef.current.text || isAudioLoading}
                >
                  {needsManualPlayback ? "Play Reply On Phone" : "Replay Reply"}
                </button>
              </div>
              <audio
                ref={audioRef}
                controls
                className="audio-player"
                preload="auto"
                onPlay={() => setIsSpeaking(true)}
                onPause={() => setIsSpeaking(false)}
                onEnded={() => setIsSpeaking(false)}
              />
            </div>
          )}
        </section>
        <audio
          ref={openingAudioRef}
          preload="none"
          playsInline
          hidden
          aria-hidden="true"
        />
      </div>
      ) : activeWorkspacePage === "extras" ? (
      <div className="workspace-panel">
        <section className="chat-panel">
          <div className="panel-heading">
            <div>
              <h2>Extras</h2>
              <p>Optional quick-start and suggestion blocks.</p>
            </div>
            <button
              type="button"
              className="panel-ghost-btn"
              onClick={() => setActiveWorkspacePage("practice")}
            >
              Back To Practice
            </button>
          </div>

          <div className="left-focus-card" aria-label="Today's speaking focus">
            <div className="left-focus-head left-focus-head-with-icon">
              <div className="left-focus-icon-wrap" aria-hidden="true">
                <img className="left-focus-icon" src={chatbotAvatar} alt="" />
              </div>
              <div>
                <p className="left-focus-kicker">Today's focus</p>
                <p className="left-focus-copy">
                  Quick warmup ideas for {activeLanguage.label}. Tap one to start instantly.
                </p>
              </div>
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

          <div className="scenario-row" aria-label="Practice scenarios" data-tour="extras-scenarios">
            {SCENARIO_CARDS.map((scenario) => (
              <button
                key={scenario.id}
                type="button"
                className="scenario-card"
                onClick={() => {
                  triggerTutorExcitement();
                  requestReply(scenario.prompt);
                }}
                disabled={isLoading || isListening}
              >
                <span className="scenario-icon" aria-hidden="true">{scenario.icon}</span>
                <span className="scenario-title">{scenario.title}</span>
              </button>
            ))}
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>🎯 Choose Your Level</h3>
              <p>Pick a difficulty to match your practice mode.</p>
            </div>
            <div className="difficulty-grid">
              {DIFFICULTY_LEVELS.map((level) => (
                <button
                  key={level.level}
                  type="button"
                  className="difficulty-card"
                  onClick={() => {
                    triggerTutorExcitement();
                    requestReply(level.prompt);
                  }}
                  disabled={isLoading || isListening}
                  title={level.description}
                >
                  <span className="difficulty-emoji">{level.emoji}</span>
                  <span className="difficulty-name">{level.level}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>🗣️ Conversation Topics</h3>
              <p>Explore real-world speaking scenarios.</p>
            </div>
            <div className="conversation-topics-grid">
              {CONVERSATION_TOPICS.map((convo) => (
                <button
                  key={convo.topic}
                  type="button"
                  className="conversation-topic-btn"
                  onClick={() => requestReply(convo.prompt)}
                  disabled={isLoading || isListening}
                  title={convo.prompt}
                >
                  <span className="topic-emoji">{convo.emoji}</span>
                  <span className="topic-name">{convo.topic}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>📖 Vocabulary Upgrade</h3>
              <p>Replace common words with stronger alternatives.</p>
            </div>
            <div className="vocab-tips-list">
              {VOCABULARY_TIPS.map((vocab, idx) => (
                <div key={idx} className="vocab-tip-item">
                  <span className="vocab-label">{vocab.word}</span>
                  <span className="vocab-suggestion">{vocab.tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>🎙️ Pronunciation Guide</h3>
              <p>Master difficult sounds and speech patterns.</p>
            </div>
            <div className="pronunciation-tips-list">
              {PRONUNCIATION_GUIDES.map((guide, idx) => (
                <div key={idx} className="pronunciation-tip-item">
                  <span className="pronunciation-pattern">{guide.pattern}</span>
                  <span className="pronunciation-tip">{guide.guide}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="composer-panel">
          <div className="panel-heading">
            <div>
              <h2>Extras Toolbox</h2>
              <p>All optional helpers organized by learning focus.</p>
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>📚 Practice Missions</h3>
              <p>Focused exercises for skill building.</p>
            </div>
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

          <div className="tools-section-group" aria-live="polite">
            <div className="tools-section-header">
              <h3>📊 Session Snapshot</h3>
              <p>Track your current practice momentum.</p>
            </div>
            <div className="stats-strip">
              <span className="stats-chip">Turns: {chatStats.turns}</span>
              <span className="stats-chip">AI replies: {chatStats.aiReplies}</span>
              <span className="stats-chip">Streak: {dailyStreak.count} day{dailyStreak.count > 1 ? "s" : ""}</span>
              <span className="stats-chip">XP: {experiencePoints}</span>
              {practiceSeconds > 0 && (
                <span className="stats-chip stats-chip-time">⏱ {formatPracticeTime(practiceSeconds)}</span>
              )}
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>⚡ Quick Actions</h3>
              <p>Jump between workspaces and continue fast.</p>
            </div>
            <div className="mission-grid">
              <button
                type="button"
                className="mission-btn"
                onClick={() => setActiveWorkspacePage("practice")}
              >
                Back To Practice
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={() => setActiveWorkspacePage("coach-lab")}
              >
                Open Coach Lab
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={spinCoachWheel}
                disabled={isLoading || isListening || isWheelSpinning}
              >
                {isWheelSpinning ? "Spinning..." : "Spin Challenge"}
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={replayLatestReply}
                disabled={!latestReplyForVoiceRef.current.text || isAudioLoading}
              >
                Replay Last
              </button>
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>✏️ Grammar Tips</h3>
              <p>Common grammar patterns explained simply.</p>
            </div>
            <div className="grammar-tips-list">
              {GRAMMAR_TIPS.map((grammar, idx) => (
                <div key={idx} className="grammar-tip-item">
                  <span className="grammar-topic">{grammar.topic}</span>
                  <span className="grammar-explanation">{grammar.tip}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="coach-guide-card tools-section-group">
            <div className="tools-section-header">
              <h3>🌟 Coach Guide</h3>
              <p>Quick success tips from your coach.</p>
            </div>
            <div className="coach-guide-list">
              {coachGuideTips.map((tip) => (
                <div key={tip} className="coach-guide-item">
                  <span className="coach-guide-dot" aria-hidden="true" />
                  <span>{tip}</span>
                </div>
              ))}
            </div>
          </div>

          {smartFollowUps.length > 0 && (
            <div className="tools-section-group">
              <div className="tools-section-header">
                <h3>💡 Smart Reply Suggestions</h3>
              </div>
              <div className="smart-followups-grid">
                {smartFollowUps.map((suggestion) => (
                  <button
                    key={suggestion}
                    type="button"
                    className="smart-followup-btn"
                    onClick={() => requestReply(suggestion)}
                    disabled={isLoading || isListening}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>⏱️ Recent Prompts</h3>
              <p>Quick access to your practice history.</p>
            </div>
            {recentUserPrompts.length > 0 ? (
              <div className="smart-followups-grid">
                {recentUserPrompts.map((prompt) => (
                  <button
                    key={prompt}
                    type="button"
                    className="smart-followup-btn"
                    onClick={() => requestReply(prompt)}
                    disabled={isLoading || isListening}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            ) : (
              <p className="voice-copy">Start a few turns in Practice and your recent prompts will appear here.</p>
            )}
          </div>
        </section>
      </div>
      ) : (
      <div className="workspace-panel workspace-panel-lab">
        <section className="chat-panel">
          <div className="panel-heading">
            <div>
              <h2>Coach Lab</h2>
              <p>Advanced tools live here, separate from the main speaking flow.</p>
            </div>
          </div>

          <div className="left-focus-card" aria-label="Coach lab overview">
            <div className="left-focus-head left-focus-head-with-icon">
              <div className="left-focus-icon-wrap" aria-hidden="true">
                <img className="left-focus-icon" src={chatbotAvatar} alt="" />
              </div>
              <div>
                <p className="left-focus-kicker">Advanced practice</p>
                <p className="left-focus-copy">
                  Use badges, coach wheel, shadow drill, and leaderboard here without crowding the main practice page.
                </p>
              </div>
            </div>
          </div>

          <div className="stats-strip" aria-live="polite">
            <span className="stats-chip">Turns: {chatStats.turns}</span>
            <span className="stats-chip">Streak: {dailyStreak.count} day{dailyStreak.count > 1 ? "s" : ""}</span>
            <span className="stats-chip">XP: {experiencePoints}</span>
            {practiceSeconds > 0 && (
              <span className="stats-chip stats-chip-time">⏱ {formatPracticeTime(practiceSeconds)}</span>
            )}
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>⚡ Lab Quick Drills</h3>
              <p>Run a focused drill instantly.</p>
            </div>
            <div className="mission-grid">
              <button
                type="button"
                className="mission-btn"
                onClick={runCoachPrompt}
                disabled={isLoading || isListening}
              >
                Coach Me
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={runChallengePrompt}
                disabled={isLoading || isListening}
              >
                Challenge
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={runRoleplayPrompt}
                disabled={isLoading || isListening}
              >
                Roleplay
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={() => setActiveWorkspacePage("extras")}
              >
                Open More Tools
              </button>
            </div>
          </div>

          <div className="leaderboard-card" aria-live="polite">
            <div className="leaderboard-head">
              <p className="leaderboard-title">Session Leaderboard</p>
              <span className="leaderboard-subtitle">Current session highs</span>
            </div>
            <div className="leaderboard-grid">
              <div className="leaderboard-item">
                <span className="leaderboard-label">Best Streak</span>
                <strong>{sessionBestStreak} day{sessionBestStreak > 1 ? "s" : ""}</strong>
              </div>
              <div className="leaderboard-item">
                <span className="leaderboard-label">Best XP</span>
                <strong>{sessionBestXp}</strong>
              </div>
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>🧰 Session Controls</h3>
              <p>Manage your flow quickly.</p>
            </div>
            <div className="mission-grid">
              <button
                type="button"
                className="mission-btn"
                onClick={clearChat}
              >
                Clear Session
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={() => setActiveWorkspacePage("practice")}
              >
                Go To Practice
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={() => setActiveWorkspacePage("extras")}
              >
                Go To More Tools
              </button>
              <button
                type="button"
                className="mission-btn"
                onClick={replayLatestReply}
                disabled={!latestReplyForVoiceRef.current.text || isAudioLoading}
              >
                Replay Last Reply
              </button>
            </div>
          </div>

          {latestAiMessage ? (
            <div className="lab-preview-card">
              <p className="lab-preview-kicker">Latest coach reply</p>
              <div className="chat-bubble chat-bubble-ai lab-preview-bubble">
                <span className="chat-role">{TUTOR_NAME}</span>
                <p>{latestAiMessage.text}</p>
              </div>
              <button
                type="button"
                className="secondary-button"
                onClick={replayLatestReply}
                disabled={!latestReplyForVoiceRef.current.text || isAudioLoading}
              >
                Replay Latest Reply
              </button>
            </div>
          ) : (
            <div className="empty-state">
              <p className="empty-icon">🧪</p>
              <p className="empty-copy">Start one conversation on the Practice page first, then use the Coach Lab tools here.</p>
            </div>
          )}
        </section>

        <section className="composer-panel">
          <div className="panel-heading">
            <div>
              <h2>Lab Tools</h2>
              <p>Challenge mode, progress tracking, and repetition practice.</p>
            </div>
          </div>

          <div className="progress-card" aria-live="polite" data-tour="coach-progress">
            <div className="progress-head">
              <p className="progress-title">Progress Mode</p>
              <span className="progress-level">Level {coachLevel}</span>
            </div>
            <div className="progress-row">
              <span className="progress-chip">Streak: {dailyStreak.count} day{dailyStreak.count > 1 ? "s" : ""}</span>
              <span className="progress-chip">XP: {experiencePoints}</span>
            </div>
            <div className="progress-track" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={levelProgressPercent}>
              <span className="progress-fill" style={{ width: `${levelProgressPercent}%` }} />
            </div>
            <p className="progress-subcopy">{xpToNextLevel} XP to reach Level {coachLevel + 1}</p>
          </div>

          <div className="tools-section-group" aria-live="polite">
            <div className="tools-section-header">
              <h3>🎯 Milestone Tracker</h3>
              <p>See progress at a glance.</p>
            </div>
            <div className="stats-strip">
              <span className="stats-chip">Daily Goal: {dailyGoalTurns}/{DAILY_TURN_GOAL} ({dailyGoalPercent}%)</span>
              <span className="stats-chip">Focus Time: {formatPracticeTime(focusGoalSeconds)} / {formatPracticeTime(FOCUS_SECONDS_GOAL)} ({focusGoalPercent}%)</span>
              <span className="stats-chip">Voice Turns: {voiceTurns}</span>
              <span className="stats-chip">Best Shadow: {bestShadowScore}%</span>
            </div>
          </div>

          <div className="tools-section-group">
            <div className="tools-section-header">
              <h3>🔥 Lab Challenge Packs</h3>
              <p>Advanced drills for deeper practice.</p>
            </div>
            <div className="mission-grid">
              {labChallengePacks.map((pack) => (
                <button
                  key={pack.title}
                  type="button"
                  className="mission-btn"
                  onClick={() => {
                    triggerTutorExcitement();
                    requestReply(pack.prompt);
                  }}
                  disabled={isLoading || isListening}
                >
                  {pack.title}
                </button>
              ))}
            </div>
          </div>

          <div className="achievement-card">
            <div className="achievement-head">
              <p className="achievement-title">Badges</p>
              <span className="achievement-subtitle">
                {achievementCatalog.filter((achievement) => achievement.unlocked).length}/{achievementCatalog.length} unlocked
              </span>
            </div>
            <div className="achievement-grid">
              {achievementCatalog.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`achievement-badge ${achievement.unlocked ? "achievement-badge-unlocked" : "achievement-badge-locked"}`}
                >
                  <span className="achievement-badge-state">{achievement.unlocked ? "Unlocked" : "Locked"}</span>
                  <strong>{achievement.title}</strong>
                  <span>{achievement.description}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="interactive-card">
            <div className="interactive-head">
              <p className="interactive-title">Coach Wheel</p>
              <button
                type="button"
                className={`interactive-button ${isWheelSpinning ? "interactive-button-spinning" : ""}`}
                onClick={spinCoachWheel}
                disabled={isLoading || isListening || isWheelSpinning}
              >
                {isWheelSpinning ? "Spinning..." : "Spin Challenge"}
              </button>
            </div>
            <p className="interactive-copy">
              {coachWheelResult || "Spin to get a random speaking challenge tailored to your selected language."}
            </p>
          </div>

          <div className="interactive-card">
            <div className="interactive-head">
              <p className="interactive-title">Shadow Drill</p>
              <button
                type="button"
                className="interactive-button"
                onClick={startShadowDrill}
                disabled={isLoading || isListening || !latestReplyForVoiceRef.current.text}
              >
                Start Drill
              </button>
            </div>
            <p className="interactive-copy">
              Listen to the latest coach reply, then repeat it aloud before the timer ends.
            </p>
            {shadowCountdown > 0 && (
              <div className="shadow-timer" role="status" aria-live="assertive">
                Repeat now: {shadowCountdown}s
              </div>
            )}
            {shadowDrillResult && (
              <div className="shadow-score" aria-live="polite">
                <p className="shadow-score-title">Voice Match: {shadowDrillResult.score}%</p>
                <p className="shadow-score-grade">{shadowDrillResult.grade}</p>
                {shadowDrillResult.wordResults && shadowDrillResult.wordResults.length > 0 && (
                  <div className="shadow-word-breakdown" aria-label="Word-level pronunciation match">
                    {shadowDrillResult.wordResults.map(({ word, matched }, i) => (
                      <span
                        key={`${word}-${i}`}
                        className={`shadow-word ${matched ? "shadow-word-hit" : "shadow-word-miss"}`}
                        title={matched ? "✅ Matched" : "❌ Missed"}
                      >
                        {word}
                      </span>
                    ))}
                  </div>
                )}
                <p className="shadow-score-copy">
                  {shadowDrillResult.spokenText
                    ? `Heard: "${shadowDrillResult.spokenText}"`
                    : "No speech detected in this attempt."}
                </p>
              </div>
            )}
          </div>
        </section>
      </div>
      )}

      <FeatureTourModal
        isOpen={isFeatureTourOpen}
        step={activeFeatureTourStep}
        stepIndex={featureTourStepIndex}
        totalSteps={FEATURE_TOUR_STEPS.length}
        isLastStep={isLastFeatureTourStep}
        spotlightRect={featureTourSpotlight}
        onBack={handleFeatureTourBack}
        onNext={handleFeatureTourNext}
        onSkip={handleFeatureTourSkip}
        onOpenPage={setActiveWorkspacePage}
      />
    </main>
  );
}

export default App;
