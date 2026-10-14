/** Deterministic excerpt retrieval. It never produces or rewrites musical advice. */
export interface KnowledgeEntry {
  id: string;
  instrument: string;
  instrumentKo: string;
  level: number;
  bookTitle: string;
  sourceFileUrl: string;
  chapter: string;
  pageRange: string;
  topicKeywords: string[];
  verifiedContent: string;
  fingeringSpec: string;
  cautionNotes: string;
  linkedWebApp: string;
  sampleQuestions: string[];
}

export interface EvidenceResult {
  status: 'matched' | 'unavailable' | 'no-match' | 'different-instrument';
  entries: KnowledgeEntry[];
  message: string;
}

const instrumentNames: Record<string, string[]> = {
  violin: ['바이올린', 'violin'], viola: ['비올라', 'viola'], cello: ['첼로', 'cello'],
  bass: ['콘트라베이스', '더블베이스', 'double bass'], flute: ['플루트', '플룻', 'flute'],
  oboe: ['오보에', 'oboe'], clarinet: ['클라리넷', 'clarinet'], bassoon: ['바순', 'bassoon'],
  saxophone: ['색소폰', 'saxophone'], trumpet: ['트럼펫', 'trumpet'], horn: ['호른', 'horn'],
  trombone: ['트롬본', 'trombone'], euphonium: ['유포늄', 'euphonium'], tuba: ['튜바', 'tuba'],
};
const filler = new Set(['어떻게', '어떤', '어디', '어디에', '왜', '무슨', '무엇', '뭐', '언제', '알려줘', '알려주세요', '설명', '설명해줘', '설명해주세요', '궁금해요', '되나요', '하나요', '있나요', '인가요', '차이', '할', '때', '그', '좀', '대한', '관련', '기본', '하는', '방법', '수', '나요', '주세요', '방법은', '방법을', '알고', '싶어요']);
const genericTerms = new Set(['운지', '자세', '연습', '소리', '악기', '손가락', '키', '음', '박자', '리듬', '음계', '위치', '순서', '몇번', '눌러', '누르', '누르는']);
const endings = ['에서는', '에서', '으로는', '으로', '인가요', '인가', '까지', '부터', '처럼', '이랑', '하고', '이나', '는', '은', '이', '가', '을', '를', '와', '과', '도'];

export function normalizeQuestion(value: string): string {
  return value.toLowerCase().normalize('NFKC').replace(/♯|샾|샵|샤프/g, '#').replace(/♭|플랫/g, 'b').replace(/플룻/g, '플루트').replace(/[^\p{L}\p{N}#]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function namedPitches(text: string): string[] {
  return Array.from(text.matchAll(/\b([a-g][#b]?\d)(?=$|[^a-z0-9])/g), match => match[1]);
}

function proposesFingering(question: string): boolean {
  const text = question.toLowerCase().normalize('NFKC');
  // This search engine cannot validate a user-proposed combination. A sequence
  // may occur elsewhere in a source, for another note or a contrasting instrument.
  if (/(?:\bt\b|\bl[1-4]\b|\br[1-4]\b|(?<![a-z0-9])[0-4](?![a-z0-9]))\s*[-–→+·,]\s*(?:t\b|l[1-4]\b|r[1-4]\b|[0-4](?![a-z0-9]))/.test(text)) return true;
  const query = normalizeQuestion(question);
  const hasNumberedFinger = /[1-4]\s*번/.test(query);
  const hasNamedNote = namedPitches(query).length > 0 || /(?:^|\s)(도|레|미|파|솔|라|시)(#|b)?(?=$|\s|[은는이가을를])/.test(query);
  return hasNumberedFinger && hasNamedNote;
}

/** Fingering questions need evidence for the requested notes, not just an occurrence
 * in a caution or a description of an unintroduced range. No octave is inferred. */
function supportsRequestedNotes(entry: KnowledgeEntry, query: string): boolean {
  const asksFingering = /운지|손가락|누르|눌러/.test(query);
  const source = normalizeQuestion(asksFingering ? entry.fingeringSpec : [entry.verifiedContent, entry.fingeringSpec].join(' '));
  const sourceNotes = namedPitches(source);
  if (namedPitches(query).some(note => !sourceNotes.includes(note))) return false;
  if (!asksFingering) return true;
  const noteLetters: Record<string, string> = { 도: 'c', 레: 'd', 미: 'e', 파: 'f', 솔: 'g', 라: 'a', 시: 'b' };
  const koreanNotes = Array.from(query.matchAll(/(?:^|[^가-힣a-z])(?:(높은|낮은)\s*)?(도|레|미|파|솔|라|시)(#|b)?(?=$|[^가-힣a-z]|[은는이가을를와과])/g));
  for (const match of koreanNotes) {
    const [, register, solfege, accidental = ''] = match;
    const letter = noteLetters[solfege] + accidental;
    if (!sourceNotes.some(note => note.slice(0, -1) === letter)) return false;
    if (register && !normalizeQuestion(entry.verifiedContent).includes(`${register} ${solfege}${accidental}`)) return false;
  }
  return true;
}

function tokens(value: string, instrument: string): string[] {
  let text = normalizeQuestion(value);
  for (const name of instrumentNames[instrument] ?? []) text = text.replaceAll(name, ' ');
  return [...new Set(text.split(/\s+/).filter(Boolean).filter(token => !filler.has(token)).map(token => {
    for (const suffix of endings) {
      if (token.endsWith(suffix) && token.length > suffix.length + 1) return token.slice(0, -suffix.length);
    }
    // One-character music nouns matter, unlike arbitrary one-character particles.
    if (/^(활|키|음|손|줄)[은는이가을를도]$/.test(token)) return token.slice(0, 1);
    return token;
  }).filter(token => !filler.has(token)))];
}

/** Include appendix references, but never infer a page range not stated by the dataset. */
export function pageRanges(value: string): [number, number][] {
  return Array.from(value.matchAll(/(\d+)(?:\s*[–—~-]\s*(\d+))?/g), match => [Number(match[1]), Number(match[2] ?? match[1])]);
}

export function firstSourcePage(entry: KnowledgeEntry): number {
  return pageRanges(entry.pageRange)[0]?.[0] ?? 1;
}

export function evidenceForPage(entries: KnowledgeEntry[], instrument: string, page: number): KnowledgeEntry[] {
  return entries.filter(entry => entry.instrument === instrument && pageRanges(entry.pageRange).some(([start, end]) => page >= start && page <= end));
}

export function firstSentence(text: string): string {
  const boundary = /[.!?](?:\s|$)/.exec(text);
  return boundary ? text.slice(0, boundary.index + 1) : text;
}

/** Exact sample questions are preferred. Other requests need meaningful lexical evidence.
 * The current page is only a tie breaker; it cannot cause an unsupported answer.
 */
export function retrieveEvidence(entries: KnowledgeEntry[], instrument: string, question: string, page?: number): EvidenceResult {
  const eligible = entries.filter(entry => entry.instrument === instrument);
  if (!eligible.length) return { status: 'unavailable', entries: [], message: '이 악기의 질의응답 근거 데이터는 아직 등록되지 않았습니다. 교재 원문을 확인해 주세요.' };
  const query = normalizeQuestion(question);
  if (!query) return { status: 'no-match', entries: [], message: '궁금한 자세·운지·연습 방법을 입력해 주세요.' };
  const exact = eligible.find(entry => entry.sampleQuestions.some(sample => normalizeQuestion(sample) === query));
  if (exact) return { status: 'matched', entries: [exact], message: '등록된 질문과 연결된 원문 발췌를 찾았습니다.' };
  const mentionsOther = Object.entries(instrumentNames).some(([id, names]) => id !== instrument && names.some(name => query.includes(name)));
  if (mentionsOther) return { status: 'different-instrument', entries: [], message: '선택한 악기 이외의 질문은 답하지 않습니다. 해당 악기 교재로 바꾼 뒤 다시 질문해 주세요.' };
  if (proposesFingering(question)) return { status: 'no-match', entries: [], message: '입력한 손가락 조합이 그 음에 맞는지는 키워드 검색만으로 판단할 수 없습니다. 음 이름만 질문하거나 등록된 예시 질문으로 교재의 운지 설명을 확인해 주세요.' };
  const queryTokens = tokens(question, instrument);
  if (!queryTokens.length || queryTokens.every(token => genericTerms.has(token))) return { status: 'no-match', entries: [], message: '악기 이름과 함께 궁금한 음 이름·손·주법을 구체적으로 적어 주세요. 일반적인 키워드만으로 운지나 자세를 정하지 않습니다.' };
  const ranked = eligible.map(entry => {
    const body = normalizeQuestion([entry.verifiedContent, entry.fingeringSpec, entry.cautionNotes].join(' '));
    const topics = normalizeQuestion([entry.chapter, ...entry.topicKeywords].join(' '));
    const declaredQuestions = normalizeQuestion(entry.sampleQuestions.join(' '));
    if (!supportsRequestedNotes(entry, query)) return { entry, score: 0 };
    const matched = queryTokens.filter(token => body.includes(token) || topics.includes(token) || declaredQuestions.includes(token));
    const topicHits = matched.filter(token => topics.includes(token));
    // Unknown qualifiers such as vibrato, a new position or an octave are not dropped.
    // A source-linked sample question can supply wording, but never a missing note.
    const coverage = matched.length / queryTokens.length;
    if (!matched.length || coverage < 1 || (!topicHits.length && matched.length < 2)) return { entry, score: 0 };
    const pageBoost = page && evidenceForPage([entry], instrument, page).length ? 0.1 : 0;
    return { entry, score: topicHits.length * 4 + matched.length + coverage + pageBoost };
  }).filter(item => item.score > 0).sort((a, b) => b.score - a.score || a.entry.id.localeCompare(b.entry.id));
  if (!ranked.length) return { status: 'no-match', entries: [], message: '등록된 교재 데이터에서 질문에 답할 근거를 찾지 못했습니다. 추측해서 답하지 않습니다. 아래 예시 질문이나 교재 원문을 확인해 주세요.' };
  if (ranked.length > 1 && ranked[0].score - ranked[1].score < 1) return { status: 'no-match', entries: [], message: '여러 단원이 비슷하게 검색되어 답변 근거를 하나로 정할 수 없습니다. 왼손·오른손, 음 이름 또는 주법을 더 구체적으로 적어 주세요.' };
  return { status: 'matched', entries: [ranked[0].entry], message: '질문과 관련된 교재 기반 발췌입니다. 질문 전체에 대한 답인지 원문과 함께 확인해 주세요.' };
}
