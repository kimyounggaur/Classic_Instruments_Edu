'use client';

import { useState } from 'react';
import { ArrowUp, BookOpen, Check, ChevronRight, Clock3, ExternalLink, GraduationCap, Lightbulb, MessageCircle, Play, Quote, Sparkles } from 'lucide-react';
import type { Instrument } from '@/lib/catalog';
import rawKnowledge from '@/public/data/knowledge.json';
import targetCatalog from '@/public/data/target_catalog.json';
import { evidenceForPage, firstSentence, firstSourcePage, retrieveEvidence, type EvidenceResult, type KnowledgeEntry } from '@/lib/knowledge';
import './teaching.css';

const knowledge: KnowledgeEntry[] = rawKnowledge.entries;
const targetCount = targetCatalog.targets.length;

export interface TeachingPanelProps {
  instrument: Instrument;
  page: number;
  onOpenPage: (n: number) => void;
  onLaunch: () => void;
  onVideo: () => void;
  onQuestion: (q: string) => void;
}

export function TeachingPanel(props: TeachingPanelProps) {
  // A different instrument starts a fresh conversation, so its excerpts cannot leak across books.
  return <TeachingPanelContent key={props.instrument.id} {...props} />;
}

function TeachingPanelContent({ instrument, page, onOpenPage, onLaunch, onVideo, onQuestion }: TeachingPanelProps) {
  const [mode, setMode] = useState<'teacher' | 'student'>('teacher');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<{ question: string; result: EvidenceResult } | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [copiedEntry, setCopiedEntry] = useState('');
  const [copyError, setCopyError] = useState(false);
  const scopedEntries = knowledge.filter(entry => entry.instrument === instrument.id);
  const currentEntries = evidenceForPage(knowledge, instrument.id, page);
  const current = currentEntries[0];
  const suggested = (current ? [current, ...scopedEntries.filter(entry => entry.id !== current.id)] : scopedEntries).slice(0, 3);

  function ask(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    setMode('student');
    setQuestion('');
    setAnswer({ question: trimmed, result: retrieveEvidence(knowledge, instrument.id, trimmed, page) });
    onQuestion(trimmed);
  }

  async function copyBriefing() {
    if (!current) return;
    const text = `${instrument.name} 수업 브리핑\n${current.chapter}\n\n${current.verifiedContent}\n\n운지·주법: ${current.fingeringSpec}\n확인할 점: ${current.cautionNotes}\n\n출처: ${current.bookTitle}, ${current.chapter}, p.${current.pageRange}\n${current.sourceFileUrl}\n연동 실습 앱: 합성 연결 시연에서만 확인\n\n수업 시간 제안 (총 45분): 도입 5분 / 함께 읽기 10분 / 실습 20분 / 돌아보기 10분\n미검수 원자료 발췌 · 전문 교사 검수 완료 미확인`;
    try {
      await navigator.clipboard.writeText(text);
      setCopiedEntry(current.id);
      setCopyError(false);
    } catch { setCopyError(true); }
  }

  return <aside className="teaching-panel" aria-label="수업 보조교사">
    <div className="teaching-heading">
      <span className="teaching-avatar"><Sparkles size={19} strokeWidth={1.7} /></span>
      <div><h2>수업 보조교사</h2><p>지금 펼친 교재와 함께</p></div>
      <span className="teaching-live-dot" title="교재 연결됨" />
    </div>
    <div className="teaching-mode" role="tablist" aria-label="보조교사 모드">
      <button type="button" role="tab" id="teacher-tab" aria-controls="teacher-content" aria-selected={mode === 'teacher'} onClick={() => setMode('teacher')}><GraduationCap size={15} /> 선생님 모드</button>
      <button type="button" role="tab" id="student-tab" aria-controls="student-content" aria-selected={mode === 'student'} onClick={() => setMode('student')}><MessageCircle size={14} /> 학생 모드</button>
    </div>
    <div className="teaching-scroll">
      <div className="teaching-context"><BookOpen size={13} /><span>{instrument.name} · {page}쪽</span><span>교재 연결</span></div>
      {mode === 'teacher' ? <div id="teacher-content" role="tabpanel" aria-labelledby="teacher-tab">
        <div className="teaching-section-head"><h3>오늘의 수업 브리핑</h3><span>TEACHING NOTE</span></div>
        {current ? <>
          <div className="teaching-focus-card">
            <span className="teaching-eyebrow">이 단원에서 함께 볼 내용</span>
            <h4>{current.chapter}</h4>
            <p>{firstSentence(current.verifiedContent)}</p>
            <button type="button" className="teaching-text-link" onClick={() => onOpenPage(firstSourcePage(current))}>교재 {current.pageRange}쪽 보기 <ChevronRight size={14} /></button>
          </div>
          <div className="teaching-note-block"><h4><Lightbulb size={15} /> 운지·주법 확인</h4><p>{current.fingeringSpec}</p></div>
          <div className="teaching-caution"><span>수업 전 확인할 점</span><p>{current.cautionNotes}</p></div>
          <div className="teaching-action-pair">
            <button type="button" onClick={onLaunch}><Play size={14} fill="currentColor" /> 실습 앱</button>
            <button type="button" onClick={onVideo}><Play size={14} /> 시범 영상</button>
          </div>
          <button type="button" className="teaching-plan-toggle" aria-expanded={showPlan} onClick={() => setShowPlan(!showPlan)}><span><Clock3 size={15} /> 45분 수업 흐름</span><span>시간 배분 제안 <ChevronRight size={14} className={showPlan ? 'teaching-chevron-open' : ''} /></span></button>
          {showPlan && <div className="teaching-timeline">
            {[['05', '도입', '오늘의 교재 단원과 학습 내용을 함께 확인해요.'], ['10', '함께 읽기', '위 근거 문단과 운지·주법 설명을 읽어요.'], ['20', '실습', '연결된 실습 앱에서 교재 내용을 연습해요.'], ['10', '돌아보기', '교재의 확인할 점을 읽고 질문을 정리해요.']].map(([minutes, title, text]) => <div key={title}><b>{minutes}<small>분</small></b><p><strong>{title}</strong><span>{text}</span></p></div>)}
            <small>시간 배분과 활동 순서는 수업 운영을 위한 제안입니다.</small>
          </div>}
          <details className="teaching-source"><summary><Quote size={12} /> 브리핑 근거와 원문</summary><p>{current.bookTitle}<br />{current.chapter} · p.{current.pageRange}</p><a href={current.sourceFileUrl} target="_blank" rel="noreferrer">교재 원문 열기 <ExternalLink size={11} /></a><p className="teaching-source-caption">미검수 원자료의 발췌문입니다.</p></details>
          <button type="button" className="teaching-copy" onClick={copyBriefing}>{copiedEntry === current.id ? <Check size={14} /> : <BookOpen size={14} />}{copiedEntry === current.id ? '수업 브리핑을 복사했어요' : '출처와 함께 브리핑 복사'}</button>
          {copyError && <p className="teaching-status" role="status">복사가 지원되지 않는 환경입니다. 위 내용을 선택해 복사해 주세요.</p>}
        </> : <div className="teaching-empty"><BookOpen size={25} /><h4>{scopedEntries.length ? '교재를 펼치고 수업을 시작해요' : '교재 원문을 먼저 확인해 주세요'}</h4><p>{scopedEntries.length ? '이 쪽에는 연결된 브리핑이 없습니다. 근거가 있는 단원으로 이동해 보세요.' : `${instrument.name}의 보조교사 근거 데이터는 준비 중입니다. 등록된 다른 악기의 설명을 대신 제공하지 않습니다.`}</p>{scopedEntries[0] ? <button type="button" onClick={() => onOpenPage(firstSourcePage(scopedEntries[0]))}>첫 학습 단원으로 <ChevronRight size={14} /></button> : <a href={instrument.sourceUrl} target="_blank" rel="noreferrer">교재 원문 열기 <ExternalLink size={13} /></a>}</div>}
      </div> : <div id="student-content" role="tabpanel" aria-labelledby="student-tab">
        <div className="teaching-section-head"><h3>교재에 물어보세요</h3><span>SOURCE Q&A</span></div>
        <p className="teaching-intro">{instrument.name} 교재 데이터에서 질문과 관련된 설명을 찾아드려요.</p>
        {answer ? <div aria-live="polite" className="teaching-answer">
          <div className="teaching-question-bubble">{answer.question}</div>
          <div className="teaching-answer-label"><Sparkles size={14} /><span>{answer.result.status === 'matched' ? '교재에서 찾은 내용' : '근거를 확인할 수 없어요'}</span></div>
          <p className="teaching-answer-status">{answer.result.message}</p>
          {answer.result.entries.map(entry => <article key={entry.id} className="teaching-answer-entry">
            <blockquote>{entry.verifiedContent}</blockquote>
            <details className="teaching-more"><summary>운지·주법 및 확인할 점</summary><p>{entry.fingeringSpec}</p><p>{entry.cautionNotes}</p></details>
            <div className="teaching-answer-citation"><strong>{entry.bookTitle}</strong><span>{entry.chapter}</span><span>p.{entry.pageRange} · 미검수 원자료 발췌</span><button type="button" onClick={() => onOpenPage(firstSourcePage(entry))}><BookOpen size={12} /> 해당 단원 보기</button><a href={entry.sourceFileUrl} target="_blank" rel="noreferrer">교재 원문 <ExternalLink size={11} /></a><span>연동 실습 앱은 합성 연결 시연에서만 확인합니다.</span></div>
            <p className="teaching-guidance">체형과 악기 크기에 맞춰 담당 선생님과 대면으로 최종 확인하세요.</p>
          </article>)}
        </div> : <div className="teaching-welcome"><span><MessageCircle size={22} /></span><h4>작은 궁금증부터, 차근차근.</h4><p>교재에 근거가 있는 내용만 찾아 보여드려요.<br />아래 질문을 선택해서 시작할 수 있어요.</p></div>}
        {suggested.length > 0 && <div className="teaching-suggestions"><span>이런 질문을 해보세요</span>{suggested.map(entry => <button type="button" key={entry.id} onClick={() => ask(entry.sampleQuestions[0])}>{entry.sampleQuestions[0]}<ChevronRight size={14} /></button>)}</div>}
        {!scopedEntries.length && <p className="teaching-empty-message">이 악기의 질의응답 근거 데이터는 아직 등록되지 않았습니다.</p>}
      </div>}
    </div>
    <div className="teaching-bottom">
      <form onSubmit={event => { event.preventDefault(); ask(question); }} className="teaching-question-form"><label className="teaching-sr-only" htmlFor={`teaching-question-${instrument.id}`}>교재에 질문하기</label><textarea id={`teaching-question-${instrument.id}`} rows={1} placeholder="교재에 대해 질문해 보세요" value={question} maxLength={500} onChange={event => setQuestion(event.target.value)} onKeyDown={event => { if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) { event.preventDefault(); ask(question); } }} /><button type="submit" disabled={!question.trim()} aria-label="질문 보내기"><ArrowUp size={17} /></button></form>
      <p>미검수 원자료 {knowledge.length}개 · 목표 {targetCount}개와 분리 · 전문 교사 검수 완료 미확인</p>
      <details className="teaching-method"><summary>답변 방식 안내</summary><p>현재는 외부 생성형 AI 없이 {rawKnowledge.datasetMetadata.instrumentsCovered.length}개 악기의 미검수 원자료 {knowledge.length}개에서 관련 문단만 결정적으로 검색합니다. 구현 목표 {targetCount}개는 별도 카탈로그이며 답변 근거로 사용하지 않습니다. 출처 쪽수는 데이터에 기록된 값을 표시하므로 교재 원문과 대조해 주세요. 근거가 부족하거나 질문이 모호하면 답하지 않습니다. <a href={rawKnowledge.datasetMetadata.sourceUrl} target="_blank" rel="noreferrer">기반 데이터 원본 확인</a></p></details>
    </div>
  </aside>;
}

export default TeachingPanel;
