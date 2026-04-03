import { useCallback } from 'react';

import { listPeople } from '@/src/db/repository';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function usePeople() {
  const loader = useCallback(() => listPeople(), []);
  return useAsyncResource(loader, []);
}
