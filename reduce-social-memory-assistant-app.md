# Reduce — Social Memory Assistant App

## Context
Users constantly make informal plans in conversations ("let's meet at the hackathon next month", "we should grab coffee sometime") that get forgotten. Beyond events, users also learn valuable things about people — skills, interests, connections, achievements — that disappear into chat history. This app turns conversation screenshots into both **actionable reminders** and a **searchable knowledge base about your network**. The user shares a screenshot → AI extracts who, what, when, AND what's notable about this person → the app stores it, reminds you to follow through, and lets you recall it later ("who do I know that hosts hackathons?"). **Minimal friction is the #1 design principle.**

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
- **expo-share-extension** — iOS: custom React Native UI inside share sheet (no app launch). Android: transparent overlay Activity.
- **expo-share-intent** — fallback for Android share target handling

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
│   ├── review.tsx                # Post-AI review screen (confirm/edit before save) — used for in-app gallery flow
│   └── +native-intent.tsx        # Android share intent handler → navigates to overlay
├── src/
│   ├── components/ui/            # Button, Card, TextInput, Badge, BottomSheet
│   ├── components/MemoryCard.tsx
│   ├── components/PersonAvatar.tsx
│   ├── components/ProcessingQueue.tsx  # Shows pending items from share sheet queue
│   ├── db/
│   │   ├── schema.ts             # Drizzle tables: people, memories, events, insights, reminders, tags, joins
│   │   ├── client.ts             # DB init + drizzle instance
│   │   └── migrations/           # Generated SQL migrations
│   ├── services/
│   │   ├── ocr.ts                # On-device OCR via rn-mlkit-ocr
│   │   ├── ai.ts                 # Gemini text API (via proxy or direct)
│   │   ├── queue.ts              # Read/process share sheet queue from App Group shared storage
│   │   ├── notifications.ts      # Schedule/cancel local push notifications
│   │   ├── reminders.ts          # Create/cancel reminder rows + schedule notifications
│   │   ├── search.ts             # Query insights table ("who hosts hackathons?")
│   │   └── calendar.ts           # expo-calendar read/write
│   ├── stores/appStore.ts        # Zustand: processing state, pending review data
│   ├── hooks/                    # useMemories, usePeople, useEvents, useInsights, useReminders, useShareIntent
│   ├── utils/
│   │   ├── dates.ts              # Date parsing with dayjs
│   │   └── prompts.ts            # AI prompt templates + JSON schema
│   └── types/index.ts
├── share-extension/              # iOS Share Extension (expo-share-extension)
│   ├── index.tsx                 # Share sheet mini-UI (OCR + text input + Save button)
│   └── share-handler.ts         # Write {rawOcrText, userNote} to App Group shared storage
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

### Why this structure?
The old flat schema (one `memories` table with a `type` field) can't answer questions like "who hosts hackathons?" or "who has connections to Y?" We need to separate **what happened** (memories/events) from **what we learned about a person** (insights). Reminders need their own table so one event can have multiple reminders with independent status tracking.

### V1 Tables (MVP — local SQLite)

**people** — every person mentioned in a screenshot or added manually
- id (TEXT PK, nanoid)
- name (TEXT, required)
- phone? (TEXT) — for display/contact linking, NOT for SMS in V1
- email? (TEXT)
- avatarUri? (TEXT) — local file path to a photo
- notes? (TEXT) — freeform user notes about this person
- createdAt (INTEGER, unix ms)
- updatedAt (INTEGER, unix ms)

**memories** — every raw capture (text extracted from screenshot, manual note, article link)
- id (TEXT PK, nanoid)
- personId (TEXT FK → people.id)
- sourceType (TEXT: "screenshot" | "manual" | "article")
- title (TEXT) — short summary of the capture
- body? (TEXT) — full parsed content / user notes
- userNote? (TEXT) — extra context the user typed in the share sheet ("remind me to see him when I'm in SF")
- rawOcrText? (TEXT) — raw OCR output, kept for re-parsing or full-text search. **No screenshot stored** — images are 500KB-2MB each and never opened again after parsing. The raw text is a few KB, fully searchable, and can be re-parsed by AI anytime.
- createdAt (INTEGER, unix ms)

**events** — specific plans with dates, extracted from memories or added manually
- id (TEXT PK, nanoid)
- memoryId? (TEXT FK → memories.id) — which capture this came from (null if manual)
- personId (TEXT FK → people.id)
- title (TEXT) — "Coffee at Blue Bottle", "Hackathon at UCLA"
- description? (TEXT)
- eventDate (INTEGER, unix ms) — WHEN this happens (required)
- eventEndDate? (INTEGER, unix ms)
- location? (TEXT)
- calendarEventId? (TEXT) — links to device calendar entry
- isCompleted (INTEGER, 0|1, default 0)
- createdAt (INTEGER, unix ms)

**insights** — facts/traits/skills/connections learned about a person (the knowledge base)
- id (TEXT PK, nanoid)
- memoryId? (TEXT FK → memories.id) — which capture this was extracted from
- personId (TEXT FK → people.id)
- category (TEXT: "skill" | "interest" | "trait" | "connection" | "achievement" | "role" | "preference" | "other")
- content (TEXT) — "Hosts hackathons regularly", "Connected to Y at Google", "Really good at ML"
- subject? (TEXT) — the topic keyword for search, e.g. "hackathons", "machine learning", "Google"
- confidence? (REAL) — AI confidence score 0-1 (optional, for future ranking)
- createdAt (INTEGER, unix ms)

**reminders** — scheduled nudges, decoupled from events so each can have multiple
- id (TEXT PK, nanoid)
- eventId? (TEXT FK → events.id) — reminder for an event
- memoryId? (TEXT FK → memories.id) — reminder for a non-event (e.g., "follow up with X about Y")
- personId (TEXT FK → people.id)
- message (TEXT) — what the notification says: "Coffee with Alex in 3 days"
- remindAt (INTEGER, unix ms) — WHEN to fire this reminder
- status (TEXT: "pending" | "sent" | "dismissed" | "snoozed", default "pending")
- notificationType (TEXT: "push", default "push") — V2 adds "sms"
- localNotificationId? (TEXT) — expo-notifications ID for cancellation
- createdAt (INTEGER, unix ms)

**tags** — reusable labels
- id (TEXT PK, nanoid)
- label (TEXT, unique)

**memory_tags** — many-to-many: memories ↔ tags
- memoryId (TEXT FK → memories.id)
- tagId (TEXT FK → tags.id)
- PRIMARY KEY (memoryId, tagId)

**insight_tags** — many-to-many: insights ↔ tags (enables "find all insights tagged #hackathon")
- insightId (TEXT FK → insights.id)
- tagId (TEXT FK → tags.id)
- PRIMARY KEY (insightId, tagId)

### How Reminders Are Tracked
The `reminders` table is the answer to "how do you know when to send a notification in X days?"
1. When an event is saved, the app creates **multiple reminder rows**: e.g., 3 days before (`remindAt = eventDate - 3 days`) + morning of (`remindAt = eventDate at 9am`)
2. Each reminder is immediately scheduled as a local push notification via `expo-notifications`, and the returned notification ID is stored in `localNotificationId`
3. The `status` field tracks whether it's `pending`, `sent`, or `dismissed` — so the app knows what's been delivered
4. If the user edits/deletes an event, the app queries all reminders for that `eventId`, cancels them via their `localNotificationId`, and deletes/updates the rows
5. For non-event reminders (action items like "follow up with X"), `eventId` is null and `memoryId` is set instead. Default: remind 1 week after creation.

### How "Who Hosts Hackathons?" Works
The `insights` table is the knowledge base. When a user shares a screenshot showing someone talking about hosting hackathons:
1. AI extracts an insight: `{ category: "skill", content: "Hosts hackathons regularly", subject: "hackathons" }`
2. This gets saved to `insights` linked to that person
3. Later, the user can search "hackathon" → the app queries: `SELECT p.name, i.content FROM insights i JOIN people p ON i.personId = p.id WHERE i.subject LIKE '%hackathon%' OR i.content LIKE '%hackathon%'`
4. Result: "Alex — Hosts hackathons regularly" with a link to the original screenshot

This means every screenshot potentially produces THREE types of data:
- **Memory** (the raw capture — always created)
- **Event(s)** (if there's a plan with a date — 0 or more)
- **Insight(s)** (if we learned something about the person — 0 or more)

### V2 Tables (added when auth + SMS ship)

**users** — for authentication and cross-device sync
- id (TEXT PK)
- email (TEXT, unique)
- phone? (TEXT) — for SMS notifications
- authProvider (TEXT: "email" | "google" | "apple")
- smsOptIn (INTEGER, 0|1, default 0) — explicit TCPA consent
- smsOptInAt? (INTEGER, unix ms) — when they consented (legal requirement)
- createdAt (INTEGER, unix ms)

**sms_reminders** — server-side SMS queue (lives in Cloudflare D1, NOT local SQLite)
- id (TEXT PK)
- userId (TEXT FK → users.id)
- reminderId (TEXT) — matches local reminder ID for sync
- phone (TEXT)
- message (TEXT)
- scheduledAt (INTEGER, unix ms)
- status (TEXT: "queued" | "sent" | "failed" | "cancelled")
- twilioMessageSid? (TEXT) — Twilio's message ID for tracking
- sentAt? (INTEGER, unix ms)
- createdAt (INTEGER, unix ms)

## Core Flow: Screenshot → Memory + Events + Insights (Two-Step Pipeline)

### The Share Sheet Experience (user never leaves their chat app)
The entire capture happens **inside the share sheet** — the user does NOT get bounced into the full app. This is critical for minimal friction.

**iOS (via `expo-share-extension`):**
1. User long-presses screenshot in iMessage/WhatsApp → taps Share → taps "Reduce"
2. A **custom mini-UI renders inside the share sheet** (not the full app). This shows:
   - A small preview/spinner ("Processing...")
   - OCR runs on-device instantly → text extracted
   - A text input field: user can type extra context ("I need to meet with this guy", "when I'm in SF remind me to see him", "this person hosts hackathons")
   - A "Save" button
3. User types optional note → taps Save → share sheet closes → **back to texting in <3 seconds**
4. AI parsing happens **in the background** after the share sheet closes (the main app processes the queue)

**Android (transparent overlay via `expo-share-intent` + custom Activity):**
1. User shares screenshot → selects "Reduce" from share targets
2. A **translucent bottom-sheet overlay** appears over the chat app (not a full-screen app launch)
3. Same flow: OCR runs, text input for notes, Save button
4. Overlay dismisses → back to texting

**Why split OCR (in share sheet) from AI parsing (background)?**
- iOS share extensions have a **120MB memory limit**. React Native + Hermes uses ~50MB. OCR is lightweight. But loading the AI service + network call risks hitting the cap.
- The user doesn't need to wait for AI parsing — they just need to confirm "yes, save this." The AI structures it afterward.
- This keeps the share sheet fast (<2 seconds to Save) vs. waiting 3-5 seconds for an API call.

### Background Processing Queue
After the share sheet closes:
1. The share extension writes to a **shared App Group** container (iOS) or shared file (Android): `{ rawOcrText, userNote, timestamp }`
2. Next time the main app launches (or immediately if it's running), it picks up the queue
3. AI parses each entry: extracts person, events, insights
4. Results are saved to SQLite + reminders are scheduled
5. A local notification fires: "✓ Saved: Coffee with Alex on Tuesday" — so the user knows it processed

### Full Pipeline
1. **Receive**: User shares screenshot via OS share sheet OR picks from gallery in-app
2. **OCR (on-device, FREE, in share sheet)**: `rn-mlkit-ocr` extracts all text locally — instant, no network
3. **User Note (in share sheet)**: User optionally types extra context — stored as `userNote` on the memory
4. **Save raw data**: Write `{ rawOcrText, userNote }` to shared storage → close share sheet → user goes back to texting
5. **AI Parse (background, cheap text-only LLM)**: Main app picks up queue → sends extracted TEXT + userNote to Gemini 2.0 Flash → returns structured JSON:
   - **Person**: name + any contact info visible
   - **Events**: plans with dates (coffee Tuesday, hackathon next month)
   - **Insights**: facts about the person (hosts hackathons, works at Google, knows Y, good at ML)
   - **User intent**: parsed from the userNote ("remind me when in SF" → location-based reminder flag)
6. **Save structured data**: Write memory + events + insights to SQLite, schedule reminders
7. **Confirm**: Local push notification: "✓ Saved: Coffee with Alex, Tuesday" — user can tap to review/edit
8. **Remind**: 3 days before + morning of → local push notification → tap opens memory detail. V2 adds SMS option.

### In-App Fallback
If the user opens the app directly (not via share sheet), they can:
- Pick an image from gallery via `expo-image-picker`
- This goes through the **full review screen** (`review.tsx`) where they see AI results and edit before saving
- Same pipeline, just with a review step instead of the fast share-sheet flow

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
- Prompt now extracts THREE categories from every screenshot:

### AI Output Schema
```json
{
  "person_name": "Alex Chen",
  "events": [
    {
      "title": "Coffee at Blue Bottle",
      "description": "Catching up about the new startup idea",
      "event_date": "2026-04-15T10:00:00",
      "location": "Blue Bottle on 3rd St",
      "tags": ["coffee", "startup"]
    }
  ],
  "insights": [
    {
      "category": "skill",
      "content": "Hosts hackathons regularly at UCLA",
      "subject": "hackathons"
    },
    {
      "category": "connection",
      "content": "Has connections at Google's AI team",
      "subject": "Google"
    },
    {
      "category": "interest",
      "content": "Really into machine learning and LLMs",
      "subject": "machine learning"
    }
  ],
  "tags": ["hackathon", "AI", "Google"]
}
```

### What the AI Extracts
| Category | What it captures | Example |
|---|---|---|
| **Events** | Plans with dates/times | "Let's grab coffee Tuesday" |
| **Skills** | What someone is good at | "She's amazing at UI design" |
| **Interests** | What someone cares about | "He's really into crypto" |
| **Connections** | Who someone knows | "She knows the CTO at Stripe" |
| **Achievements** | What someone accomplished | "Just raised a Series A" |
| **Roles** | Job/position/affiliation | "Works at Google on the AI team" |
| **Traits** | Personality/behavioral | "Super reliable, always follows through" |
| **Preferences** | Likes/dislikes | "Hates coffee, prefers tea" |

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

### V1: Local Push Notifications (free, no server)
- **Events with dates**: create 2 reminders automatically → 3 days before + morning of event
- **Action items without dates**: create 1 reminder → 1 week after creation ("Follow up with X about Y")
- **All local** via `expo-notifications` — uses OS alarm scheduler, reliable even with battery optimization
- Each reminder row in `reminders` table stores its `localNotificationId` for cancellation
- On event edit/delete → query all reminders for that event → cancel each via `expo-notifications.cancelScheduledNotificationAsync(id)` → delete rows
- On app launch, run a cleanup: mark any `pending` reminders with `remindAt < now` as `sent`

### V2: SMS Notifications (opt-in, server-side)
**Why SMS?** Push notification open rates are ~5-15%. SMS open rates are ~98%. Users actually read texts.

**How it works:**
1. User enters phone number in Settings + toggles "Send me text reminders"
2. App stores phone in `users` table (V2 auth required) with `smsOptIn = 1` and `smsOptInAt` timestamp (TCPA legal requirement)
3. When a reminder is created, if user has SMS opted in, the app ALSO sends the reminder to the Cloudflare Worker: `POST /sms-reminder { phone, message, scheduledAt }`
4. Worker stores it in Cloudflare D1 (`sms_reminders` table)
5. A **Cron Trigger** on the Worker runs every 15 minutes, queries `sms_reminders WHERE scheduledAt <= now AND status = 'queued'`, and sends each via Twilio API
6. Worker updates status to `sent` with `twilioMessageSid`

**SMS costs:**
- Twilio: ~$0.0079/SMS + $1/month for a phone number
- 1,000 users × 5 texts/month = ~$40/month
- Users should be warned this costs real money — consider making it a paid feature

**Both notifications fire for SMS users** — push AND text. Belt and suspenders. The push links to the app; the text is a standalone reminder they'll actually read.

**Legal requirements for SMS:**
- Explicit opt-in with timestamp stored
- Every SMS must include opt-out: "Reply STOP to unsubscribe"
- Register Twilio A2P 10DLC campaign (~$15 one-time) to avoid carrier spam filtering
- Privacy policy must mention SMS data handling

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
| expo-share-extension | iOS: custom React Native UI inside share sheet |
| expo-share-intent ^6 | Android: receive images via share target |
| expo-image-picker | In-app gallery picker fallback |
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
5. Implement Drizzle queries in hooks (useMemories, usePeople, useEvents, useInsights, useReminders)
6. Build home feed screen (upcoming events sorted by date + pending reminders)
7. Build people list screen (with insight count badges)
8. Seed with test data for development (people with events AND insights)

### Sprint 3: Screenshot Pipeline (Days 5-7)
9. **Share extension UI (iOS)**: Configure `expo-share-extension` plugin + build `share-extension/index.tsx` — mini form with OCR spinner, text input for user notes, Save button
10. **Share overlay (Android)**: Configure `expo-share-intent` + transparent Activity with bottom-sheet UI matching iOS share extension
11. **Shared storage bridge**: Implement `share-handler.ts` — write `{ rawOcrText, userNote, timestamp }` to App Group (iOS) / shared file (Android)
12. **Background queue processor**: Implement `src/services/queue.ts` — on app launch, read pending items → send to AI → save structured data → fire confirmation notification
13. Implement `src/services/ocr.ts` (on-device ML Kit text extraction — runs IN the share sheet)
14. Implement `src/services/ai.ts` (Gemini text API via proxy + direct key fallback — runs in main app background)
15. Build review screen (`review.tsx`) for in-app gallery picker flow (full edit UI for events + insights)
16. Add in-app image picker as fallback
17. Wire both flows:
    - **Fast flow**: share sheet → OCR → user note → save raw → close → background AI parse → confirm notification
    - **Full flow**: in-app gallery pick → OCR → AI parse → review screen → edit → save

### Sprint 3b: Cloudflare Worker Proxy (Day 7)
15. Set up `worker/` directory with wrangler
16. Implement rate-limited proxy to Gemini API
17. Deploy to Cloudflare (free tier)

### Sprint 4: Notifications + Manual Entry (Days 8-9)
14. Request notification permissions in root layout
15. Implement notification scheduling on memory save
16. Deep-link notification taps to memory detail
17. Build manual entry form (`memory/new.tsx`)

### Sprint 5: Polish + Search (Days 10-14)
18. Memory detail screen (view/edit/delete events and insights)
19. Person detail screen (all memories, events, AND insights for one person)
20. Insight search — search bar on home screen: "hackathons" → shows matching people + insights
21. Settings screen (API key, notification prefs)
22. Error handling, empty states, loading states
23. EAS dev builds for iOS + Android, end-to-end testing

## Future Phases

### V2: Auth + SMS + Sync
- **User authentication** via Supabase Auth (email/password, Google, Apple Sign-In)
  - Why Supabase: free tier (50k MAU), built-in auth + Postgres DB, row-level security, realtime sync
  - Local SQLite stays as offline cache — Supabase syncs in background
  - All existing local data migrates to cloud on first sign-in
- **SMS notifications** via Twilio (see Notification Strategy above)
  - Cloudflare Worker expanded: D1 database for `sms_reminders`, Cron Trigger for send queue
  - Opt-in only, with TCPA-compliant consent tracking
- **Cross-device sync** — memories, events, insights, reminders all sync via Supabase Postgres
- **Insight search** — "who do I know that hosts hackathons?" queries the `insights` table across all people
- **Smart suggestions** — AI uses your insights DB to suggest: "You're meeting Alex tomorrow. Last time you learned he's into ML — ask about his new project"

### V3: Growth Features
- Calendar auto-add from screenshots
- Full-text search across all memories and OCR text
- Contact book integration (match `people` to phone contacts)
- Home screen widgets (next upcoming event, recent insights)
- Article/link sharing with auto-tagging
- Export your people data (CSV/JSON)
- Shared memories (send a memory to another Reduce user)

## Cost

### V1 (MVP)
- Infrastructure: **~$0/month** (local DB, local notifications, Cloudflare Worker free tier)
- OCR: **$0** (on-device ML Kit)
- AI parsing (free tier via proxy): ~$0.01/user/month for 50 calls (text-only, not vision)
- AI parsing (user's own key): ~$0.002 per 100 screenshots
- App Store: $99/year (Apple) + $25 one-time (Google)

### V2 (Auth + SMS added)
- Supabase: **$0/month** free tier (50k MAU, 500MB DB, 1GB storage)
- Twilio phone number: **$1/month**
- Twilio SMS: **~$0.008/text** → 1,000 users × 5 texts = ~$40/month
- Cloudflare D1: **$0** free tier (5M reads/day, 100k writes/day)
- Total V2: **~$41/month** at 1,000 SMS users (push-only users still cost $0)

## Verification

### V1 Tests
1. **Share sheet (iOS)**: From iMessage, share a screenshot → mini-UI appears INSIDE share sheet → type "remind me to meet this guy" → tap Save → share sheet closes → back to iMessage in <3 seconds
2. **Share overlay (Android)**: From WhatsApp, share a screenshot → translucent bottom sheet appears → type note → Save → overlay closes → back to WhatsApp
3. **Background processing**: After share sheet save → open Reduce app → verify processing queue picks up the item → confirmation notification fires ("✓ Saved: Coffee with Alex, Tuesday")
4. **User note parsing**: Type "when I'm in SF remind me to see him" in share sheet → verify AI parses this into a location-aware reminder or note on the memory
5. **AI parsing**: Verify extracted person name, events with dates, AND insights (skills/connections/interests) match the OCR text content
6. **Save + display**: Confirm memory appears in home feed, events show on timeline, insights show on person profile
7. **No screenshot stored**: Verify no image files are saved by the app — only `rawOcrText` in the memories table
8. **Reminders**: Create an event 2 minutes in the future → verify TWO reminder rows created → verify push notification fires
9. **Reminder cancellation**: Delete an event → verify all linked reminders are cancelled and notification cleared
10. **Insight search**: Add a screenshot mentioning "hackathons" → search "hackathon" from home → verify the person and insight appear
11. **Person profile**: Tap a person → see all their events, insights, and raw OCR text from captures
12. **In-app fallback**: Open app → pick image from gallery → full review screen appears → edit events/insights → save
13. **Manual entry**: Add a memory via form → verify it appears in feed
14. **Both platforms**: Build and test on real iOS device (share extension memory limit!) + Android emulator via EAS

### V2 Tests (when auth + SMS ship)
10. **Auth flow**: Sign up → verify data syncs to Supabase → sign in on different device → verify all data appears
11. **SMS opt-in**: Enter phone number + toggle SMS on → verify `smsOptIn` and `smsOptInAt` stored
12. **SMS delivery**: Create event with SMS opted in → verify push fires locally AND SMS arrives on phone
13. **SMS opt-out**: Reply STOP → verify no more texts sent, `smsOptIn` flipped to 0
