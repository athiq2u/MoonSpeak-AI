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
    promptInstruction: "Reply in natural Indian English. Light Hindi mixing is okay only if the user does it first.",
    fallback: {
      greeting: "Hi. That sounds natural.",
      thanks: "You're welcome. That sounded clear.",
      help: "Of course. Send me a sentence and I'll help you make it sound more natural.",
      question: "Good question. That sounds clear and natural.",
      generic: "I heard you. That sentence is clear: \"{text}\""
    }
  },
  "hi-IN": {
    label: "Hindi",
    locale: "hi-IN",
    promptInstruction: "Reply mainly in Hindi. If the user mixes English, that is fine.",
    fallback: {
      greeting: "Namaste. Aapki greeting natural lagi.",
      thanks: "Aapka swagat hai. Aapki line clear thi.",
      help: "Bilkul. Ek sentence bhejiye, main use aur natural banane mein madad karunga.",
      question: "Achha sawaal hai. Yeh line clear lag rahi hai.",
      generic: "Maine suna. Yeh line clear hai: \"{text}\""
    }
  },
  "es-ES": {
    label: "Spanish",
    locale: "es-ES",
    promptInstruction: "Reply in natural Spanish.",
    fallback: {
      greeting: "Hola. Suena natural.",
      thanks: "De nada. Se escucho claro.",
      help: "Claro. Enviame una frase y te ayudare a sonar mas natural.",
      question: "Buena pregunta. Suena clara y natural.",
      generic: "Te escuche. La frase se entiende bien: \"{text}\""
    }
  },
  "fr-FR": {
    label: "French",
    locale: "fr-FR",
    promptInstruction: "Reply in natural French.",
    fallback: {
      greeting: "Bonjour. Cela sonne naturel.",
      thanks: "Avec plaisir. C'etait clair.",
      help: "Bien sur. Envoie-moi une phrase et je t'aiderai a la rendre plus naturelle.",
      question: "Bonne question. Cela semble clair et naturel.",
      generic: "Je t'ai entendu. La phrase est claire : \"{text}\""
    }
  },
  "de-DE": {
    label: "German",
    locale: "de-DE",
    promptInstruction: "Reply in natural German.",
    fallback: {
      greeting: "Hallo. Das klingt natuerlich.",
      thanks: "Gern. Das war klar formuliert.",
      help: "Klar. Schick mir einen Satz, und ich helfe dir, natuerlicher zu klingen.",
      question: "Gute Frage. Das klingt klar und natuerlich.",
      generic: "Ich habe dich verstanden. Der Satz ist klar: \"{text}\""
    }
  },
  "it-IT": {
    label: "Italian",
    locale: "it-IT",
    promptInstruction: "Reply in natural Italian.",
    fallback: {
      greeting: "Ciao. Sembra naturale.",
      thanks: "Prego. Era chiaro.",
      help: "Certo. Mandami una frase e ti aiutero a renderla piu naturale.",
      question: "Bella domanda. Suona chiara e naturale.",
      generic: "Ti ho sentito. La frase e chiara: \"{text}\""
    }
  },
  "pt-BR": {
    label: "Portuguese",
    locale: "pt-BR",
    promptInstruction: "Reply in natural Portuguese.",
    fallback: {
      greeting: "Ola. Isso soa natural.",
      thanks: "De nada. Ficou claro.",
      help: "Claro. Envie uma frase e eu vou ajudar voce a soar mais natural.",
      question: "Boa pergunta. Isso soa claro e natural.",
      generic: "Eu ouvi voce. A frase esta clara: \"{text}\""
    }
  },
  "ja-JP": {
    label: "Japanese",
    locale: "ja-JP",
    promptInstruction: "Reply in natural Japanese.",
    fallback: {
      greeting: "Konnichiwa. Shizen ni kikoemasu.",
      thanks: "Dou itashimashite. Wakariyasukatta desu.",
      help: "Mochiron desu. Bun o okutte kuretara motto shizen ni naru you ni tetsudaemasu.",
      question: "Ii shitsumon desu. Wakariyasuku shizen desu.",
      generic: "Kikimashita. Kono bun wa wakariyasui desu: \"{text}\""
    }
  },
  "ko-KR": {
    label: "Korean",
    locale: "ko-KR",
    promptInstruction: "Reply in natural Korean.",
    fallback: {
      greeting: "Annyeonghaseyo. Jayeonseureopge deullimnida.",
      thanks: "Cheonmaneyo. Pyohyeoni bunmyeonghaesseoyo.",
      help: "Mullonijyo. Munjangeul bonaejumyeon deo jayeonseureopge dowa deurilgeyo.",
      question: "Joeun jilmunieyo. Bunmyeonghago jayeonseureowoyo.",
      generic: "Jal deureosseoyo. I munjangeun bunmyeonghaeyo: \"{text}\""
    }
  },
  "zh-CN": {
    label: "Chinese",
    locale: "zh-CN",
    promptInstruction: "Reply in natural Simplified Chinese.",
    fallback: {
      greeting: "Ni hao. Zhe ting qi lai hen ziran.",
      thanks: "Bu keqi. Zhe ju hua hen qingchu.",
      help: "Dangran keyi. Fa yi ju hua gei wo, wo hui bang ni shuo de geng ziran.",
      question: "Zhe shi ge hao wenti. Ting qilai hen qingchu hen ziran.",
      generic: "Wo ting dao le. Zhe ju hua hen qingchu: \"{text}\""
    }
  },
  "ar-SA": {
    label: "Arabic",
    locale: "ar-SA",
    promptInstruction: "Reply in natural Arabic.",
    fallback: {
      greeting: "Marhaban. Hatha yabdu tabiiyan.",
      thanks: "Ala alrahb walsaa. Kanat aljumla waziha.",
      help: "Tabaan. Arsil jumla wasaosaiduk ala an tabdu akthar tabiiyatan.",
      question: "Su'al jayyid. Hatha yabdu wadihan watabiiyan.",
      generic: "Sami'tuk. Hadhihi aljumla waziha: \"{text}\""
    }
  },
  "bn-IN": {
    label: "Bengali",
    locale: "bn-IN",
    promptInstruction: "Reply in natural Bengali.",
    fallback: {
      greeting: "Nomoskar. Eta shobhabik shonachhe.",
      thanks: "Shagotom. Kothata porishkar chhilo.",
      help: "Nishchoi. Ekta bakyo pathan, ami eta aro natural korte help korbo.",
      question: "Bhalo prosno. Eta porishkar ebong shobhabik mone hochhe.",
      generic: "Ami shunechi. Ei bakyota porishkar: \"{text}\""
    }
  },
  "ta-IN": {
    label: "Tamil",
    locale: "ta-IN",
    promptInstruction: "Reply in natural Tamil.",
    fallback: {
      greeting: "Vanakkam. Idhu natural-a ketkudhu.",
      thanks: "Parava illai. Unga sentence clear-a irundhuchu.",
      help: "Kandippa. Oru sentence anuppunga, adha innum natural-a solla naan help panren.",
      question: "Nalla kelvi. Idhu clear-um natural-um irukku.",
      generic: "Naan ketten. Indha sentence clear-aa irukku: \"{text}\""
    }
  },
  "te-IN": {
    label: "Telugu",
    locale: "te-IN",
    promptInstruction: "Reply in natural Telugu.",
    fallback: {
      greeting: "Namaskaram. Idi natural ga undi.",
      thanks: "Parvaledu. Mee line clear ga undi.",
      help: "Tappakunda. Oka sentence pampandi, danini inka natural ga cheppadaniki help chestanu.",
      question: "Manchi prashna. Idi clear ga mariyu natural ga undi.",
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