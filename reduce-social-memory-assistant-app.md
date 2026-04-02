# Reduce — Social Memory Assistant App

## Context
Users constantly make informal plans in conversations ("let's meet at the hackathon next month", "we should grab coffee sometime") that get forgotten. This app turns conversation screenshots into actionable reminders. The user shares a screenshot → AI extracts who, what, and when → the app stores it and nudges the user to follow through. Extends to tracking people's interests, sharing articles, and manual note-taking. **Minimal friction is the #1 design principle.**

## Tech Stack
- **Expo SDK 55** (dev client, NOT Expo Go — needed for share sheet, notifications, calendar, OCR plugins)
- **TypeScript**, **expo-router v4** (file-based routing)
- **NativeWind v4** (Tailwind CSS) — lightweight, no heavy component library
- **expo-sqlite + Drizzle ORM** — zero-cost local database, offline-first
- **Zustand** — ephemeral UI state only
- **On-device OCR**: `rn-mlkit-ocr` (Google ML Kit, free, runs locally on both iOS & Android)
- **AI Parsing**: Text-only LLM (Gemini 2.0 Flash) — 50-300x cheaper than sending images to vision APIs
- **Proxy server**: Cloudflare Worker with your API key — users get free tier, then enter own key for unlimited
- **expo-notifications** — local scheduled notifications (no server needed)
- **expo-share-intent** — receive screenshots via OS share sheet

## File Structure
```
Reduce/
├── app/                          # Expo Router routes
│   ├── _layout.tsx               # Root layout (providers, DB migration, fonts)
│   ├── (tabs)/
│   │   ├── _layout.tsx           # Tab bar config (Memories, People, Settings)
│   │   ├── index.tsx             # Home feed — upcoming memories/reminders
│   │   ├── people.tsx            # People list grouped by person
│   │   └── settings.tsx          # API key, notification prefs
│   ├── memory/
│   │   ├── [id].tsx              # Memory detail/edit
│   │   └── new.tsx               # Manual entry form
│   ├── person/[id].tsx           # All memories for one person
│   ├── review.tsx                # Post-AI review screen (confirm/edit before save)
│   └── +native-intent.tsx        # Share sheet handler → navigates to review
├── src/
│   ├── components/ui/            # Button, Card, TextInput, Badge, BottomSheet
│   ├── components/MemoryCard.tsx
│   ├── components/PersonAvatar.tsx
│   ├── components/ScreenshotPreview.tsx
│   ├── db/
│   │   ├── schema.ts             # Drizzle tables: people, memories, tags, memory_tags
│   │   ├── client.ts             # DB init + drizzle instance
│   │   └── migrations/           # Generated SQL migrations
│   ├── services/
│   │   ├── ocr.ts                # On-device OCR via rn-mlkit-ocr
│   │   ├── ai.ts                 # Gemini text API (via proxy or direct)
│   │   ├── notifications.ts      # Schedule/cancel local notifications
│   │   └── calendar.ts           # expo-calendar read/write
│   ├── stores/appStore.ts        # Zustand: processing state, pending review data
│   ├── hooks/                    # useMemories, usePeople, useShareIntent
│   ├── utils/
│   │   ├── dates.ts              # Date parsing with dayjs
│   │   └── prompts.ts            # AI prompt templates + JSON schema
│   └── types/index.ts
├── assets/
├── drizzle.config.ts
├── tailwind.config.js
├── metro.config.js               # Add .sql extension for Drizzle migrations
├── app.json                      # Expo config with plugins
├── package.json
└── worker/                       # Cloudflare Worker proxy (optional free-tier API)
    ├── src/index.ts
    ├── wrangler.toml
    └── package.json
```

## Database Schema (expo-sqlite + Drizzle)
- **people**: id, name, phone?, notes?, createdAt
- **memories**: id, personId (FK), type (event|interest|action_item|article|note), title, body, eventDate?, reminderDate?, calendarEventId?, screenshotUri?, rawOcrText?, notificationIds (JSON), isCompleted, createdAt
- **tags**: id, label (unique)
- **memory_tags**: memoryId (FK), tagId (FK)

## Core Flow: Screenshot → Memory (Two-Step Pipeline)
1. **Receive**: User shares screenshot via OS share sheet (`expo-share-intent`) or picks from gallery (`expo-image-picker`)
2. **OCR (on-device, FREE)**: `rn-mlkit-ocr` extracts all text from the screenshot locally — no network call, instant
3. **AI Parse (cheap text-only LLM)**: Send extracted TEXT (not image!) to Gemini 2.0 Flash text API → returns structured JSON (person name, items with type/title/date/tags)
4. **Review**: Show parsed results on `review.tsx` — user can edit before saving (human-in-the-loop)
5. **Save**: Write to SQLite, schedule local notifications, optionally create calendar event
6. **Remind**: 3 days before event + morning of event → local push notification → tap opens memory detail

### Why two steps instead of one vision API call?
- On-device OCR is **free** and **instant** (no network latency)
- Sending ~500-2000 tokens of text to a text-only LLM costs **$0.00005-$0.0002** per call
- Sending an image to a vision API costs **$0.05-$0.15** per call
- **50-300x cost savings** with identical parsing quality for text conversations

## On-Device OCR (`src/services/ocr.ts`)
- Uses `rn-mlkit-ocr` — Google ML Kit text recognition, runs entirely on-device
- Expo config plugin support: add to `app.json` plugins with `ocrUseBundled: true`
- Works on iOS 15.5+ and all Android versions
- Returns structured text blocks with bounding boxes (useful for conversation layout understanding)
- Multi-language support (latin script bundled by default)

## AI Integration (`src/services/ai.ts`)
- Receives extracted OCR text, NOT images — much cheaper
- Direct REST `fetch` to Gemini API — no SDK dependency
- Uses `response_mime_type: "application/json"` + `response_schema` for guaranteed structured output
- Prompt extracts: person_name, items[{type, title, body, event_date, tags}]

### API Key Strategy (Hybrid)
- **Free tier via proxy**: Cloudflare Worker holds your Gemini API key. Users get ~50 free AI calls/month (costs you ~$0.01/user/month with text-only pricing)
- **Unlimited via own key**: After free tier, users can enter their own Gemini API key in Settings for unlimited use
- **Key storage**: `expo-secure-store` for user's own key; proxy requires no key on device
- Proxy endpoint: `https://reduce-api.your-domain.workers.dev/analyze`

### Cloudflare Worker Proxy (`worker/`)
```
worker/
├── src/index.ts        # Request handler: validate, rate-limit, forward to Gemini
├── wrangler.toml       # Cloudflare config
└── package.json
```
- Rate limiting: 50 calls/device/month (tracked by device ID hash)
- KV storage for rate limit counters (free tier: 100k reads/day)
- Total cost: **~$0/month** on Cloudflare free tier for reasonable usage

## Notification Strategy (`src/services/notifications.ts`)
- **Events with dates**: notify 3 days before + morning of
- **Action items without dates**: notify 1 week after creation ("Follow up with X about Y")
- **All local** via `expo-notifications` (uses OS alarm scheduler — reliable even with battery optimization)
- Store notification IDs in memory record for cancellation on edit/delete

## Calendar Integration (`src/services/calendar.ts`)
- Opt-in toggle on review screen: "Add to calendar?"
- Uses `expo-calendar` to create events on default device calendar
- Store calendarEventId for later updates/deletion

## Key Dependencies
| Package | Purpose |
|---|---|
| expo ~55 | Core SDK |
| expo-dev-client | Dev builds (required for native plugins) |
| expo-router | File-based navigation |
| expo-sqlite + drizzle-orm | Local DB with type-safe ORM |
| rn-mlkit-ocr | On-device OCR (Google ML Kit, free) |
| expo-share-intent ^6 | Receive images via share sheet |
| expo-image-picker | Gallery picker fallback |
| expo-notifications | Local scheduled notifications |
| expo-calendar | Device calendar integration |
| expo-file-system | Read images as base64 |
| expo-secure-store | Secure API key storage |
| nativewind ^4 + tailwindcss ^3.4 | Styling |
| zustand ^5 | UI state |
| nanoid, dayjs | Utilities |

## Implementation Order

### Sprint 1: Skeleton (Days 1-2)
1. `npx create-expo-app@latest Reduce --template tabs` + install deps
2. Configure NativeWind, Drizzle, metro.config.js
3. Define DB schema, generate migration, wire up migration runner in root `_layout.tsx`
4. Basic tab navigation with placeholder screens

### Sprint 2: Data Layer (Days 3-4)
5. Implement Drizzle queries in hooks (useMemories, usePeople)
6. Build home feed screen (memory list sorted by upcoming date)
7. Build people list screen
8. Seed with test data for development

### Sprint 3: Screenshot Pipeline (Days 5-7)
9. Configure `expo-share-intent` plugin + `+native-intent.tsx` handler
10. Add in-app image picker
11. Implement `src/services/ocr.ts` (on-device ML Kit text extraction)
12. Implement `src/services/ai.ts` (Gemini text API via proxy + direct key fallback)
13. Build review screen with editable fields
14. Wire full flow: share → OCR → AI parse → review → save

### Sprint 3b: Cloudflare Worker Proxy (Day 7)
15. Set up `worker/` directory with wrangler
16. Implement rate-limited proxy to Gemini API
17. Deploy to Cloudflare (free tier)

### Sprint 4: Notifications + Manual Entry (Days 8-9)
14. Request notification permissions in root layout
15. Implement notification scheduling on memory save
16. Deep-link notification taps to memory detail
17. Build manual entry form (`memory/new.tsx`)

### Sprint 5: Polish (Days 10-14)
18. Memory detail screen (view/edit/delete)
19. Person detail screen (all memories for one person)
20. Settings screen (API key, notification prefs)
21. Error handling, empty states, loading states
22. EAS dev builds for iOS + Android, end-to-end testing

## Future Phases (not in MVP)
- Calendar auto-add from screenshots
- Interest tracking with tag filtering
- Article sharing reminders
- Full-text search across memories
- Cross-device sync (Supabase backend)
- Contact book integration
- Home screen widgets

## Cost
- Infrastructure: **~$0/month** (local DB, local notifications, Cloudflare Worker free tier)
- OCR: **$0** (on-device ML Kit)
- AI parsing (free tier via proxy): ~$0.01/user/month for 50 calls (text-only, not vision)
- AI parsing (user's own key): ~$0.002 per 100 screenshots
- App Store: $99/year (Apple) + $25 one-time (Google)

## Verification
1. **Share sheet**: From Messages/WhatsApp, share a screenshot → app opens review screen with parsed data
2. **AI parsing**: Verify extracted person name, event, date match the screenshot content
3. **Save + display**: Confirm memory appears in home feed and under correct person
4. **Notifications**: Set a memory with a date 1 minute in the future → verify notification fires
5. **Manual entry**: Add a memory via form → verify it appears in feed
6. **Both platforms**: Build and test on iOS simulator + Android emulator via EAS
