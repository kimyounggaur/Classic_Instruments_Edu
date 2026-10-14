import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
// @ts-expect-error Node's test runner executes TypeScript directly.
import { evidenceForPage, firstSentence, firstSourcePage, pageRanges, retrieveEvidence, type KnowledgeEntry } from '../lib/knowledge.ts';

const entries: KnowledgeEntry[] = JSON.parse(readFileSync(new URL('../public/data/knowledge.json', import.meta.url), 'utf8')).entries;

test('every supplied example retrieves its own entry without rewriting source text', () => {
  for (const entry of entries) {
    for (const question of entry.sampleQuestions) {
      const answer = retrieveEvidence(entries, entry.instrument, question, 1);
      assert.equal(answer.status, 'matched', question);
      assert.equal(answer.entries[0]?.id, entry.id, question);
      assert.equal(answer.entries[0]?.verifiedContent, entry.verifiedContent);
      assert.equal(answer.entries[0]?.sourceFileUrl, entry.sourceFileUrl);
    }
  }
});

test('cello and violin do not mix fingering sequences', () => {
  const cello = retrieveEvidence(entries, 'cello', 'D장조 운지');
  const violin = retrieveEvidence(entries, 'violin', 'D장조 운지');
  assert.equal(cello.status, 'matched');
  assert.equal(violin.status, 'matched');
  assert.ok(cello.entries.every((entry: KnowledgeEntry) => entry.instrument === 'cello'));
  assert.ok(violin.entries.every((entry: KnowledgeEntry) => entry.instrument === 'violin'));
  assert.ok(cello.entries[0].fingeringSpec.includes('3'));
  assert.notEqual(cello.entries[0].fingeringSpec, violin.entries[0].fingeringSpec);
});

test('a question naming a different instrument cannot use the currently open book', () => {
  const answer = retrieveEvidence(entries, 'violin', '클라리넷 G4 운지 알려줘', 3);
  assert.equal(answer.status, 'different-instrument');
  assert.deepEqual(answer.entries, []);
});

test('unsupported instruments and unrelated topics have no inferred fallback', () => {
  assert.equal(retrieveEvidence(entries, 'tuba', '튜바 운지').status, 'unavailable');
  assert.equal(retrieveEvidence(entries, 'violin', '서울 맛집 추천해줘', 3).status, 'no-match');
  assert.equal(retrieveEvidence(entries, 'violin', '           ', 3).status, 'no-match');
});

test('unlisted exact pitch cannot return lower-register fingering merely on keyword overlap', () => {
  const answer = retrieveEvidence(entries, 'flute', '플루트 F7 운지');
  assert.equal(answer.status, 'no-match');
  assert.deepEqual(answer.entries, []);
});

test('unsupported Korean note names and octave qualifiers do not reuse a nearby fingering', () => {
  for (const question of ['플루트 도 운지', '플루트 높은 시 운지', '플루트 파샵 운지', '플루트 4옥타브 시 운지', '플루트 F5 운지']) {
    const answer = retrieveEvidence(entries, 'flute', question, 25);
    assert.equal(answer.status, 'no-match', question);
    assert.deepEqual(answer.entries, [], question);
  }
  assert.equal(retrieveEvidence(entries, 'clarinet', '클라리넷 시 운지', 15).status, 'no-match');
});

test('specific unsupported techniques cannot pass through shared instrument keywords', () => {
  for (const question of ['바이올린 비브라토 손목', '바이올린 7포지션 운지', '바이올린 D4 하모닉스 운지', '바이올린 활 가격']) {
    assert.equal(retrieveEvidence(entries, 'violin', question, 3).status, 'no-match', question);
  }
});

test('user-proposed fingering combinations cannot borrow keys from other notes or comparisons', () => {
  const cases = [
    ['flute', '플루트 B4 T+L1+L2 운지'],
    ['cello', '첼로 D장조 0-1-2-3 운지'],
    ['cello', '첼로 2번 파샵 운지'],
    ['violin', '바이올린 E4 3번 운지'],
  ];
  for (const [instrument, question] of cases) {
    assert.equal(retrieveEvidence(entries, instrument, question, 25).status, 'no-match', question);
  }
});

test('generic keywords request clarification and current page does not override ambiguity', () => {
  for (const question of ['운지', '자세', '손가락', '키', '음계 연습']) {
    const answer = retrieveEvidence(entries, 'violin', question, 3);
    assert.equal(answer.status, 'no-match', question);
    assert.deepEqual(answer.entries, []);
  }
});

test('supported Korean note query retrieves the exact three-note flute specification', () => {
  const answer = retrieveEvidence(entries, 'flute', '플루트 시 운지');
  assert.equal(answer.status, 'matched');
  assert.equal(answer.entries[0]?.id, 'flute-unit03-b4-a4-g4-fingerings');
});

test('flute pitch query preserves the stated thumb and pinky keys', () => {
  const answer = retrieveEvidence(entries, 'flute', 'B4 운지');
  assert.equal(answer.status, 'matched');
  assert.equal(answer.entries[0]?.id, 'flute-unit03-b4-a4-g4-fingerings');
  assert.ok(answer.entries[0].fingeringSpec.includes('T + L1 + R4'));
});

test('pages include explicitly cited appendices and exclude uncited cover', () => {
  assert.deepEqual(pageRanges('25–36 (부록 52, 55)'), [[25, 36], [52, 52], [55, 55]]);
  assert.equal(evidenceForPage(entries, 'violin', 1).length, 0);
  assert.ok(evidenceForPage(entries, 'flute', 52).some((entry: KnowledgeEntry) => entry.id === 'flute-unit03-b4-a4-g4-fingerings'));
  assert.equal(firstSourcePage(entries[0]), 3);
});

test('briefing sentence is an unmodified substring rather than generated advice', () => {
  for (const entry of entries) {
    const sentence = firstSentence(entry.verifiedContent);
    assert.ok(sentence.length > 0);
    assert.ok(entry.verifiedContent.startsWith(sentence));
  }
});
