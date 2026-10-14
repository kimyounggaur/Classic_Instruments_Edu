'use client';

import { useEffect, useRef, useState } from 'react';
import { Minus, Pause, Play, Plus } from 'lucide-react';

function playClick(context: AudioContext, index: number, beats: number) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.frequency.value = index % beats === 0 ? 1100 : 750;
  gain.gain.setValueAtTime(.12, context.currentTime);
  gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + .055);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + .06);
}

export default function Metronome() {
  const [bpm, setBpm] = useState(80);
  const [beats, setBeats] = useState(4);
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(-1);
  const [error, setError] = useState('');
  const audio = useRef<AudioContext | null>(null);
  const activeBeat = playing ? beat % beats : -1;

  useEffect(() => {
    if (!playing) return;
    let next = 1;
    const timer = window.setInterval(() => {
      const context = audio.current;
      if (context) playClick(context, next, beats);
      setBeat(next % beats);
      next += 1;
    }, 60000 / bpm);
    return () => window.clearInterval(timer);
  }, [playing, bpm, beats]);

  useEffect(() => () => { void audio.current?.close(); }, []);

  async function toggle() {
    if (playing) {
      setPlaying(false);
      return;
    }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      playClick(audio.current, 0, beats);
      setBeat(0);
      setPlaying(true);
      setError('');
    } catch {
      setError('이 브라우저에서는 소리를 시작할 수 없어요.');
    }
  }

  return <div className="metronome">
    <span className="eyebrow">KEEP YOUR TEMPO</span>
    <h2>오늘의 박자를 맞춰요</h2>
    <div className="tempo">
      <button className="icon-btn" aria-label="템포 낮추기" onClick={() => setBpm(value => Math.max(30, value - 1))}><Minus /></button>
      <strong>{bpm}<small>BPM</small></strong>
      <button className="icon-btn" aria-label="템포 높이기" onClick={() => setBpm(value => Math.min(240, value + 1))}><Plus /></button>
    </div>
    <input aria-label="메트로놈 템포" type="range" min="30" max="240" value={bpm} onChange={event => setBpm(Number(event.target.value))} />
    <div className="beat-dots">{Array.from({ length: beats }, (_, index) => <i className={index === activeBeat ? 'active' : ''} key={index} />)}</div>
    <label>한 마디 박 수 <select value={beats} onChange={event => setBeats(Number(event.target.value))}>{[2, 3, 4, 6].map(value => <option key={value} value={value}>{value}박</option>)}</select></label>
    <button className="primary" onClick={() => void toggle()}>{playing ? <Pause size={18} /> : <Play size={18} />} {playing ? '정지' : '연습 시작'}</button>
    <p className="muted">브라우저 출력만 사용하며 카메라·마이크·녹음은 사용하지 않습니다.</p>
    {error && <p role="alert" className="error">{error}</p>}
  </div>;
}
