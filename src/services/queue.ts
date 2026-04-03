import { analyzeCapture } from '@/src/services/ai';
import { getShareSheetSample } from '@/src/services/ocr';
import { sendSaveConfirmation } from '@/src/services/notifications';
import { syncReminderNotifications } from '@/src/services/reminders';
import {
  createQueueItem,
  getPendingQueueItems,
  listQueueItems,
  markQueueStatus,
  saveParsedCapture,
} from '@/src/db/repository';

export async function enqueueCapture(rawOcrText: string, userNote?: string) {
  return createQueueItem(rawOcrText, userNote);
}

export async function enqueueSampleShare() {
  return createQueueItem(getShareSheetSample(), 'Remind me before the meetup.');
}

export async function processPendingQueue() {
  const pending = await getPendingQueueItems();
  const savedMemoryIds: string[] = [];

  for (const item of pending) {
    try {
      await markQueueStatus(item.id, 'processing');
      const parsed = await analyzeCapture(item.rawOcrText, item.userNote ?? undefined);
      const bundle = await saveParsedCapture(parsed, 'screenshot');
      if (bundle) {
        savedMemoryIds.push(bundle.memory.id);
        await syncReminderNotifications(bundle.memory.id);
        await sendSaveConfirmation(`Saved: ${bundle.memory.title}`);
      }
      await markQueueStatus(item.id, 'completed');
    } catch (error) {
      await markQueueStatus(item.id, 'failed', error instanceof Error ? error.message : 'Unknown queue error');
    }
  }

  return {
    processed: pending.length,
    savedMemoryIds,
    queueItems: await listQueueItems(),
  };
}
