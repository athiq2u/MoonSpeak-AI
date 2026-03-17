# LinguaLive AI

LinguaLive AI is a voice-first language practice app for live speaking exercises. It combines a React frontend, an Express backend, browser speech recognition, AI-generated coaching, and Murf voice playback so users can practice conversation in multiple languages.

Some parts of the current codebase and deployed services still use the MoonSpeak name. This README focuses on how the project works and how to run it.

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

## Tech Stack

- Frontend: React 19, Vite
- Backend: Node.js, Express
- AI providers: OpenRouter, OpenAI, Gemini
- Voice: Murf

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
```

Frontend configuration:

- `VITE_API_BASE_URL` points the frontend to the backend API
- In local development, a typical value is `http://localhost:5000`

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

## Root Scripts

The root `package.json` provides convenience commands:

```powershell
npm run start
npm run start:backend
npm run dev
npm run dev:frontend
npm run build
```

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

## API Endpoints

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

### `GET /tts-stream`

Streams or returns generated speech audio for a text response.

Query parameters:

- `text`
- `language`

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

## Deployment

The backend is set up for Render through `render.yaml`.

Current Render settings in the repo:

- Root directory: `Backend`
- Build command: `npm install`
- Start command: `npm run start`
- Health check path: `/healthz`

The `docs/` folder contains a built frontend output that can be used for static hosting.

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
