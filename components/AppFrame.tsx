'use client';

import { useState } from 'react';
import { Link2, LockKeyhole, RefreshCw, ShieldCheck } from 'lucide-react';
import type { WebApp } from '@/lib/catalog';

function kindLabel(type: WebApp['appType']) {
  if (type === 'coach') return '자세 관찰 시연';
  if (type === 'trainer') return '운지·연주 시연';
  if (type === 'studio') return '창작 흐름 시연';
  return '공통 도구 시연';
}

/** Displays registry context without mounting or requesting the third-party app. */
export default function AppFrame({ app, instrument, page }: { app: WebApp; instrument: string; page: number }) {
  const [run, setRun] = useState(0);
  const host = new URL(app.url).hostname;

  return <section className="app-frame" aria-label={`${app.name} 합성 연결 시연`}>
    <div className="frame-head">
      <div><span className="eyebrow">MOCK CONNECTOR</span><h3>{app.name}</h3></div>
      <button className="icon-btn" type="button" aria-label="합성 시연 다시 시작" onClick={() => setRun(value => value + 1)}><RefreshCw size={17} /></button>
    </div>
    <div className="frame-status"><Link2 size={13} /> 카탈로그 연결 정보 · 외부 앱은 이 화면에서 실행하지 않음</div>
    <div className="mock-app-stage" key={run}>
      <div className="mock-app-badge"><ShieldCheck size={15} /> 합성 승인 시연</div>
      <h4>{kindLabel(app.appType)}</h4>
      <p><strong>{instrument}</strong> · 교재 {page}쪽 맥락을 사용한 화면 흐름 시연입니다.</p>
      <div className="mock-app-steps" aria-label="합성 시연 단계">
        <span>01 교재 맥락</span><span>02 연습 안내</span><span>03 직접 확인</span>
      </div>
      <div className="mock-app-check"><LockKeyhole size={17} /><p>카메라·마이크·실계정·학생정보·외부 AI를 사용하거나 전송하지 않습니다.</p></div>
    </div>
    <div className="frame-help"><strong>등록 원본:</strong> <code>{host}</code> · 주소는 카탈로그 확인용 메타데이터이며 자동 요청하지 않습니다.</div>
  </section>;
}
