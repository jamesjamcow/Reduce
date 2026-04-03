import { useCallback } from 'react';

import { searchPeopleKnowledge } from '@/src/services/search';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function useSearchResults(search = '') {
  const loader = useCallback(() => searchPeopleKnowledge(search), [search]);
  return useAsyncResource(loader, []);
}
