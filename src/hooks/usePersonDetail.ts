import { useCallback } from 'react';

import { getPersonDetail } from '@/src/db/repository';
import { useAsyncResource } from '@/src/hooks/useAsyncResource';

export function usePersonDetail(id?: string | string[]) {
  const personId = Array.isArray(id) ? id[0] : id;
  const loader = useCallback(() => (personId ? getPersonDetail(personId) : Promise.resolve(null)), [personId]);
  return useAsyncResource(loader, null);
}
