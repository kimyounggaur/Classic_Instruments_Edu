import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const knowledge = JSON.parse(read('public/data/knowledge.json'));
const targets = JSON.parse(read('public/data/target_catalog.json'));

test('keeps the 19 unreviewed source excerpts separate from 24 implementation targets', () => {
  assert.equal(knowledge.entries.length, 19);
  assert.equal(knowledge.datasetMetadata.totalEntries, 19);
  assert.equal(knowledge.datasetMetadata.reviewStatus, 'unreviewed_source');
  assert.equal(knowledge.datasetMetadata.dataRole, 'source_excerpt_only');
  assert.equal(targets.targets.length, 24);
  assert.equal(targets.metadata.totalTargets, 24);
  assert.equal(targets.metadata.dataRole, 'implementation_target_only');
  assert.equal(targets.metadata.answerEligibility, false);
  assert.equal(new Set(targets.targets.map(target => target.phase)).size, 12);
  const sourceIds = new Set(knowledge.entries.map(entry => entry.id));
  assert.equal(targets.targets.some(target => sourceIds.has(target.id)), false);
});

test('active mock surfaces do not request accounts, devices, external apps, or external AI', () => {
  const runtime = [
    'components/AppFrame.tsx',
    'components/Classroom.tsx',
    'components/MultiAnglePlayer.tsx',
    'components/LibraryApp.tsx',
    'components/TeachingPanel.tsx',
    'lib/client-state.ts',
    'app/api/me/route.ts',
    'app/api/state/route.ts',
    'app/api/classroom/route.ts',
  ].map(read).join('\n');
  for (const forbidden of ['getUserMedia', 'mediaDevices', 'camera; microphone', '<iframe', "fetch('/api", 'fetch("/api', 'getChatGPTUser', 'signedInUser', 'getDb(', 'openai.com/api']) {
    assert.equal(runtime.includes(forbidden), false, `runtime includes ${forbidden}`);
  }
  for (const file of ['components/AppFrame.tsx', 'components/Classroom.tsx', 'components/MultiAnglePlayer.tsx']) {
    assert.match(read(file), /합성 승인 시연/);
  }
});

test('P00–P11 contract documents and mock-only API behavior are present', () => {
  const pack = read('PROMPT_PACK.md');
  for (let phase = 0; phase <= 11; phase += 1) assert.match(pack, new RegExp(`P${String(phase).padStart(2, '0')}`));
  assert.match(read('DATA_CONTRACT.md'), /19개 미검수 원자료/);
  assert.match(read('DATA_CONTRACT.md'), /24개/);
  assert.match(read('docs/SPEC.md'), /합성 시연/);
  assert.match(read('app/api/state/route.ts'), /status: 405/);
  assert.match(read('app/api/classroom/route.ts'), /status: 405/);
});
