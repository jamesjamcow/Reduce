import 'react-native-get-random-values';

import { nanoid } from 'nanoid/non-secure';

import { db, initializeDatabase } from '@/src/db/client';
import { minusDays, nextMorning, plusDays } from '@/src/utils/dates';
import type {
  EventItem,
  HomeFeedItem,
  Insight,
  ManualMemoryInput,
  Memory,
  MemoryBundle,
  ParsedCapture,
  Person,
  PersonListItem,
  QueueItem,
  Reminder,
  SearchResult,
} from '@/src/types';

type DbRow = Record<string, unknown>;

function mapPerson(row: DbRow): Person {
  return {
    id: String(row.id),
    name: String(row.name),
    normalizedName: String(row.normalizedName),
    phone: (row.phone as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    avatarUri: (row.avatarUri as string | null) ?? null,
    notes: (row.notes as string | null) ?? null,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

function mapMemory(row: DbRow): Memory {
  return {
    id: String(row.id),
    sourceType: row.sourceType as Memory['sourceType'],
    title: String(row.title),
    body: (row.body as string | null) ?? null,
    userNote: (row.userNote as string | null) ?? null,
    rawOcrText: (row.rawOcrText as string | null) ?? null,
    createdAt: Number(row.createdAt),
    updatedAt: Number(row.updatedAt),
  };
}

function mapEvent(row: DbRow): EventItem {
  return {
    id: String(row.id),
    memoryId: (row.memoryId as string | null) ?? null,
    personId: String(row.personId),
    title: String(row.title),
    description: (row.description as string | null) ?? null,
    eventDate: Number(row.eventDate),
    eventEndDate: (row.eventEndDate as number | null) ?? null,
    location: (row.location as string | null) ?? null,
    calendarEventId: (row.calendarEventId as string | null) ?? null,
    isCompleted: Number(row.isCompleted) === 1,
    createdAt: Number(row.createdAt),
  };
}

function mapInsight(row: DbRow): Insight {
  return {
    id: String(row.id),
    memoryId: (row.memoryId as string | null) ?? null,
    personId: String(row.personId),
    category: row.category as Insight['category'],
    content: String(row.content),
    subject: (row.subject as string | null) ?? null,
    confidence: (row.confidence as number | null) ?? null,
    createdAt: Number(row.createdAt),
  };
}

function mapReminder(row: DbRow): Reminder {
  return {
    id: String(row.id),
    eventId: (row.eventId as string | null) ?? null,
    memoryId: (row.memoryId as string | null) ?? null,
    personId: String(row.personId),
    message: String(row.message),
    remindAt: Number(row.remindAt),
    status: row.status as Reminder['status'],
    notificationType: 'push',
    localNotificationId: (row.localNotificationId as string | null) ?? null,
    createdAt: Number(row.createdAt),
  };
}

function mapQueue(row: DbRow): QueueItem {
  return {
    id: String(row.id),
    rawOcrText: String(row.rawOcrText),
    userNote: (row.userNote as string | null) ?? null,
    status: row.status as QueueItem['status'],
    createdAt: Number(row.createdAt),
    processedAt: (row.processedAt as number | null) ?? null,
    errorMessage: (row.errorMessage as string | null) ?? null,
  };
}

export function normalizeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

async function getPeopleForMemory(memoryId: string) {
  const rows = (await db.getAllAsync(
    `
      SELECT p.*
      FROM people p
      JOIN memory_people mp ON mp.personId = p.id
      WHERE mp.memoryId = ?
      ORDER BY mp.isPrimary DESC, p.name ASC
    `,
    memoryId,
  )) as DbRow[];

  return rows.map(mapPerson);
}

async function getEventsForMemory(memoryId: string) {
  const rows = (await db.getAllAsync(
    `SELECT * FROM events WHERE memoryId = ? ORDER BY eventDate ASC`,
    memoryId,
  )) as DbRow[];

  return rows.map(mapEvent);
}

async function getInsightsForMemory(memoryId: string) {
  const rows = (await db.getAllAsync(
    `SELECT * FROM insights WHERE memoryId = ? ORDER BY createdAt DESC`,
    memoryId,
  )) as DbRow[];

  return rows.map(mapInsight);
}

async function getRemindersForMemory(memoryId: string) {
  const rows = (await db.getAllAsync(
    `SELECT * FROM reminders WHERE memoryId = ? ORDER BY remindAt ASC`,
    memoryId,
  )) as DbRow[];

  return rows.map(mapReminder);
}

async function getTagsForMemory(memoryId: string) {
  const rows = (await db.getAllAsync(
    `
      SELECT t.label
      FROM tags t
      JOIN memory_tags mt ON mt.tagId = t.id
      WHERE mt.memoryId = ?
      ORDER BY t.label ASC
    `,
    memoryId,
  )) as Array<{ label: string }>;

  return rows.map((row) => row.label);
}

async function resolvePersonId(name: string) {
  const normalizedName = normalizeName(name);
  const existing = (await db.getFirstAsync(
    `SELECT * FROM people WHERE normalizedName = ? LIMIT 1`,
    normalizedName,
  )) as DbRow | null;

  if (existing) {
    await db.runAsync(`UPDATE people SET updatedAt = ? WHERE id = ?`, Date.now(), String(existing.id));
    return mapPerson(existing);
  }

  const id = nanoid(12);
  const createdAt = Date.now();
  await db.runAsync(
    `
      INSERT INTO people (id, name, normalizedName, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    id,
    name.trim(),
    normalizedName,
    createdAt,
    createdAt,
  );

  return {
    id,
    name: name.trim(),
    normalizedName,
    createdAt,
    updatedAt: createdAt,
    phone: null,
    email: null,
    avatarUri: null,
    notes: null,
  };
}

async function attachTags(memoryId: string, insightIds: string[], labels: string[]) {
  for (const label of labels) {
    const normalized = label.trim().toLowerCase();
    if (!normalized) continue;

    let tag = (await db.getFirstAsync(
      `SELECT * FROM tags WHERE label = ? LIMIT 1`,
      normalized,
    )) as DbRow | null;

    if (!tag) {
      const tagId = nanoid(12);
      await db.runAsync(`INSERT INTO tags (id, label) VALUES (?, ?)`, tagId, normalized);
      tag = { id: tagId, label: normalized };
    }

    await db.runAsync(
      `INSERT OR IGNORE INTO memory_tags (memoryId, tagId) VALUES (?, ?)`,
      memoryId,
      String(tag.id),
    );

    for (const insightId of insightIds) {
      await db.runAsync(
        `INSERT OR IGNORE INTO insight_tags (insightId, tagId) VALUES (?, ?)`,
        insightId,
        String(tag.id),
      );
    }
  }
}

async function createDefaultReminders(memoryId: string, people: Person[], events: EventItem[]) {
  const primaryPerson = people[0];
  const now = Date.now();

  if (events.length === 0 && primaryPerson) {
    const reminderId = nanoid(12);
    await db.runAsync(
      `
        INSERT INTO reminders (
          id, eventId, memoryId, personId, message, remindAt, status, notificationType, localNotificationId, createdAt
        ) VALUES (?, NULL, ?, ?, ?, ?, 'pending', 'push', NULL, ?)
      `,
      reminderId,
      memoryId,
      primaryPerson.id,
      `Follow up with ${primaryPerson.name}`,
      plusDays(now, 7),
      now,
    );
    return;
  }

  for (const event of events) {
    const reminderTimes = [minusDays(event.eventDate, 3), nextMorning(event.eventDate)];
    for (const remindAt of reminderTimes) {
      if (remindAt <= now) continue;
      await db.runAsync(
        `
          INSERT INTO reminders (
            id, eventId, memoryId, personId, message, remindAt, status, notificationType, localNotificationId, createdAt
          ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'push', NULL, ?)
        `,
        nanoid(12),
        event.id,
        memoryId,
        event.personId,
        `${event.title} with ${primaryPerson?.name ?? 'your contact'}`,
        remindAt,
        now,
      );
    }
  }
}

export async function getMemoryBundle(memoryId: string) {
  await initializeDatabase();
  const row = (await db.getFirstAsync(`SELECT * FROM memories WHERE id = ? LIMIT 1`, memoryId)) as DbRow | null;
  if (!row) return null;

  const memory = mapMemory(row);
  const [people, events, insights, reminders, tags] = await Promise.all([
    getPeopleForMemory(memoryId),
    getEventsForMemory(memoryId),
    getInsightsForMemory(memoryId),
    getRemindersForMemory(memoryId),
    getTagsForMemory(memoryId),
  ]);

  return { memory, people, events, insights, reminders, tags } satisfies MemoryBundle;
}

export async function listMemoryBundles(search = '') {
  await initializeDatabase();
  const like = `%${search.trim().toLowerCase()}%`;
  const rows = (await db.getAllAsync(
    `
      SELECT DISTINCT m.*
      FROM memories m
      LEFT JOIN memory_people mp ON mp.memoryId = m.id
      LEFT JOIN people p ON p.id = mp.personId
      WHERE ? = '%%'
        OR lower(m.title) LIKE ?
        OR lower(COALESCE(m.body, '')) LIKE ?
        OR lower(COALESCE(m.userNote, '')) LIKE ?
        OR lower(COALESCE(m.rawOcrText, '')) LIKE ?
        OR lower(COALESCE(p.name, '')) LIKE ?
      ORDER BY m.createdAt DESC
    `,
    like,
    like,
    like,
    like,
    like,
    like,
  )) as DbRow[];

  return Promise.all(rows.map((row) => getMemoryBundle(String(row.id)))) as Promise<MemoryBundle[]>;
}

export async function listHomeFeed(search = '') {
  const bundles = (await listMemoryBundles(search)).filter(Boolean) as MemoryBundle[];
  const items = bundles.map((bundle) => {
    const nextEventAt = bundle.events.find((event) => !event.isCompleted && event.eventDate > Date.now())?.eventDate;
    const pendingReminderCount = bundle.reminders.filter((reminder) => reminder.status === 'pending').length;
    return { bundle, nextEventAt, pendingReminderCount } satisfies HomeFeedItem;
  });

  return items.sort((a, b) => {
    if (a.nextEventAt && b.nextEventAt) return a.nextEventAt - b.nextEventAt;
    if (a.nextEventAt) return -1;
    if (b.nextEventAt) return 1;
    return b.bundle.memory.createdAt - a.bundle.memory.createdAt;
  });
}

export async function listPeople() {
  await initializeDatabase();
  const peopleRows = (await db.getAllAsync(`SELECT * FROM people ORDER BY updatedAt DESC`)) as DbRow[];
  const result: PersonListItem[] = [];

  for (const row of peopleRows) {
    const person = mapPerson(row);
    const memoryCountRow = (await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM memory_people WHERE personId = ?`,
      person.id,
    )) as { count: number };
    const upcomingEventCountRow = (await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM events WHERE personId = ? AND eventDate > ? AND isCompleted = 0`,
      person.id,
      Date.now(),
    )) as { count: number };
    const insightCountRow = (await db.getFirstAsync(
      `SELECT COUNT(*) as count FROM insights WHERE personId = ?`,
      person.id,
    )) as { count: number };
    const subjectRows = (await db.getAllAsync(
      `
        SELECT subject
        FROM insights
        WHERE personId = ? AND subject IS NOT NULL
        ORDER BY createdAt DESC
        LIMIT 3
      `,
      person.id,
    )) as Array<{ subject: string | null }>;

    result.push({
      person,
      memoryCount: Number(memoryCountRow.count),
      upcomingEventCount: Number(upcomingEventCountRow.count),
      insightCount: Number(insightCountRow.count),
      topSubjects: subjectRows.map((item) => item.subject).filter(Boolean) as string[],
    });
  }

  return result;
}

export async function getPersonDetail(personId: string) {
  await initializeDatabase();
  const personRow = (await db.getFirstAsync(`SELECT * FROM people WHERE id = ? LIMIT 1`, personId)) as DbRow | null;
  if (!personRow) return null;

  const memoryRows = (await db.getAllAsync(
    `
      SELECT m.id
      FROM memories m
      JOIN memory_people mp ON mp.memoryId = m.id
      WHERE mp.personId = ?
      ORDER BY m.createdAt DESC
    `,
    personId,
  )) as Array<{ id: string }>;

  const [person, bundles] = await Promise.all([
    Promise.resolve(mapPerson(personRow)),
    Promise.all(memoryRows.map((row) => getMemoryBundle(row.id))),
  ]);

  return {
    person,
    bundles: bundles.filter(Boolean) as MemoryBundle[],
  };
}

export async function searchInsights(term: string) {
  await initializeDatabase();
  const like = `%${term.trim().toLowerCase()}%`;
  if (!term.trim()) return [];

  const rows = (await db.getAllAsync(
    `
      SELECT DISTINCT p.*
      FROM people p
      JOIN insights i ON i.personId = p.id
      WHERE lower(i.content) LIKE ? OR lower(COALESCE(i.subject, '')) LIKE ?
      ORDER BY p.updatedAt DESC
    `,
    like,
    like,
  )) as DbRow[];

  const results: SearchResult[] = [];
  for (const row of rows) {
    const person = mapPerson(row);
    const insightRows = (await db.getAllAsync(
      `
        SELECT * FROM insights
        WHERE personId = ? AND (lower(content) LIKE ? OR lower(COALESCE(subject, '')) LIKE ?)
        ORDER BY createdAt DESC
      `,
      person.id,
      like,
      like,
    )) as DbRow[];
    results.push({ person, insights: insightRows.map(mapInsight) });
  }

  return results;
}

export async function listQueueItems() {
  await initializeDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM processing_queue ORDER BY createdAt DESC`,
  )) as DbRow[];
  return rows.map(mapQueue);
}

export async function createQueueItem(rawOcrText: string, userNote?: string) {
  await initializeDatabase();
  const id = nanoid(12);
  const createdAt = Date.now();
  await db.runAsync(
    `
      INSERT INTO processing_queue (id, rawOcrText, userNote, status, createdAt)
      VALUES (?, ?, ?, 'pending', ?)
    `,
    id,
    rawOcrText,
    userNote ?? null,
    createdAt,
  );
  return id;
}

export async function markQueueStatus(id: string, status: QueueItem['status'], errorMessage?: string | null) {
  await initializeDatabase();
  await db.runAsync(
    `
      UPDATE processing_queue
      SET status = ?, processedAt = ?, errorMessage = ?
      WHERE id = ?
    `,
    status,
    status === 'completed' || status === 'failed' ? Date.now() : null,
    errorMessage ?? null,
    id,
  );
}

export async function getPendingQueueItems() {
  await initializeDatabase();
  const rows = (await db.getAllAsync(
    `SELECT * FROM processing_queue WHERE status = 'pending' ORDER BY createdAt ASC`,
  )) as DbRow[];
  return rows.map(mapQueue);
}

export async function createReminderForMemory(params: {
  memoryId: string;
  personId: string;
  eventId?: string | null;
  message: string;
  remindAt: number;
  localNotificationId?: string | null;
}) {
  await initializeDatabase();
  const id = nanoid(12);
  const createdAt = Date.now();
  await db.runAsync(
    `
      INSERT INTO reminders (
        id, eventId, memoryId, personId, message, remindAt, status, notificationType, localNotificationId, createdAt
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', 'push', ?, ?)
    `,
    id,
    params.eventId ?? null,
    params.memoryId,
    params.personId,
    params.message,
    params.remindAt,
    params.localNotificationId ?? null,
    createdAt,
  );
  return id;
}

export async function updateReminderNotificationId(reminderId: string, localNotificationId: string) {
  await initializeDatabase();
  await db.runAsync(
    `UPDATE reminders SET localNotificationId = ? WHERE id = ?`,
    localNotificationId,
    reminderId,
  );
}

export async function markPastRemindersSent() {
  await initializeDatabase();
  await db.runAsync(
    `
      UPDATE reminders
      SET status = 'sent'
      WHERE status = 'pending' AND remindAt < ?
    `,
    Date.now(),
  );
}

export async function saveParsedCapture(parsed: ParsedCapture, sourceType: Memory['sourceType'] = 'screenshot') {
  await initializeDatabase();

  const people = [];
  for (const name of parsed.personNames) {
    if (!name.trim()) continue;
    people.push(await resolvePersonId(name));
  }

  const resolvedPeople = people.length > 0 ? people : [await resolvePersonId('Unknown contact')];
  const primaryPerson = resolvedPeople[0];
  const memoryId = nanoid(12);
  const createdAt = Date.now();

  await db.runAsync(
    `
      INSERT INTO memories (id, sourceType, title, body, userNote, rawOcrText, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    memoryId,
    sourceType,
    parsed.title,
    parsed.body,
    parsed.userNote ?? null,
    parsed.rawOcrText,
    createdAt,
    createdAt,
  );

  for (const [index, person] of resolvedPeople.entries()) {
    await db.runAsync(
      `INSERT INTO memory_people (memoryId, personId, isPrimary) VALUES (?, ?, ?)`,
      memoryId,
      person.id,
      index === 0 ? 1 : 0,
    );
  }

  const eventRows: EventItem[] = [];
  for (const event of parsed.events) {
    const matchedPerson =
      resolvedPeople.find((person) => normalizeName(person.name) === normalizeName(event.personName ?? '')) ??
      primaryPerson;
    const eventId = nanoid(12);
    await db.runAsync(
      `
        INSERT INTO events (
          id, memoryId, personId, title, description, eventDate, eventEndDate, location, calendarEventId, isCompleted, createdAt
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, 0, ?)
      `,
      eventId,
      memoryId,
      matchedPerson.id,
      event.title,
      event.description ?? null,
      event.eventDate,
      event.eventEndDate ?? null,
      event.location ?? null,
      createdAt,
    );
    eventRows.push({
      id: eventId,
      memoryId,
      personId: matchedPerson.id,
      title: event.title,
      description: event.description ?? null,
      eventDate: event.eventDate,
      eventEndDate: event.eventEndDate ?? null,
      location: event.location ?? null,
      calendarEventId: null,
      isCompleted: false,
      createdAt,
    });
  }

  const insightIds: string[] = [];
  for (const insight of parsed.insights) {
    const matchedPerson =
      resolvedPeople.find((person) => normalizeName(person.name) === normalizeName(insight.personName ?? '')) ??
      primaryPerson;
    const insightId = nanoid(12);
    await db.runAsync(
      `
        INSERT INTO insights (id, memoryId, personId, category, content, subject, confidence, createdAt)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      insightId,
      memoryId,
      matchedPerson.id,
      insight.category,
      insight.content,
      insight.subject ?? null,
      insight.confidence ?? null,
      createdAt,
    );
    insightIds.push(insightId);
  }

  await attachTags(memoryId, insightIds, parsed.tags);
  await createDefaultReminders(memoryId, resolvedPeople, eventRows);

  return getMemoryBundle(memoryId);
}

export async function createManualMemory(input: ManualMemoryInput) {
  const parsed: ParsedCapture = {
    personNames: input.personNames.filter(Boolean),
    title: input.title,
    body: input.body ?? '',
    userNote: input.note ?? '',
    rawOcrText: input.rawOcrText ?? input.body ?? input.title,
    events:
      input.eventTitle && input.eventDate
        ? [
            {
              title: input.eventTitle,
              eventDate: input.eventDate,
              location: input.eventLocation,
            },
          ]
        : [],
    insights:
      input.insightContent && input.insightCategory
        ? [
            {
              category: input.insightCategory,
              content: input.insightContent,
              subject: input.insightContent.split(' ').slice(0, 3).join(' '),
            },
          ]
        : [],
    tags: input.tags ?? [],
    duplicateCandidates: [],
  };

  return saveParsedCapture(parsed, 'manual');
}

export async function seedDemoData() {
  await initializeDatabase();
  const row = (await db.getFirstAsync(`SELECT COUNT(*) as count FROM memories LIMIT 1`)) as { count: number } | null;
  if (row && Number(row.count) > 0) return;

  await saveParsedCapture({
    personNames: ['Alex Chen'],
    title: 'Coffee and hackathon follow-up',
    body:
      'Alex mentioned he hosts hackathons at UCLA and wants to catch up on a startup idea over coffee next Tuesday.',
    userNote: 'Remind me before I land in LA.',
    rawOcrText:
      "Alex: let's grab coffee next Tuesday at Blue Bottle. Also, I'm hosting another UCLA hackathon next month if you want in.",
    events: [
      {
        title: 'Coffee at Blue Bottle',
        description: 'Catch up on the startup idea.',
        eventDate: plusDays(Date.now(), 5),
        location: 'Blue Bottle, 3rd St',
      },
    ],
    insights: [
      {
        category: 'skill',
        content: 'Hosts hackathons regularly at UCLA',
        subject: 'hackathons',
      },
      {
        category: 'interest',
        content: 'Actively exploring startup ideas',
        subject: 'startup',
      },
    ],
    tags: ['hackathon', 'startup', 'coffee'],
    duplicateCandidates: [],
  });

  await saveParsedCapture({
    personNames: ['Mina Patel', 'Chris Nolan'],
    title: 'Design lead intro',
    body: 'Mina introduced Chris from Stripe. Chris is strong on AI design systems and offered to review flows.',
    userNote: 'Worth following up in a week.',
    rawOcrText:
      'Mina: You should meet Chris from Stripe. He is great at AI design systems and can help review your onboarding.',
    events: [],
    insights: [
      {
        category: 'connection',
        content: 'Connected to Stripe product design',
        subject: 'Stripe',
        personName: 'Chris Nolan',
      },
      {
        category: 'skill',
        content: 'Strong at AI design systems',
        subject: 'design systems',
        personName: 'Chris Nolan',
      },
    ],
    tags: ['design', 'ai', 'stripe'],
    duplicateCandidates: [],
  });
}
