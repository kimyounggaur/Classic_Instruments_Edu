import test from 'node:test';
import assert from 'node:assert/strict';
// @ts-expect-error Node's test runner executes TypeScript directly.
import { GET as getMe } from '../app/api/me/route.ts';
// @ts-expect-error Node's test runner executes TypeScript directly.
import { GET as getState, PUT as putState } from '../app/api/state/route.ts';
// @ts-expect-error Node's test runner executes TypeScript directly.
import { GET as getClassroom, POST as postClassroom } from '../app/api/classroom/route.ts';

test('mock-only API never exposes an account or persisted workspace', async () => {
  const me = await (await getMe()).json() as { mode: string; authenticated: boolean; accountKey: null; user: null; message: string };
  const state = await (await getState()).json() as { mode: string; accountKey: null; state: unknown };
  const classroom = await (await getClassroom()).json() as { mode: string; sessions: unknown[] };
  assert.deepEqual(me, {
    mode: 'mock-only',
    authenticated: false,
    accountKey: null,
    user: null,
    message: '합성 승인 시연은 실계정을 사용하지 않습니다.',
  });
  assert.equal(state.mode, 'mock-only');
  assert.equal(state.accountKey, null);
  assert.deepEqual(state.state, { progress: {}, bookmarks: {}, favorites: [], registry: [], videos: [], reviews: [], questions: [], reports: [] });
  assert.deepEqual(classroom.sessions, []);
  assert.equal(classroom.mode, 'mock-only');
});

test('mock-only write endpoints reject persistence', async () => {
  const stateWrite = await putState();
  const classroomWrite = await postClassroom();
  assert.equal(stateWrite.status, 405);
  assert.equal(classroomWrite.status, 405);
  assert.equal(stateWrite.headers.get('allow'), 'GET');
  assert.equal(classroomWrite.headers.get('allow'), 'GET');
});
