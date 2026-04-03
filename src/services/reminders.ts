import { getMemoryBundle, updateReminderNotificationId } from '@/src/db/repository';
import { scheduleLocalNotification } from '@/src/services/notifications';

export async function syncReminderNotifications(memoryId: string) {
  const bundle = await getMemoryBundle(memoryId);
  if (!bundle) return;

  for (const reminder of bundle.reminders) {
    if (reminder.localNotificationId || reminder.remindAt <= Date.now()) continue;
    const localId = await scheduleLocalNotification(reminder.message, reminder.remindAt);
    if (localId) {
      await updateReminderNotificationId(reminder.id, localId);
    }
  }
}
