import * as SQLite from 'expo-sqlite';

import { migrations } from '@/src/db/schema';

export const db = SQLite.openDatabaseSync('reduce.db');

let initialized = false;

export async function initializeDatabase() {
  if (initialized) return;

  for (const migration of migrations) {
    await db.execAsync(migration);
  }

  initialized = true;
}
