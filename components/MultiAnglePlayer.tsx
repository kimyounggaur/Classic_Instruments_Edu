'use client';

import { useEffect, useState } from 'react';
import { CheckCircle2, FlipHorizontal2, Pause, Play, Repeat2, ShieldCheck, Video, Volume2, VolumeX, X } from 'lucide-react';
import type { Instrument } from '@/lib/catalog';
import InstrumentArt from './InstrumentArt';
import './reader.css';

type Angle = 'front' | 'side' | 'pov';
const angles: { id: Angle; name: string; subtitle: string }[] = [
  { id: 'front', name: '정면', subtitle: '전체 균형' },
  { id: 'side', name: '측면', subtitle: '움직임 관찰' },
  { id: 'pov', name: '1인칭', subtitle: '손의 순서' },
];
const topics = ['연주자세', '연주방법', '운지자세', '운지방법'];
const duration = 42;
const timeLabel = (time: number) => `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, '0')}`;

/** Synthetic, approved-for-demo view. It contains no media stream or third-party video request. */
export default function MultiAnglePlayer({ instrument }: { instrument: Instrument }) {
  const [topic, setTopic] = useState(topics[0]);
  const [angle, setAngle] = useState<Angle>('front');
  const [mirror, setMirror] = useState(false);
  const [muted, setMuted] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [playing, setPlaying] = useState(false);
  const [compare, setCompare] = useState(false);
  const [now, setNow] = useState(0);
  const [loopA, setLoopA] = useState<number | null>(null);
  const [loopB, setLoopB] = useState<number | null>(null);
  const [loopOn, setLoopOn] = useState(false);

  useEffect(() => {
    if (!playing) return;
    const timer = window.setInterval(() => {
      setNow(previous => {
        const next = previous + speed;
        if (loopOn && loopA !== null && loopB !== null && next >= loopB) return loopA;
        return next >= duration ? 0 : next;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [playing, speed, loopA, loopB, loopOn]);

  const setTopicAndReset = (next: string) => {
    setTopic(next);
    setAngle('front');
    setNow(0);
    setLoopA(null);
    setLoopB(null);
    setLoopOn(false);
  };

  return <section className="ld-video-learning" aria-label={`${instrument.name} 합성 멀티앵글 시연`}>
    <header className="ld-video-header"><div><span className="ld-eyebrow">SYNTHETIC DEMO · NO DEVICE ACCESS</span><h2>다른 시선으로, 안전하게 관찰하기</h2><p>실연 영상이나 개인 카메라 대신, 합성 승인 시연으로 수업 흐름을 검토합니다.</p></div><span className="ld-outline-button"><ShieldCheck size={16} />합성 승인 시연</span></header>
    <div className="ld-synthetic-notice"><CheckCircle2 size={17} /><p>이 화면은 전문가 실연·감수 완료를 뜻하지 않습니다. 카메라·마이크·녹화·외부 영상·외부 AI를 사용하지 않습니다.</p></div>
    <div className="ld-video-workspace">
      <aside className="ld-video-library"><h3>{instrument.name} 장면 <span>{topics.length}</span></h3>{topics.map((item, index) => <div key={item} className="ld-video-topic"><div className="ld-video-topic-heading"><span>0{index + 1}</span><h4>{item}</h4></div><button type="button" className={topic === item ? 'is-active' : ''} onClick={() => setTopicAndReset(item)}><Video size={15} /><span>{item} 합성 장면</span></button></div>)}<div className="ld-camera-note"><ShieldCheck size={17} /><p>개인 기기 화면을 열지 않는 관찰용 시연입니다.</p></div></aside>
      <div className="ld-video-main"><div className="ld-angle-tabs" role="group" aria-label="합성 장면 시점">{angles.map(item => <button type="button" key={item.id} className={angle === item.id ? 'is-active' : ''} onClick={() => setAngle(item.id)}><span>{item.name}</span><small>{item.subtitle}</small></button>)}</div>
        <div className={`ld-video-frames ${compare ? 'with-camera' : ''}`}>
          <SyntheticFrame instrument={instrument} angle={angle} topic={topic} mirror={mirror} now={now} />
          {compare && <div className="ld-video-frame ld-synthetic-check-frame"><div><span className="ld-frame-label">나란히 관찰 · 개인 화면 없음</span><CheckCircle2 size={35} /><h3>관찰 체크리스트</h3><p>어깨·손목·호흡의 편안함을 교사와 직접 확인하는 합성 패널입니다.</p><ul><li>불편하면 멈추기</li><li>한 번에 한 항목 확인</li><li>실제 자세는 대면 지도</li></ul></div></div>}
        </div>
        <div className="ld-selected-video-title"><span>{topic}</span><h3>{instrument.name} · {angles.find(item => item.id === angle)?.name} 합성 장면</h3><small>{timeLabel(now)} / {timeLabel(duration)}</small></div>
        <div className="ld-video-controls"><div className="ld-speed-controls"><span>시연 속도</span>{[.5, .75, 1].map(rate => <button type="button" key={rate} className={speed === rate ? 'is-active' : ''} onClick={() => setSpeed(rate)}>{rate}×</button>)}</div><div className="ld-video-control-actions"><button type="button" aria-pressed={mirror} className={mirror ? 'is-active' : ''} onClick={() => setMirror(value => !value)}><FlipHorizontal2 size={16} />거울</button><button type="button" aria-pressed={muted} className={muted ? 'is-active' : ''} onClick={() => setMuted(value => !value)}>{muted ? <VolumeX size={16} /> : <Volume2 size={16} />}무음 표시</button><button type="button" aria-pressed={compare} className={compare ? 'is-active' : ''} onClick={() => setCompare(value => !value)}><ShieldCheck size={16} />나란히 관찰</button><button type="button" className={playing ? 'is-active' : ''} onClick={() => setPlaying(value => !value)}>{playing ? <Pause size={16} /> : <Play size={16} />}{playing ? '정지' : '시연 시작'}</button></div></div>
        <div className="ld-loop-controls"><div><Repeat2 size={16} /><span>합성 구간 반복</span></div><button type="button" onClick={() => { setLoopA(now); setLoopB(null); setLoopOn(false); }}>A 시작 <strong>{loopA !== null ? timeLabel(loopA) : '—'}</strong></button><button type="button" disabled={loopA === null || now <= (loopA ?? 0) + 1} onClick={() => { setLoopB(now); setLoopOn(true); }}>B 끝 <strong>{loopB !== null ? timeLabel(loopB) : '—'}</strong></button><button type="button" className={loopOn ? 'is-active' : ''} disabled={loopA === null || loopB === null} aria-pressed={loopOn} onClick={() => setLoopOn(value => !value)}>{loopOn ? '반복 중' : '반복 켜기'}</button>{loopA !== null && <button type="button" className="ld-loop-reset" aria-label="반복 구간 초기화" onClick={() => { setLoopA(null); setLoopB(null); setLoopOn(false); }}><X size={14} /></button>}</div>
        <div className="ld-video-tip"><span>DEMO NOTE</span><p>{angle === 'pov' ? '연주자 시점은 손의 순서를 이해하기 위한 합성 표기입니다.' : angle === 'side' ? '측면 장면은 관절 각도를 확정하지 않는 관찰용 표기입니다.' : '정면 장면은 전체 균형을 살피기 위한 합성 표기입니다.'}</p></div>
      </div>
    </div>
  </section>;
}

function SyntheticFrame({ instrument, angle, topic, mirror, now }: { instrument: Instrument; angle: Angle; topic: string; mirror: boolean; now: number }) {
  return <div className="ld-video-frame ld-synthetic-frame"><div className="ld-synthetic-stage" style={{ transform: mirror ? 'scaleX(-1)' : undefined }}><InstrumentArt id={instrument.id} /><div className="ld-synthetic-beat" style={{ width: `${Math.max(8, (now / duration) * 100)}%` }} /></div><span className="ld-frame-label">합성 승인 시연 · {angle} · {topic}</span><span className="ld-synthetic-caption">직접 촬영 영상 아님</span></div>;
}
