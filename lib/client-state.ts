'use client';

import { useState, type Dispatch, type SetStateAction } from 'react';
import type { WebApp } from './catalog';
import { emptyState, type Progress as StoredProgress, type VideoEntry, type WorkspaceState } from './server/validation';

export type Progress = StoredProgress;
export type VideoRecord = VideoEntry;
export type AppState = Omit<WorkspaceState, 'registry'> & { registry: WebApp[] };

const fresh = (): AppState => emptyState() as AppState;

/**
 * The resumed build is deliberately tab-local. It never asks for an account,
 * sends state to a server, or keeps student information between sessions.
 */
export function useLibraryState(): {
  state: AppState;
  setState: Dispatch<SetStateAction<AppState>>;
  ready: boolean;
  sync: string;
} {
  const [state, setState] = useState<AppState>(fresh);
  return {
    state,
    setState,
    ready: true,
    sync: '이 탭의 합성 시연 · 계정·학생 정보·서버 저장 없음',
  };
}
