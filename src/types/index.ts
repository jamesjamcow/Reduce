export type SourceType = 'screenshot' | 'manual' | 'article';

export type InsightCategory =
  | 'skill'
  | 'interest'
  | 'trait'
  | 'connection'
  | 'achievement'
  | 'role'
  | 'preference'
  | 'other';

export type ReminderStatus = 'pending' | 'sent' | 'dismissed' | 'snoozed';

export type QueueStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface Person {
  id: string;
  name: string;
  normalizedName: string;
  phone?: string | null;
  email?: string | null;
  avatarUri?: string | null;
  notes?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface Memory {
  id: string;
  sourceType: SourceType;
  title: string;
  body?: string | null;
  userNote?: string | null;
  rawOcrText?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface EventItem {
  id: string;
  memoryId?: string | null;
  personId: string;
  title: string;
  description?: string | null;
  eventDate: number;
  eventEndDate?: number | null;
  location?: string | null;
  calendarEventId?: string | null;
  isCompleted: boolean;
  createdAt: number;
}

export interface Insight {
  id: string;
  memoryId?: string | null;
  personId: string;
  category: InsightCategory;
  content: string;
  subject?: string | null;
  confidence?: number | null;
  createdAt: number;
}

export interface Reminder {
  id: string;
  eventId?: string | null;
  memoryId?: string | null;
  personId: string;
  message: string;
  remindAt: number;
  status: ReminderStatus;
  notificationType: 'push';
  localNotificationId?: string | null;
  createdAt: number;
}

export interface QueueItem {
  id: string;
  rawOcrText: string;
  userNote?: string | null;
  status: QueueStatus;
  createdAt: number;
  processedAt?: number | null;
  errorMessage?: string | null;
}

export interface ParsedEventInput {
  title: string;
  description?: string;
  eventDate: number;
  eventEndDate?: number | null;
  location?: string;
  personName?: string;
}

export interface ParsedInsightInput {
  category: InsightCategory;
  content: string;
  subject?: string;
  personName?: string;
  confidence?: number;
}

export interface ParsedCapture {
  personNames: string[];
  title: string;
  body: string;
  userNote?: string;
  rawOcrText: string;
  events: ParsedEventInput[];
  insights: ParsedInsightInput[];
  tags: string[];
  duplicateCandidates: DuplicateCandidate[];
}

export interface DuplicateCandidate {
  inputName: string;
  existingPersonId: string;
  existingPersonName: string;
}

export interface MemoryBundle {
  memory: Memory;
  people: Person[];
  events: EventItem[];
  insights: Insight[];
  reminders: Reminder[];
  tags: string[];
}

export interface HomeFeedItem {
  bundle: MemoryBundle;
  nextEventAt?: number;
  pendingReminderCount: number;
}

export interface PersonListItem {
  person: Person;
  memoryCount: number;
  upcomingEventCount: number;
  insightCount: number;
  topSubjects: string[];
}

export interface SearchResult {
  person: Person;
  insights: Insight[];
}

export interface ManualMemoryInput {
  personNames: string[];
  title: string;
  body?: string;
  note?: string;
  rawOcrText?: string;
  eventTitle?: string;
  eventDate?: number;
  eventLocation?: string;
  insightContent?: string;
  insightCategory?: InsightCategory;
  tags?: string[];
}

export interface AppSettings {
  ownApiKey?: string | null;
  useDirectApi?: boolean;
  notificationsEnabled?: boolean;
}
