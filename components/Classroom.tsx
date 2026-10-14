'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, ClipboardCheck, LockKeyhole, RotateCcw, ShieldCheck, Users } from 'lucide-react';
import './classroom.css';

type DemoLearner = { label: string; progress: number; note: string };

const initialLearners: DemoLearner[] = [
  { label: '합성 학습자 A', progress: 100, note: '교재의 관찰 항목을 확인한 시연 상태' },
  { label: '합성 학습자 B', progress: 60, note: '다음 안내 카드를 보는 시연 상태' },
  { label: '합성 학습자 C', progress: 20, note: '연습 흐름을 시작한 시연 상태' },
];

/** A no-account classroom walkthrough; all values live only in this component. */
export function Classroom({ instrument }: { instrument: string }) {
  const [title, setTitle] = useState('기초 자세와 첫 소리');
  const [minutes, setMinutes] = useState(10);
  const [learners, setLearners] = useState(initialLearners);
  const [notice, setNotice] = useState('');
  const completed = learners.filter(learner => learner.progress === 100).length;
  const average = useMemo(() => Math.round(learners.reduce((sum, learner) => sum + learner.progress, 0) / learners.length), [learners]);

  const advanceDemo = () => {
    setLearners(current => current.map((learner, index) => index === 1 ? { ...learner, progress: Math.min(100, learner.progress + 20), note: '다음 관찰 항목으로 이동한 시연 상태' } : learner));
    setNotice('합성 학습자 B의 진행 상태를 한 단계 올렸습니다. 실제 학습 기록은 저장하지 않습니다.');
  };

  const resetDemo = () => {
    setLearners(initialLearners);
    setNotice('합성 수업 시연을 초기 상태로 되돌렸습니다.');
  };

  return <section className="classroom" aria-label="익명 수업 미션 합성 시연">
    <header className="classroom-heading"><span className="classroom-icon"><Users size={23} /></span><div><span className="classroom-eyebrow">SYNTHETIC CLASSROOM WALKTHROUGH</span><h2>함께 배우는 음악 시간</h2><p>교사의 미션 흐름과 현황판을 익명 합성 데이터로 확인합니다.</p></div></header>
    <div className="classroom-access"><LockKeyhole size={17} /><p><strong>합성 승인 시연</strong>입니다. 실계정, 참여 코드, 학생 이름, 연락처, 기기 정보, 서버 저장을 사용하지 않습니다.</p></div>
    {notice && <p className="classroom-feedback classroom-success" role="status"><CheckCircle2 size={17} />{notice}</p>}
    <div className="classroom-layout">
      <aside className="classroom-sidebar"><section className="classroom-card classroom-entry"><div className="classroom-section-title"><h3>시연 미션 설정 <span>이 탭 안에서만 유지</span></h3></div><label htmlFor="demo-class-title">미션 제목</label><input id="demo-class-title" value={title} maxLength={120} onChange={event => setTitle(event.target.value)} /><label htmlFor="demo-class-minutes">목표 연습 시간</label><input id="demo-class-minutes" type="number" min="1" max="180" value={minutes} onChange={event => setMinutes(Math.max(1, Math.min(180, Number(event.target.value) || 1)))} /><p className="classroom-hint">악기: {instrument} · 화면을 새로고침하면 이 시연 설정은 초기화됩니다.</p><button className="classroom-primary" type="button" onClick={advanceDemo}><ClipboardCheck size={17} />진행 시연 한 단계</button><button className="classroom-text-button" type="button" onClick={resetDemo}><RotateCcw size={14} />시연 초기화</button></section></aside>
      <article className="classroom-card classroom-session-detail"><div className="classroom-section-title"><div><span className="classroom-eyebrow">CURRENT MOCK MISSION</span><h3>{title || '제목 없는 시연 미션'}</h3></div><span className="classroom-state">합성 시연</span></div><p className="classroom-detail-meta">{instrument} · 목표 {minutes}분 · 실계정 연결 없음</p><div className="classroom-mission"><span className="classroom-eyebrow">관찰 순서</span><h4>교재를 읽고, 체크리스트로 다음 동작을 정리해요.</h4><p>이 문구와 현황은 실제 학생의 제출·정확도·개인정보와 무관한 합성 화면입니다.</p><span className="classroom-time">목표 {minutes}분</span></div><div className="classroom-stats"><div><strong>{learners.length}<span>명</span></strong><p>합성 카드</p></div><div><strong>{completed}<span>명</span></strong><p>시연 완료</p></div><div><strong>{average}<span>%</span></strong><p>평균 진행</p></div></div><div className="classroom-section-title"><h3>익명 진행 카드 <span>실제 기록 없음</span></h3><ShieldCheck size={17} /></div><ul className="classroom-participants">{learners.map(learner => <li key={learner.label}><div className="classroom-participant-heading"><strong>{learner.label}</strong><span className={learner.progress === 100 ? 'done' : 'waiting'}>{learner.progress}% · {learner.progress === 100 ? '시연 완료' : '진행 중'}</span></div><p>{learner.note}</p><small>합성 승인 시연 데이터</small></li>)}</ul><p className="classroom-sync">서버 동기화와 자동 갱신을 사용하지 않습니다. 교사가 실제 수업에서 별도로 확인해야 합니다.</p></article>
    </div>
  </section>;
}

export default Classroom;
