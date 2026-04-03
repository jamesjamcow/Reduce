import { create } from 'zustand';

import type { ParsedCapture } from '@/src/types';

interface AppState {
  initialized: boolean;
  dataVersion: number;
  processingQueue: boolean;
  pendingReview: ParsedCapture | null;
  queueMessage: string | null;
  searchQuery: string;
  setInitialized: (value: boolean) => void;
  bumpDataVersion: () => void;
  setProcessingQueue: (value: boolean) => void;
  setPendingReview: (value: ParsedCapture | null) => void;
  setQueueMessage: (value: string | null) => void;
  setSearchQuery: (value: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  initialized: false,
  dataVersion: 0,
  processingQueue: false,
  pendingReview: null,
  queueMessage: null,
  searchQuery: '',
  setInitialized: (value) => set({ initialized: value }),
  bumpDataVersion: () => set((state) => ({ dataVersion: state.dataVersion + 1 })),
  setProcessingQueue: (value) => set({ processingQueue: value }),
  setPendingReview: (value) => set({ pendingReview: value }),
  setQueueMessage: (value) => set({ queueMessage: value }),
  setSearchQuery: (value) => set({ searchQuery: value }),
}));
