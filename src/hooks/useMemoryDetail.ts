import { useCallback } from 'react';

import { getMemoryBundle } from '@/src/db/repository';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function useMemoryDetail(id?: string | string[]) {
  const memoryId = Array.isArray(id) ? id[0] : id;
  const loader = useCallback(() => (memoryId ? getMemoryBundle(memoryId) : Promise.resolve(null)), [memoryId]);
  return useAsyncResource(loader, null);
}
