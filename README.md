# Reduce

Social memory assistant built with Expo Router and local SQLite persistence.

## What is in this repo

- A generated Expo app with tabs for memories, people, and settings
- Local SQLite schema and repository layer for people, memories, events, insights, reminders, tags, and queue items
- Demo screenshot pipeline with mocked OCR, deterministic text parsing, queue processing, and local reminder scheduling
- Share extension and Cloudflare Worker stubs for the native share flow and proxy API

## Run it

```bash
npm install
npm run start
```

## Current implementation notes

- The in-app gallery flow is functional with mocked OCR text.
- Queue processing saves parsed memories into SQLite and schedules default reminders.
- Native share extensions, direct Gemini calls, and production OCR are scaffolded but still stubbed.
