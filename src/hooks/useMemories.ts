import { useCallback } from 'react';

import { listHomeFeed } from '@/src/db/repository';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function useMemories(search = '') {
  const loader = useCallback(() => listHomeFeed(search), [search]);
  return useAsyncResource(loader, []);
}
