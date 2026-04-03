import { searchInsights } from '@/src/db/repository';

export async function searchPeopleKnowledge(query: string) {
  return searchInsights(query);
}
