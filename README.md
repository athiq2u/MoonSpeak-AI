# MoonSpeak AI

MoonSpeak AI is a voice-first English tutor powered by Murf Falcon for low-latency speech playback. The app supports multilingual practice, browser speech recognition, AI replies through Gemini when quota is available, and localized fallback replies when Gemini is unavailable.

## Features

- Voice-first tutoring flow with live playback
- Murf Falcon streaming with generated-audio fallback
- Multiple practice languages, including Hindi, Bengali, Telugu, Tamil, Spanish, French, German, Italian, Portuguese, Japanese, Korean, Chinese, and Arabic
- Browser speech recognition support per selected language
- Local fallback replies when Gemini quota is unavailable
- Conversation history persisted in the browser

## Project Structure

```text
Backend/
  aiService.js
  languageConfig.js
  murfService.js
  server.js
Frontend/
  lingualive-ui/
```

## Requirements

- Node.js 20+
- A Murf API key
- A Gemini API key

## Environment Setup

Copy the backend example file and fill in your keys:

```powershell
Copy-Item Backend/.env.example Backend/.env
```

Required backend variables:

- `GEMINI_API_KEY`
- `MURF_API_KEY`

Optional backend variables:

- `MURF_STREAM_URL`

## Install

Backend:

```powershell
Set-Location Backend
npm install
```

Frontend:

```powershell
Set-Location Frontend/lingualive-ui
npm install
```

## Run

Start the backend:

```powershell
Set-Location Backend
npm run start
```

Start the frontend in a second terminal:

```powershell
Set-Location Frontend/lingualive-ui
npm run dev
```

Frontend default URL:

- `http://localhost:5173`

Backend default URL:

- `http://localhost:5000`

## Build

```powershell
Set-Location Frontend/lingualive-ui
npm run build
```

## API

### `GET /`

Health check.

### `POST /speak`

Request body:

```json
{
  "text": "Hello, help me practice speaking.",
  "history": [],
  "language": "en-US"
}
```

### `GET /tts-stream`

Query params:

- `text`
- `language`

## Notes

- If Gemini returns `429 quota-exceeded`, the app automatically falls back to local tutor replies.
- Murf streaming is attempted first. If the selected locale is unavailable, the app falls back to generated audio or default English voice playback.
- `Backend/.env` is intentionally ignored and should never be committed.

## Demo Positioning

MoonSpeak AI is positioned as:

**MoonSpeak AI — Voice English Tutor powered by Murf Falcon**