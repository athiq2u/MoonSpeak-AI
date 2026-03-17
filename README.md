# MoonSpeak-AI

MoonSpeak-AI is a voice-first language practice app for live speaking exercises. It combines a React frontend, an Express backend, browser speech recognition, AI-generated coaching, and Murf voice playback so users can practice conversation in multiple languages.

> Speak. Coach. Replay. Repeat.

## Demo Links

| Surface | URL | Purpose |
|---|---|---|
| Frontend Demo | https://athiq2u.github.io/MoonSpeak-AI/ | Live UI preview |
| Backend API | https://moonspeak-ai-backend.onrender.com | Hosted API base |
| Health Check | https://moonspeak-ai-backend.onrender.com/healthz | Service status |

## What It Does

- Lets users practice spoken conversation in multiple languages
- Uses browser speech recognition for voice input
- Sends prompts and recent conversation history to the backend
- Generates coaching responses through configured AI providers
- Streams spoken replies with Murf and falls back when needed
- Keeps local chat history and practice progress in the frontend

## Main Features

- Real-time speaking practice
- Multilingual language selection
- AI provider fallback support
- Text and voice reply playback
- Localized fallback coaching when AI providers are unavailable
- Health endpoint for backend status checks
- Local progress and streak tracking in browser storage
- Multi-workspace UI: Practice, More Tools, and Coach Lab
- Quick coaching actions: Coach me, Challenge, Roleplay
- Scenario and mission flows for interview, storytelling, debate, and fluency drills
- Coach Wheel random challenge picker
- Shadow Drill with countdown and word-level match scoring
- Difficulty levels, conversation topics, vocabulary, pronunciation, and grammar support
- Smart follow-up suggestions and recent prompt recall
- XP levels, daily goals, badges, and session leaderboard

## At A Glance

| Category | What You Get |
|---|---|
| Core Loop | Voice/text input -> AI coach reply -> voice playback |
| AI Strategy | Gemini/OpenAI/OpenRouter priority with local coach fallback |
| Voice Strategy | Murf live stream -> Murf generated audio -> browser voice fallback |
| Learning UX | Practice + More Tools + Coach Lab workspaces |
| Progress UX | Streak, XP level, goals, badges, leaderboard |

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8 |
| Backend | Node.js, Express 5 |
| AI Providers | Gemini, OpenAI, OpenRouter |
| Voice | Murf |
| Testing | Node test runner |

## System Flowchart

```mermaid
flowchart TD
  subgraph INPUT[Input Layer]
    U[User speaks or types]
    FE[Frontend captures input]
    PRE[Normalize text and trim history]
    U --> FE --> PRE
  end

  subgraph COACH[Coach Layer]
    REQ[POST /speak]
    ORDER{Provider order available}
    LIVE[Gemini or OpenAI or OpenRouter]
    OK{Provider response valid}
    LOCAL[Use built-in coach fallback]
    REPLY[Return coached reply and metadata]
    PRE --> REQ --> ORDER
    ORDER --> LIVE --> OK
    OK -- Yes --> REPLY
    OK -- No --> LOCAL --> REPLY
  end

  subgraph VOICE[Voice Layer]
    TTS[GET /tts-stream]
    STREAM{Murf stream success}
    GEN{Murf generate success}
    LIVEAUDIO[Play live Murf stream]
    GENAUDIO[Play generated fallback audio]
    BROWSERAUDIO[Play browser voice fallback]
    REPLY --> TTS --> STREAM
    STREAM -- Yes --> LIVEAUDIO
    STREAM -- No --> GEN
    GEN -- Yes --> GENAUDIO
    GEN -- No --> BROWSERAUDIO
  end

  subgraph OUT[Experience Layer]
    UI[Update chat, streak, XP, badges]
    DONE[User hears reply and sees coaching]
    REPLY --> UI --> DONE
    LIVEAUDIO --> DONE
    GENAUDIO --> DONE
    BROWSERAUDIO --> DONE
  end

  classDef layer fill:#EEF4FF,stroke:#2563EB,stroke-width:1px;
  classDef decision fill:#FFF7ED,stroke:#C2410C,stroke-width:1px;
  classDef fallback fill:#FFF1F2,stroke:#BE123C,stroke-width:1px;
  classDef result fill:#ECFDF5,stroke:#047857,stroke-width:1px;

  class U,FE,PRE,REQ,LIVE,REPLY,TTS,UI layer;
  class ORDER,OK,STREAM,GEN decision;
  class LOCAL,GENAUDIO,BROWSERAUDIO fallback;
  class LIVEAUDIO,DONE result;
```

## Project Structure

```text
.
|-- Backend/
|   |-- aiService.js
|   |-- languageConfig.js
|   |-- murfService.js
|   |-- server.js
|   `-- tests/
|-- Frontend/
|   `-- lingualive-ui/
|       |-- src/
|       |-- public/
|       `-- vite.config.js
|-- docs/
|-- render.yaml
`-- README.md
```

## Requirements

- Node.js 20 or newer
- npm
- A Murf API key
- At least one AI provider key

## Environment Variables

Backend configuration lives in `Backend/.env`.

Create it from the example file:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Available backend variables:

```env
GEMINI_API_KEY=
OPENAI_API_KEY=
OPENROUTER_API_KEY=
AI_PROVIDER_PRIORITY=gemini-first
OPENAI_MODEL=gpt-4o-mini
GEMINI_MODEL=gemini-2.0-flash
OPENROUTER_MODEL=openai/gpt-4o-mini
OPENROUTER_SITE_URL=
OPENROUTER_APP_NAME=MoonSpeak AI
MURF_API_KEY=
MURF_STREAM_URL=
MURF_DEFAULT_VOICE_ID=Natalie
MURF_VOICE_MAP={}
MURF_REQUEST_TIMEOUT_MS=15000
```

Additional optional voice overrides supported by the backend:

- `MURF_VOICE_<LANGUAGE_ID>` (for example: `MURF_VOICE_EN_US`, `MURF_VOICE_HI_IN`)
- These take priority over `MURF_VOICE_MAP`

Frontend configuration:

- `VITE_API_BASE_URL` points the frontend to the backend API
- If not set:
  - On local hosts (`localhost`/`127.0.0.1`), the frontend uses `/api` and Vite proxy forwards to `http://localhost:5000`
  - On non-local hosts, the frontend defaults to `https://moonspeak-ai-backend.onrender.com`

## Installation

Install backend dependencies:

```powershell
Set-Location Backend
npm install
```

Install frontend dependencies:

```powershell
Set-Location ..\Frontend\lingualive-ui
npm install
```

## Running Locally

Start the backend:

```powershell
Set-Location Backend
npm run start
```

Start the frontend in a separate terminal:

```powershell
Set-Location Frontend\lingualive-ui
npm run dev
```

Local defaults:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:5000`
- Frontend API route in dev: `/api` (proxied to backend)

## Root Scripts

The root `package.json` provides convenience commands:

```powershell
npm run start
npm run start:backend
npm run dev
npm run dev:frontend
npm run build
```

## Command Matrix

| Scope | Command | What It Does |
|---|---|---|
| Root | `npm run start` | Starts backend via root script |
| Root | `npm run dev` | Starts frontend dev server |
| Root | `npm run build` | Builds frontend |
| Backend | `npm run dev` | Starts backend in watch mode |
| Backend | `npm run test` | Runs backend tests |
| Frontend | `npm run dev` | Starts Vite dev server |
| Frontend | `npm run lint` | Runs ESLint |
| Frontend | `npm run build` | Builds production frontend |

## Backend Scripts

From `Backend/`:

```powershell
npm run dev
npm run start
npm run check
npm run test
```

## Frontend Scripts

From `Frontend/lingualive-ui/`:

```powershell
npm run dev
npm run build
npm run preview
npm run lint
```

## Tests

Run backend tests:

```powershell
Set-Location Backend
npm run test
```

Current test coverage includes:

- Health and status routes (`GET /`, `GET /healthz`)
- Language config normalization and list integrity

## API Endpoints

| Endpoint | Method | Purpose |
|---|---|---|
| `/` | GET | Basic API status |
| `/healthz` | GET | Health and provider configuration snapshot |
| `/speak` | POST | Generates coached reply from user text/history |
| `/tts-stream` | GET | Streams or serves TTS audio |

### `GET /`

Returns a basic API status response.

### `GET /healthz`

Returns backend health information, including whether Murf and AI providers are configured.

### `POST /speak`

Sends user text and recent history to the backend and returns a generated reply.

Example request body:

```json
{
  "text": "Help me practice a short self introduction.",
  "history": [],
  "language": "en-US"
}
```

Typical response fields:

- `reply`
- `audioFile` / `audioStreamUrl`
- `audioMode`
- `replySource`
- `isFallback`, `fallbackReason`, `fallbackDetails`
- `language`, `languageLabel`
- `assistantNotice`

### `GET /tts-stream`

Streams or returns generated speech audio for a text response.

Query parameters:

- `text`
- `language`
- `mode` (legacy compatibility; `bilingual` maps to Hindi when `language` is not supplied)

## Supported Languages

The frontend currently includes options for:

- English (US)
- English (India)
- Hindi
- Spanish
- French
- German
- Italian
- Portuguese
- Japanese
- Korean
- Chinese
- Arabic
- Bengali
- Tamil
- Telugu

## Practice Experience

| Workspace | Focus | Highlights |
|---|---|---|
| Practice | Main conversation loop | Voice-first input, coach actions, live reply playback |
| More Tools | Guided support | Missions, scenarios, level picks, vocab, grammar, smart follow-ups |
| Coach Lab | Advanced training | Challenge packs, coach wheel, shadow drill, milestones, badges |

The frontend experience is split into three workspace pages:

- Practice: core conversation flow with voice-first input and live coaching replies
- More Tools: focused helpers such as quick-start prompts, scenarios, difficulty picks, vocabulary, pronunciation, grammar, and smart follow-ups
- Coach Lab: advanced drills, milestone tracking, challenge packs, coach wheel, shadow drill, badges, and session controls

Built-in quick actions include:

- Coach me
- Challenge
- Roleplay

## Workspace Flowchart

```mermaid
flowchart TB
  subgraph NAV[Workspace Navigation]
    HOME[Open App]
    P[Practice]
    M[More Tools]
    C[Coach Lab]
    HOME --> P
    P <--> M
    P <--> C
    M <--> C
  end

  subgraph PRACTICE[Practice Steps]
    P1[Voice or text input]
    P2[Coach me or Challenge or Roleplay]
    P3[Send prompt]
  end

  subgraph TOOLS[More Tools Steps]
    M1[Pick mission or scenario]
    M2[Use level, vocabulary, grammar, pronunciation]
    M3[Tap smart follow-up or recent prompt]
  end

  subgraph LAB[Coach Lab Steps]
    C1[Run challenge pack]
    C2[Spin coach wheel]
    C3[Start shadow drill]
    C4[Track milestones and badges]
  end

  P --> P1 --> P2 --> P3
  M --> M1 --> M2 --> M3
  C --> C1 --> C2 --> C3 --> C4

  P3 --> OUT[AI reply and voice playback]
  M3 --> OUT
  C4 --> OUT
  OUT --> PROG[Update turns, streak, XP, leaderboard]

  classDef nav fill:#F5F3FF,stroke:#6D28D9,stroke-width:1px;
  classDef action fill:#EFF6FF,stroke:#1D4ED8,stroke-width:1px;
  classDef outcome fill:#ECFDF5,stroke:#047857,stroke-width:1px;

  class HOME,P,M,C nav;
  class P1,P2,P3,M1,M2,M3,C1,C2,C3,C4 action;
  class OUT,PROG outcome;
```

## Deployment

The backend is set up for Render through `render.yaml`.

Current Render settings in the repo:

- Root directory: `Backend`
- Build command: `npm install`
- Start command: `npm run start`
- Health check path: `/healthz`

The `docs/` folder contains a built frontend output that can be used for static hosting.

Frontend build notes:

- Vite is configured with base path `/MoonSpeak-AI/` during build
- If deployed to a different path, update `Frontend/lingualive-ui/vite.config.js`

## Troubleshooting

If the frontend cannot get live replies:

- Check that the backend is running
- Confirm `VITE_API_BASE_URL` points to the correct backend
- Confirm at least one AI provider key is configured
- Check `GET /healthz` for provider status

If voice playback fails:

- Confirm `MURF_API_KEY` is set
- Check backend logs for TTS errors
- Verify the browser allows audio playback

If speech recognition behaves inconsistently:

- Test in a Chromium-based browser
- Confirm the selected language matches the practice language

## Notes

- The backend limits input text length to 500 characters per request
- The backend trims history before sending it to providers
- When live AI is unavailable, the app can return built-in fallback coaching
