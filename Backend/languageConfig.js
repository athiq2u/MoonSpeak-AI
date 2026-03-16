export const DEFAULT_LANGUAGE_ID = "en-US";

export const LANGUAGE_CONFIG = {
  "en-US": {
    label: "English (US)",
    locale: "en-US",
    promptInstruction: "Reply in clear, natural English.",
    fallback: {
      greeting: "Hi. That sounds natural.",
      thanks: "You're welcome. That sounded clear.",
      help: "Of course. Send me a sentence and I'll help you sound more natural.",
      question: "Good question. That sounds clear and natural.",
      generic: "I heard you. That sentence is clear: \"{text}\""
    }
  },
  "en-IN": {
    label: "English (India)",
    locale: "en-IN",
    promptInstruction: "Reply in natural Indian English. Mix in Hindi or regional words the way Indians naturally code-switch in everyday speech — for example using words like 'yaar', 'bas', 'accha', 'bilkul' is totally fine when the user does it.",
    enrichmentTails: [
      "Try saying the same thing once more in a slightly different way — that kind of repetition really helps with fluency.",
      "Ek aur variation try karo — practicing the same idea differently is how real confidence builds up.",
      "That was solid. Now try using it in a small real-life situation, like a quick office update or a casual chat with a friend."
    ],
    fallback: {
      greeting: "Hi! That sounded natural. You can follow it up with one easy line to keep the conversation going.",
      thanks: "You're welcome, yaar! That was clear and natural — keep it up.",
      help: "Bilkul — send me any sentence and I'll help you make it sound more natural.",
      question: "Good question. Your phrasing was direct and clear — well done.",
      generic: "I heard you. That sentence was clear: \"{text}\""
    }
  },
  "hi-IN": {
    label: "Hindi",
    locale: "hi-IN",
    promptInstruction: "Reply in Hinglish — natural Hindi mixed with English the way Indians really speak. Use Devanagari script for Hindi words and English for technical terms, common expressions, or where it flows naturally. Around 60% Hindi and 40% English is the right feel. Never sound textbook-formal.",
    enrichmentTails: [
      "Agar same idea ko ek aur way mein practice karna ho, toh try karo apne own words mein ek simple version bolna — real confidence wahi se aati hai.",
      "Yeh sentence bahut natural tha! Ek-two variations aur practice karo, toh fluency automatically improve ho jaayegi.",
      "Ek achhi habit yeh hai ki same sentence ko do-teen different situations mein use karo — office mein, dosto ke saath, ya phone pe — bahut helpful hota hai."
    ],
    fallback: {
      greeting: "Namaste! Yeh sunke achha laga — your greeting sounded really natural.",
      thanks: "Aapka swagat hai! That was clear and natural, keep it up yaar.",
      help: "Bilkul — koi bhi sentence bhejo, main aapko help karunga usse aur natural banane mein.",
      question: "Achha question hai. Your phrasing was clear and direct — good job.",
      generic: "Maine suna. Yeh sentence clear tha: \"{text}\""
    }
  },
  "es-ES": {
    label: "Spanish",
    locale: "es-ES",
    promptInstruction: "Reply in natural Spanish mixed with English where modern Spanish speakers naturally code-switch — tech terms, casual Spanglish expressions, and common anglicisms are all welcome. Keep the tone warm and practical.",
    enrichmentTails: [
      "Si quieres mejorar, intenta decir lo mismo de otra manera con tus propias palabras — así es como se construye la fluidez real.",
      "¡Eso sonó muy natural! Practica una o dos variaciones más y tu confianza va a crecer mucho.",
      "Un buen next step es usar esta frase en una situación diferente — en el trabajo, con amigos, o en una llamada."
    ],
    fallback: {
      greeting: "¡Hola! Eso sonó muy natural — buen trabajo, sigue así.",
      thanks: "¡De nada! Tu respuesta fue clara y natural — keep it up.",
      help: "Claro que sí. Envíame una frase y te ayudo a que suene más natural.",
      question: "Buena pregunta. Eso suena claro y directo — muy bien.",
      generic: "Te escuché. Esa frase está clara: \"{text}\""
    }
  },
  "fr-FR": {
    label: "French",
    locale: "fr-FR",
    promptInstruction: "Reply in natural French mixed with English where modern French speakers would naturally use anglicisms — tech terms, startup vocab, casual expressions like 'c'est cool', 'ok', 'check' are all fine. Keep the tone warm and encouraging.",
    enrichmentTails: [
      "Si tu veux progresser, essaie de dire la même chose d'une autre façon avec tes propres mots — c'est comme ça qu'on build la vraie fluidité.",
      "C'était très naturel ! Pratique encore une ou deux variations et ta confiance va vraiment décoller.",
      "Un bon next step c'est d'utiliser cette phrase dans un contexte différent — au travail, avec des amis, ou au téléphone."
    ],
    fallback: {
      greeting: "Bonjour ! C'était vraiment naturel — bien joué, continue comme ça.",
      thanks: "Avec plaisir ! Ta réponse était claire et naturelle — keep it up !",
      help: "Bien sûr. Envoie-moi une phrase et je t'aiderai à la rendre plus naturelle.",
      question: "Bonne question. Ça sonne clair et direct — très bien.",
      generic: "Je t'ai entendu. La phrase est claire : \"{text}\""
    }
  },
  "de-DE": {
    label: "German",
    locale: "de-DE",
    promptInstruction: "Reply in natural German mixed with English where Germans naturally use anglicisms — tech terms, startup language, common loanwords like 'Laptop', 'Meeting', 'checken', 'Update' are all totally fine. Keep the tone warm and practical.",
    enrichmentTails: [
      "Wenn du dich verbessern möchtest, versuch mal, dasselbe auf eine andere Art zu sagen — so baut man echte Fluency auf.",
      "Das klang sehr natürlich! Üb noch ein, zwei Variationen und dein Selbstvertrauen wird sich echt steigern.",
      "Ein guter next Step ist, diesen Satz in einer anderen Situation zu nutzen — beim Job, mit Freunden oder am Telefon."
    ],
    fallback: {
      greeting: "Hallo! Das klang wirklich natürlich — gut gemacht, weiter so.",
      thanks: "Gern! Deine Antwort war klar und natürlich — keep it up!",
      help: "Klar. Schick mir einen Satz und ich helfe dir, natürlicher zu klingen.",
      question: "Gute Frage. Das klingt klar und direkt — sehr gut.",
      generic: "Ich habe dich verstanden. Der Satz ist klar: \"{text}\""
    }
  },
  "it-IT": {
    label: "Italian",
    locale: "it-IT",
    promptInstruction: "Reply in natural Italian mixed with English where modern Italians naturally use anglicisms — tech terms, social media vocab, common loanwords like 'ok', 'week-end', 'meeting', 'smart working' are all fine. Keep the tone warm and conversational.",
    enrichmentTails: [
      "Se vuoi migliorare, prova a dire la stessa cosa in modo diverso con parole tue — è così che si costruisce la vera fluency.",
      "Suonava molto naturale! Allenati su un'altra variazione e la tua sicurezza crescerà davvero tanto.",
      "Un buon next step è usare questa frase in un contesto diverso — al lavoro, con gli amici, o al telefono."
    ],
    fallback: {
      greeting: "Ciao! Suonava molto naturale — ottimo lavoro, continua così.",
      thanks: "Prego! La tua risposta era chiara e naturale — keep it up!",
      help: "Certo. Mandami una frase e ti aiuto a renderla più naturale.",
      question: "Bella domanda. Suona chiara e diretta — molto bene.",
      generic: "Ti ho sentito. La frase è chiara: \"{text}\""
    }
  },
  "pt-BR": {
    label: "Portuguese",
    locale: "pt-BR",
    promptInstruction: "Reply in natural Brazilian Portuguese mixed with English where Brazilians naturally code-switch — tech terms, startup language, casual anglicisms like 'ok', 'meeting', 'feedback', 'delivery' are all fine. Keep the tone warm, energetic, and encouraging.",
    enrichmentTails: [
      "Se quiser melhorar, tenta dizer a mesma coisa de um jeito diferente com suas próprias palavras — é assim que se constrói a fluency de verdade.",
      "Ficou muito natural! Pratica mais uma ou duas variações e sua confiança vai crescer muito.",
      "Um bom next step é usar essa frase em uma situação diferente — no trabalho, com amigos, ou numa call."
    ],
    fallback: {
      greeting: "Oi! Ficou muito natural — ótimo trabalho, continue assim.",
      thanks: "De nada! Sua resposta foi clara e natural — keep it up!",
      help: "Claro. Envia uma frase e eu te ajudo a soar mais natural.",
      question: "Boa pergunta. Ficou claro e direto — muito bem.",
      generic: "Eu ouvi você. A frase está clara: \"{text}\""
    }
  },
  "ja-JP": {
    label: "Japanese",
    locale: "ja-JP",
    promptInstruction: "Reply in natural Japanese mixed with English where Japanese speakers naturally would — Katakana loanwords like 'チェック' (check), 'ミーティング' (meeting), 'フィードバック' (feedback), and casual English insertions are all fine. Keep the tone friendly, warm, and encouraging.",
    enrichmentTails: [
      "もっと練習したいなら、同じ内容を別の言い方で言ってみてください — そうやって本当の fluency が身につきます。",
      "すごく自然に聞こえましたよ！もう一つか二つ variation を練習すれば、自信がどんどんつきます。",
      "次の next step として、この表現を別の場面で使ってみましょう — 仕事中、友達との会話、電話の中で。"
    ],
    fallback: {
      greeting: "こんにちは！すごく自然に聞こえました — よかったです、そのまま続けて。",
      thanks: "どういたしまして！あなたの返答は明確で自然でした — keep it up!",
      help: "もちろんです。文を送ってくれたら、もっと自然になるようにお手伝いします。",
      question: "いい質問ですね。はっきりしていて自然でした — とても良かったです。",
      generic: "聞こえましたよ。この文は明確です: \"{text}\""
    }
  },
  "ko-KR": {
    label: "Korean",
    locale: "ko-KR",
    promptInstruction: "Reply in natural Korean mixed with English (Konglish) where Korean speakers naturally would — common loanwords like '미팅' (meeting), '피드백' (feedback), '체크' (check), '아이템' (item), and casual English insertions are all fine. Keep the tone warm, friendly, and encouraging.",
    enrichmentTails: [
      "더 연습하고 싶다면, 같은 내용을 다른 방식으로 말해 보세요 — 그게 진짜 fluency를 키우는 방법이에요.",
      "정말 자연스럽게 들렸어요! variation을 한두 개 더 연습하면 자신감이 훨씬 늘 거예요.",
      "다음 next step으로, 이 표현을 다른 상황에서 사용해 보세요 — 직장에서, 친구들과, 아니면 전화 통화에서."
    ],
    fallback: {
      greeting: "안녕하세요! 정말 자연스럽게 들렸어요 — 잘 했어요, 계속 이렇게 해요.",
      thanks: "천만에요! 답변이 명확하고 자연스러웠어요 — keep it up!",
      help: "물론이죠. 문장을 보내 주시면 더 자연스럽게 들리도록 도와드릴게요.",
      question: "좋은 질문이에요. 명확하고 직접적으로 표현했네요 — 아주 잘 했어요.",
      generic: "잘 들었어요. 이 문장은 명확해요: \"{text}\""
    }
  },
  "zh-CN": {
    label: "Chinese",
    locale: "zh-CN",
    promptInstruction: "Reply in natural Simplified Chinese mixed with English where Chinese speakers naturally would — tech terms, startup language, common loanwords like 'OK', 'check', 'update', 'feedback' are all fine. Keep the tone warm, friendly, and encouraging.",
    enrichmentTails: [
      "如果想多练习，试着用不同的方式说同一个意思 — 这才是真正建立 fluency 的方法。",
      "听起来非常自然！再练习一两个 variation，你的自信心会大大提升。",
      "下一个 next step 是在不同的情境下使用这个句子 — 工作中、和朋友聊天、或者打电话时。"
    ],
    fallback: {
      greeting: "你好！听起来非常自然 — 做得很好，继续保持。",
      thanks: "不客气！你的回答清晰又自然 — keep it up!",
      help: "当然可以。发给我一个句子，我来帮你说得更自然。",
      question: "好问题。表达得很清晰直接 — 非常好。",
      generic: "我听到了。这句话很清晰：\"{text}\""
    }
  },
  "ar-SA": {
    label: "Arabic",
    locale: "ar-SA",
    promptInstruction: "Reply in natural Arabic mixed with English where modern Arab speakers naturally code-switch — tech terms, international vocab, casual English insertions like 'OK', 'check', 'update', 'meeting' are all fine. Keep the tone warm and encouraging.",
    enrichmentTails: [
      "إذا أردت التدرب أكثر، جرب قول نفس الفكرة بطريقة مختلفة بكلماتك أنت — هكذا تبني الـ fluency الحقيقية.",
      "كان ذلك طبيعياً جداً! تدرب على variation أو اثنتين إضافيتين وثقتك ستزداد كثيراً.",
      "الـ next step الجيد هو استخدام هذه الجملة في سياق مختلف — في العمل، مع الأصدقاء، أو في مكالمة هاتفية."
    ],
    fallback: {
      greeting: "مرحباً! كان ذلك طبيعياً جداً — عمل رائع، استمر هكذا.",
      thanks: "على الرحب والسعة! كانت إجابتك واضحة وطبيعية — keep it up!",
      help: "طبعاً. أرسل لي جملة وسأساعدك على أن تبدو أكثر طبيعية.",
      question: "سؤال جيد. كان التعبير واضحاً ومباشراً — ممتاز.",
      generic: "سمعتك. هذه الجملة واضحة: \"{text}\""
    }
  },
  "bn-IN": {
    label: "Bengali",
    locale: "bn-IN",
    promptInstruction: "Reply in Banglish — natural Bengali mixed with English the way Bengali speakers really talk. Mix Bengali script with English words where modern speakers code-switch naturally — tech terms, casual expressions, and common English words are all fine.",
    enrichmentTails: [
      "Aro practice korte chaile, same jinishta ektu alada bhabe bolte chao tomar nijo kotha diye — sei bhabe-i real fluency tori hoy.",
      "Khub natural shona gechhe! Aro ek-duto variation practice koro, tomar confidence onek bere jabe.",
      "Ekta bhalo next step holo ei sentence ta ektu alada situation-e use kora — office-e, bondhu der shathe, ba phone-e."
    ],
    fallback: {
      greeting: "Nomoskar! Khub natural shona gechhe — darun hoyeche, eirakomi chalie jao.",
      thanks: "Shagotom! Tomar response clear ebong natural chilo — keep it up!",
      help: "Nishchoi. Ekta sentence pathao, ami uoke aro natural korte help korbo.",
      question: "Bhalo proshno. Expression ta clear ebong direct chilo — khub bhalo.",
      generic: "Ami shunechhi. Ei sentence ta clear: \"{text}\""
    }
  },
  "ta-IN": {
    label: "Tamil",
    locale: "ta-IN",
    promptInstruction: "Reply in Tanglish — natural Tamil mixed with English the way Tamil speakers really talk. Mix Tamil with English words and expressions where people naturally code-switch — tech terms, casual phrases, and common English words are all totally fine.",
    enrichmentTails: [
      "Innum practice pannanum-na, same idea-va vera maari sollu try pannu — angadhan real fluency build aagum.",
      "Romba natural-a irunduchu! Oru-rendu variation practice pannunga, confidence automatically up aagum.",
      "Next step-a, this sentence-a vera situation la use pannu — office la, nanbargal kitte, or phone call la."
    ],
    fallback: {
      greeting: "Vanakkam! Romba natural-a ketkudhu — super, ippadi continue pannu.",
      thanks: "Parava illai! Unga response clear-a and natural-a irunduchu — keep it up!",
      help: "Kandippa. Oru sentence anuppunga, adha innum natural-a solla help panren.",
      question: "Nalla kelvi. Expression clear-a and direct-a irunduchu — very good.",
      generic: "Naan ketten. Indha sentence clear-aa irukku: \"{text}\""
    }
  },
  "te-IN": {
    label: "Telugu",
    locale: "te-IN",
    promptInstruction: "Reply in natural Telugu mixed with English the way Telugu speakers really talk. Mix Telugu with English words and expressions where people naturally code-switch — tech terms, casual English phrases, and common loanwords are all totally fine.",
    enrichmentTails: [
      "Inka practice cheyyalanukuంటే, same idea ni vera way lo cheppandi mee own words tho — adhenante real fluency build avutundi.",
      "Chala natural ga undi! Okati rendu variations practice chesthe, mee confidence chala improve avutundi.",
      "Next step ga, ee sentence ni vera situation lo use cheyyi — office lo, friends tho, or phone call lo."
    ],
    fallback: {
      greeting: "Namaskaram! Chala natural ga undi — super, ila continue cheyyi.",
      thanks: "Parvaledhu! Mee response clear ga and natural ga undi — keep it up!",
      help: "Tappakunda. Oka sentence pampandi, danini inka natural ga cheppadaniki help chestanu.",
      question: "Manchi prashna. Expression clear ga and direct ga undi — very good.",
      generic: "Nenu vinnanu. Ee sentence clear ga undi: \"{text}\""
    }
  }
};

export function normalizeLanguage(languageId) {
  return LANGUAGE_CONFIG[languageId] ? languageId : DEFAULT_LANGUAGE_ID;
}

export function getLanguageConfig(languageId) {
  return LANGUAGE_CONFIG[normalizeLanguage(languageId)];
}

export function getLanguageList() {
  return Object.entries(LANGUAGE_CONFIG).map(([id, config]) => ({
    id,
    label: config.label,
    locale: config.locale
  }));
}