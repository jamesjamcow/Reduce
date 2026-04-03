export const migrations = [
  `
  PRAGMA journal_mode = WAL;

  CREATE TABLE IF NOT EXISTS people (
    id TEXT PRIMARY KEY NOT NULL,
    name TEXT NOT NULL,
    normalizedName TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    avatarUri TEXT,
    notes TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memories (
    id TEXT PRIMARY KEY NOT NULL,
    sourceType TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT,
    userNote TEXT,
    rawOcrText TEXT,
    createdAt INTEGER NOT NULL,
    updatedAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS memory_people (
    memoryId TEXT NOT NULL,
    personId TEXT NOT NULL,
    isPrimary INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (memoryId, personId)
  );

  CREATE TABLE IF NOT EXISTS events (
    id TEXT PRIMARY KEY NOT NULL,
    memoryId TEXT,
    personId TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    eventDate INTEGER NOT NULL,
    eventEndDate INTEGER,
    location TEXT,
    calendarEventId TEXT,
    isCompleted INTEGER NOT NULL DEFAULT 0,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS insights (
    id TEXT PRIMARY KEY NOT NULL,
    memoryId TEXT,
    personId TEXT NOT NULL,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    subject TEXT,
    confidence REAL,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id TEXT PRIMARY KEY NOT NULL,
    eventId TEXT,
    memoryId TEXT,
    personId TEXT NOT NULL,
    message TEXT NOT NULL,
    remindAt INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    notificationType TEXT NOT NULL DEFAULT 'push',
    localNotificationId TEXT,
    createdAt INTEGER NOT NULL
  );

  CREATE TABLE IF NOT EXISTS tags (
    id TEXT PRIMARY KEY NOT NULL,
    label TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS memory_tags (
    memoryId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (memoryId, tagId)
  );

  CREATE TABLE IF NOT EXISTS insight_tags (
    insightId TEXT NOT NULL,
    tagId TEXT NOT NULL,
    PRIMARY KEY (insightId, tagId)
  );

  CREATE TABLE IF NOT EXISTS processing_queue (
    id TEXT PRIMARY KEY NOT NULL,
    rawOcrText TEXT NOT NULL,
    userNote TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    createdAt INTEGER NOT NULL,
    processedAt INTEGER,
    errorMessage TEXT
  );
  `,
];
