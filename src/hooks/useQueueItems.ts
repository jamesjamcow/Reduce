import { useCallback } from 'react';

import { listQueueItems } from '@/src/db/repository';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function useQueueItems() {
  const loader = useCallback(() => listQueueItems(), []);
  return useAsyncResource(loader, []);
}
