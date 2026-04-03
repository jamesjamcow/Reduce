import * as Calendar from 'expo-calendar';
import { Platform } from 'react-native';

export async function addEventToCalendar(title: string, startDate: number, endDate?: number | null, location?: string | null) {
  if (Platform.OS === 'web') return null;

  const { status } = await Calendar.requestCalendarPermissionsAsync();
  if (status !== 'granted') return null;

  const calendars = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  const defaultCalendar = calendars.find((item) => item.allowsModifications);
  if (!defaultCalendar) return null;

  return Calendar.createEventAsync(defaultCalendar.id, {
    title,
    startDate: new Date(startDate),
    endDate: new Date(endDate ?? startDate + 60 * 60 * 1000),
    location: location ?? undefined,
  });
}
