import dayjs from 'dayjs';

import { listPeople, normalizeName } from '@/src/db/repository';
import type { DuplicateCandidate, ParsedCapture, ParsedInsightInput } from '@/src/types';

function unique(values: string[]) {
  return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

function titleFromText(text: string) {
  if (text.toLowerCase().includes('coffee')) return 'Coffee follow-up';
  if (text.toLowerCase().includes('hackathon')) return 'Hackathon connection';
  if (text.toLowerCase().includes('intro')) return 'New intro to capture';
  return 'Conversation memory';
}

function extractPersonNames(text: string, note?: string) {
  const speakerMatches = `${text}\n${note ?? ''}`.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)?(?=:|\b)/g) ?? [];
  const explicitMatches = `${text}\n${note ?? ''}`.match(/\b[A-Z][a-z]+(?:\s[A-Z][a-z]+)+\b/g) ?? [];
  const combined = unique([...speakerMatches, ...explicitMatches]).filter((name) => !['I', 'Tuesday', 'Friday'].includes(name));
  return combined.slice(0, 4);
}

function extractEventDate(text: string) {
  const lowered = text.toLowerCase();
  if (lowered.includes('tomorrow')) return dayjs().add(1, 'day').hour(10).minute(0).valueOf();
  if (lowered.includes('next week')) return dayjs().add(7, 'day').hour(10).minute(0).valueOf();
  if (lowered.includes('next month')) return dayjs().add(1, 'month').date(6).hour(11).minute(0).valueOf();
  if (lowered.includes('tuesday')) return dayjs().day(9).hour(10).minute(0).valueOf();
  if (lowered.includes('friday')) return dayjs().day(12).hour(18).minute(30).valueOf();
  return undefined;
}

function extractInsights(text: string, personNames: string[]) {
  const lowered = text.toLowerCase();
  const insights: ParsedInsightInput[] = [];
  const personName = personNames[0];

  if (lowered.includes('hackathon')) {
    insights.push({
      category: 'skill',
      content: 'Hosts hackathons regularly',
      subject: 'hackathons',
      personName,
      confidence: 0.82,
    });
  }

  if (lowered.includes('google')) {
    insights.push({
      category: 'connection',
      content: 'Has connections at Google',
      subject: 'Google',
      personName,
      confidence: 0.76,
    });
  }

  if (lowered.includes('design')) {
    insights.push({
      category: 'skill',
      content: 'Strong at design systems and UX review',
      subject: 'design systems',
      personName,
      confidence: 0.79,
    });
  }

  if (lowered.includes('machine learning') || lowered.includes('llm') || lowered.includes('ai')) {
    insights.push({
      category: 'interest',
      content: 'Deeply interested in machine learning and AI',
      subject: 'machine learning',
      personName,
      confidence: 0.74,
    });
  }

  if (lowered.includes('stripe')) {
    insights.push({
      category: 'connection',
      content: 'Connected to Stripe product and design teams',
      subject: 'Stripe',
      personName,
      confidence: 0.73,
    });
  }

  return insights;
}

async function buildDuplicateCandidates(personNames: string[]) {
  const existingPeople = await listPeople();
  const duplicates: DuplicateCandidate[] = [];

  for (const inputName of personNames) {
    const normalized = normalizeName(inputName);
    const first = normalized.split(' ')[0];
    for (const item of existingPeople) {
      const existing = item.person;
      if (existing.normalizedName === normalized) continue;
      if (existing.normalizedName.startsWith(first) || normalized.startsWith(existing.normalizedName.split(' ')[0])) {
        duplicates.push({
          inputName,
          existingPersonId: existing.id,
          existingPersonName: existing.name,
        });
      }
    }
  }

  return duplicates.slice(0, 3);
}

export async function analyzeCapture(rawOcrText: string, userNote?: string) {
  const combined = [rawOcrText, userNote].filter(Boolean).join('\n');
  const personNames = extractPersonNames(rawOcrText, userNote);
  const eventDate = extractEventDate(combined);
  const duplicateCandidates = await buildDuplicateCandidates(personNames);
  const title = titleFromText(combined);

  return {
    personNames: personNames.length > 0 ? personNames : ['Unknown contact'],
    title,
    body: combined,
    userNote: userNote ?? '',
    rawOcrText,
    events: eventDate
      ? [
          {
            title: combined.toLowerCase().includes('coffee') ? 'Coffee meetup' : 'Planned follow-up',
            description: 'Parsed from screenshot and user note.',
            eventDate,
            location: combined.toLowerCase().includes('blue bottle') ? 'Blue Bottle' : undefined,
            personName: personNames[0],
          },
        ]
      : [],
    insights: extractInsights(combined, personNames),
    tags: unique(
      [
        combined.toLowerCase().includes('coffee') ? 'coffee' : '',
        combined.toLowerCase().includes('hackathon') ? 'hackathon' : '',
        combined.toLowerCase().includes('ai') ? 'ai' : '',
        combined.toLowerCase().includes('startup') ? 'startup' : '',
      ].filter(Boolean),
    ),
    duplicateCandidates,
  } satisfies ParsedCapture;
}
