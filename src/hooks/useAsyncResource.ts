import { useEffect, useState } from 'react';

import { useAppStore } from '@/src/stores/appStore';

export function useAsyncResource<T>(loader: () => Promise<T>, initialValue: T) {
  const dataVersion = useAppStore((state) => state.dataVersion);
  const [value, setValue] = useState<T>(initialValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    setLoading(true);
    loader()
      .then((nextValue) => {
        if (active) setValue(nextValue);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [dataVersion, loader]);

  return { value, loading, setValue };
}
