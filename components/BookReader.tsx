"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { BookOpen, Bookmark, Check, ChevronLeft, ChevronRight, Columns2, ExternalLink, Hand, List, Maximize, Minus, Music2, Plus, ScanLine, Volume2, VolumeX, X } from "lucide-react";
import type { Instrument } from "@/lib/catalog";
import "./reader.css";

type Hotspot = { label: string; kind: "trainer" | "coach" | "video" | "metronome"; x: number; y: number; width?: number; height?: number };
type TextbookPage = { image?: string; text?: string; title?: string; hotspots?: Hotspot[] };
type Textbook = { title?: string; sourceUrl?: string; pages: TextbookPage[]; toc?: { title: string; page: number }[]; status?: string; width?: number; height?: number };
type TextbookMap = Record<string, Textbook>;

type FlipEngine = {
  loadFromHTML: (elements: HTMLElement[]) => void;
  on: (event: string, listener: (event: { data: unknown }) => void) => void;
  off: (event: string) => void;
  flip: (page: number, corner?: "top" | "bottom") => void;
  turnToPage: (page: number) => void;
  getCurrentPageIndex: () => number;
  getSettings: () => Record<string, number | string | boolean>;
  update: () => void;
  destroy: () => void;
};

/** StPageFlip owns every DOM node below hostRef; React never reconciles moved pages. */
function PhysicalBook({ pages, current, spread, zoom, aspect, title, onFlip, onLaunch, onFallback }: {
  pages: TextbookPage[]; current: number; spread: boolean; zoom: number; aspect: number; title: string;
  onFlip: (page: number) => void; onLaunch: Props["onLaunch"]; onFallback: () => void;
}) {
  const shellRef = useRef<HTMLDivElement>(null);
  const hostRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<FlipEngine | null>(null);
  const resizeRef = useRef<(() => void) | null>(null);
  const latest = useRef({ current, spread, onFlip, onLaunch, onFallback });
  useEffect(() => { latest.current = { current, spread, onFlip, onLaunch, onFallback }; }, [current, spread, onFlip, onLaunch, onFallback]);

  useEffect(() => {
    let disposed = false;
    let engine: FlipEngine | null = null;
    let observer: ResizeObserver | null = null;
    let animationFrame = 0;
    const holder = hostRef.current;
    const shell = shellRef.current;
    if (!holder || !shell) return;
    const host = document.createElement("div");
    host.className = "ld-physical-host";

    const setup = async () => {
      try {
        // The upstream 2.0.7 distribution has no declaration file; its public API is typed above.
        // @ts-expect-error page-flip publishes JavaScript without TypeScript declarations.
        const pageFlipModule = await import("page-flip/dist/js/page-flip.module.js");
        if (disposed) return;
        const elements = pages.map((page, index) => {
          const element = document.createElement("div");
          element.className = "ld-physical-page";
          element.setAttribute("aria-label", `${index + 1}쪽 · ${page.title || title}`);
          if (page.image) {
            const image = document.createElement("img");
            image.src = page.image;
            image.alt = page.title || `${title} ${index + 1}쪽`;
            image.loading = Math.abs(index - (latest.current.current - 1)) <= 2 ? "eager" : "lazy";
            image.decoding = "async";
            image.draggable = false;
            element.appendChild(image);
          } else {
            const heading = document.createElement("h3"); heading.textContent = page.title || `${index + 1}쪽`;
            const text = document.createElement("p"); text.textContent = page.text || "";
            element.classList.add("ld-physical-text-page"); element.appendChild(heading); element.appendChild(text);
          }
          for (const hotspot of page.hotspots || []) {
            const button = document.createElement("button");
            button.type = "button"; button.className = "ld-page-hotspot"; button.textContent = hotspot.label;
            button.style.left = `${hotspot.x}%`; button.style.top = `${hotspot.y}%`;
            if (hotspot.width) button.style.width = `${hotspot.width}%`;
            if (hotspot.height) button.style.height = `${hotspot.height}%`;
            button.onclick = (event) => { event.stopPropagation(); latest.current.onLaunch(hotspot.kind); };
            element.appendChild(button);
          }
          host.appendChild(element);
          return element;
        });
        holder.replaceChildren(host);
        const containerWidth = Math.max(200, Math.floor(shell.getBoundingClientRect().width));
        const pageWidth = containerWidth / (latest.current.spread ? 2 : 1);
        host.style.width = `${containerWidth}px`;
        host.style.height = `${Math.round(pageWidth / aspect)}px`;
        engine = new pageFlipModule.PageFlip(host, {
          width: pageWidth, height: Math.round(pageWidth / aspect), size: "fixed", startPage: latest.current.current - 1,
          usePortrait: true, autoSize: false, drawShadow: true, maxShadowOpacity: .28, flippingTime: 700,
          showCover: false, mobileScrollSupport: false, clickEventForward: true, useMouseEvents: true,
          showPageCorners: true, disableFlipByClick: true, swipeDistance: 45,
        }) as FlipEngine;
        engineRef.current = engine;
        engine.on("flip", (event) => {
          if (!disposed && typeof event.data === "number") latest.current.onFlip(event.data + 1);
        });
        engine.loadFromHTML(elements);
        const resize = () => {
          if (disposed || !engine) return;
          const width = Math.max(200, Math.floor(shell.getBoundingClientRect().width));
          const pageWidth = width / (latest.current.spread ? 2 : 1);
          const height = Math.round(pageWidth / aspect);
          const settings = engine.getSettings();
          Object.assign(settings, { width: pageWidth, height, minWidth: pageWidth, maxWidth: pageWidth, minHeight: height, maxHeight: height });
          host.style.width = `${width}px`; host.style.height = `${height}px`;
          host.style.minWidth = `${pageWidth}px`; host.style.minHeight = `${height}px`;
          engine.update();
        };
        resizeRef.current = resize;
        observer = new ResizeObserver(() => { cancelAnimationFrame(animationFrame); animationFrame = requestAnimationFrame(resize); });
        observer.observe(shell);
      } catch {
        if (!disposed) latest.current.onFallback();
      }
    };
    void setup();
    return () => {
      disposed = true; observer?.disconnect(); cancelAnimationFrame(animationFrame); resizeRef.current = null;
      if (engine) { engine.off("flip"); try { engine.destroy(); } catch { host.remove(); } }
      engineRef.current = null; host.remove();
    };
  }, [pages, aspect, title]);

  useEffect(() => { resizeRef.current?.(); }, [spread]);
  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const target = current - 1;
    const visible = engine.getCurrentPageIndex();
    if (visible === target || (spread && visible + 1 === target)) return;
    try { engine.flip(target, "bottom"); } catch { engine.turnToPage(target); }
  }, [current, spread]);

  return <div className="ld-physical-shell" ref={shellRef} style={{ width: `${zoom}%`, maxWidth: `${(spread ? 1180 : 720) * zoom / 100}px` }}><div ref={hostRef} aria-label={`${title} 책장 넘김 · 페이지 모서리를 드래그하거나 아래 이동 버튼을 이용하세요`} /></div>;
}

type Props = {
  instrument: Instrument;
  page: number;
  onPageChange: (n: number) => void;
  onLaunch: (kind: "trainer" | "coach" | "video" | "metronome") => void;
  onComplete: () => void;
  bookmarks?: number[];
  onBookmarksChange?: (pages: number[]) => void;
};

export default function BookReader({ instrument, page, onPageChange, onLaunch, onComplete, bookmarks: controlledBookmarks, onBookmarksChange }: Props) {
  const [catalog, setCatalog] = useState<TextbookMap>({});
  const [loading, setLoading] = useState(true);
  const [spread, setSpread] = useState(false);
  const [physical, setPhysical] = useState(true);
  const [compact, setCompact] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [showToc, setShowToc] = useState(false);
  const [sessionBookmarks, setSessionBookmarks] = useState<Record<string, number[]>>({});
  const [sound, setSound] = useState(false);
  const [flip, setFlip] = useState<"next" | "prev" | "">("");
  const [jumpDraft, setJumpDraft] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const startX = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const flipTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const book = catalog[instrument.id];
  const pages = book?.pages || [];
  const count = pages.length;
  const current = Math.max(1, Math.min(page || 1, Math.max(count, 1)));
  const jump = jumpDraft ?? String(current);
  const sourceUrl = book?.sourceUrl || instrument.sourceUrl;
  const spreadActive = spread && !compact;
  const bookmarks = controlledBookmarks ?? sessionBookmarks[instrument.id] ?? [];

  useEffect(() => {
    const controller = new AbortController();
    fetch("/data/textbooks.json", { signal: controller.signal })
      .then((r) => r.ok ? r.json() : {})
      .then((data) => { const imported = data as TextbookMap & { textbooks?: TextbookMap }; setCatalog(imported.textbooks || imported); })
      .catch(() => undefined)
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = window.matchMedia("(max-width: 620px)");
    const update = () => setCompact(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  useEffect(() => () => { if (flipTimer.current) clearTimeout(flipTimer.current); }, []);

  const playPageSound = useCallback(() => {
    if (!sound) return;
    try {
      const context = new AudioContext();
      const buffer = context.createBuffer(1, context.sampleRate * 0.11, context.sampleRate);
      const samples = buffer.getChannelData(0);
      for (let i = 0; i < samples.length; i++) samples[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / samples.length, 2);
      const source = context.createBufferSource();
      const filter = context.createBiquadFilter();
      const gain = context.createGain();
      source.buffer = buffer;
      filter.type = "bandpass";
      filter.frequency.value = 1300;
      gain.gain.value = 0.075;
      source.connect(filter).connect(gain).connect(context.destination);
      source.onended = () => { void context.close(); };
      source.start();
    } catch { /* Audio is optional in restrictive browsers. */ }
  }, [sound]);

  const go = useCallback((next: number) => {
    if (!count) return;
    const target = Math.max(1, Math.min(count, next));
    if (target === current) return;
    setFlip(target > current ? "next" : "prev");
    if (flipTimer.current) clearTimeout(flipTimer.current);
    flipTimer.current = setTimeout(() => setFlip(""), 380);
    playPageSound();
    onPageChange(target);
    setStatus(`${target}쪽으로 이동했습니다.`);
  }, [count, current, onPageChange, playPageSound]);

  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (/INPUT|TEXTAREA|SELECT|VIDEO/.test(target.tagName) || target.isContentEditable || target.closest('[role="dialog"]') || event.ctrlKey || event.metaKey || event.altKey) return;
      if (event.key === "ArrowRight") { event.preventDefault(); go(current + (spreadActive ? 2 : 1)); }
      if (event.key === "ArrowLeft") { event.preventDefault(); go(current - (spreadActive ? 2 : 1)); }
      if (event.key === "Escape") setShowToc(false);
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [current, spreadActive, go]);

  const toggleBookmark = () => {
    const next = bookmarks.includes(current) ? bookmarks.filter((n) => n !== current) : [...bookmarks, current].sort((a, b) => a - b);
    setSessionBookmarks((saved) => ({ ...saved, [instrument.id]: next }));
    onBookmarksChange?.(next);
    setStatus(next.includes(current) ? `${current}쪽 책갈피를 저장했습니다.` : "책갈피를 해제했습니다.");
  };

  const fullscreen = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await containerRef.current?.requestFullscreen();
    } catch { setStatus("이 브라우저에서는 전체 화면을 지원하지 않습니다."); }
  };

  const toc = book?.toc?.length ? book.toc : pages.map((p, index) => ({ title: p.title || `${index + 1}쪽`, page: index + 1 }));
  const renderPage = (number: number) => {
    const content = pages[number - 1];
    if (!content) return null;
    return <article className={`ld-paper ${content.image ? "ld-paper-image" : ""}`} key={`${instrument.id}-${number}`} aria-label={`${number}쪽`}>
      {content.image ? <img src={content.image} alt={content.title || `${instrument.name} 교재 ${number}쪽`} loading="eager" /> : <>
        <div className="ld-paper-eyebrow"><span>{instrument.name} 입문 교재</span><span>LESSON DESIGNER</span></div>
        {content.title && <h2>{content.title}</h2>}
        <div className="ld-paper-text">{content.text}</div>
        <footer><span>전문가 검수 전 · 선생님과 함께 확인해요</span><span>{number}</span></footer>
      </>}
      {content.hotspots?.map((hotspot, index) => <button key={index} className="ld-page-hotspot" style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%`, width: hotspot.width ? `${hotspot.width}%` : undefined, height: hotspot.height ? `${hotspot.height}%` : undefined }} onClick={() => onLaunch(hotspot.kind)} aria-label={hotspot.label} title={hotspot.label}><Plus size={14} /><span>{hotspot.label}</span></button>)}
    </article>;
  };

  return <section className="ld-reader" ref={containerRef} aria-label={`${instrument.name} 전자교재 뷰어`}>
    <div className="ld-reader-toolbar">
      <div className="ld-reader-toolbar-group">
        <button className={`ld-tool ${showToc ? "is-active" : ""}`} onClick={() => setShowToc(!showToc)} aria-expanded={showToc} title="목차"><List size={17} /><span>목차</span></button>
        <span className="ld-toolbar-divider" />
        <button className={`ld-tool ${!spreadActive ? "is-active" : ""}`} onClick={() => setSpread(false)} title="단면 보기"><BookOpen size={17} /><span>단면</span></button>
        <button className={`ld-tool ${spreadActive ? "is-active" : ""}`} disabled={compact} onClick={() => setSpread(true)} title={compact ? "좁은 화면에서는 단면으로 표시됩니다" : "양면 보기"}><Columns2 size={17} /><span>양면</span></button>
      </div>
      <div className="ld-reader-toolbar-group">
        <button className="ld-tool ld-icon-tool" aria-label="축소" disabled={zoom <= 70} onClick={() => setZoom((z) => Math.max(70, z - 10))}><Minus size={16} /></button>
        <button className="ld-zoom-label" title="기본 크기로" onClick={() => setZoom(100)}>{zoom}%</button>
        <button className="ld-tool ld-icon-tool" aria-label="확대" disabled={zoom >= 180} onClick={() => setZoom((z) => Math.min(180, z + 10))}><Plus size={16} /></button>
        <span className="ld-toolbar-divider" />
        <button className={`ld-tool ld-icon-tool ${bookmarks.includes(current) ? "is-active" : ""}`} disabled={!count} aria-label={bookmarks.includes(current) ? "책갈피 해제" : "책갈피 저장"} aria-pressed={bookmarks.includes(current)} onClick={toggleBookmark}><Bookmark size={17} fill={bookmarks.includes(current) ? "currentColor" : "none"} /></button>
        <button className="ld-tool ld-icon-tool ld-reader-sound" aria-label={sound ? "책장 효과음 끄기" : "책장 효과음 켜기"} aria-pressed={sound} onClick={() => setSound(!sound)}>{sound ? <Volume2 size={17} /> : <VolumeX size={17} />}</button>
        <button className="ld-tool ld-icon-tool" aria-label="전체 화면" onClick={fullscreen}><Maximize size={17} /></button>
      </div>
    </div>

    <div className="ld-reader-body">
      {showToc && <aside className="ld-toc" aria-label="교재 목차">
        <div className="ld-toc-heading"><h3>교재 목차</h3><button className="ld-tool ld-icon-tool" aria-label="목차 닫기" onClick={() => setShowToc(false)}><X size={16} /></button></div>
        <p>{instrument.name} · {count ? `${count}쪽` : "원본 교재"}</p>
        {bookmarks.length > 0 && <div className="ld-bookmark-list"><h4><Bookmark size={13} /> 내 책갈피</h4>{bookmarks.filter((n) => n <= count).map((n) => <button key={n} onClick={() => go(n)}>{n}쪽</button>)}</div>}
        <nav>{toc.length ? toc.map((entry, i) => <button key={`${entry.page}-${i}`} className={current === entry.page ? "is-active" : ""} onClick={() => { go(entry.page); setShowToc(false); }}><span>{entry.title}</span><small>{entry.page}</small></button>) : <p className="ld-toc-empty">교재를 불러오면 페이지 목차가 표시됩니다.</p>}</nav>
      </aside>}

      <div className="ld-reading-stage" onPointerDown={(e) => { if (physical || (e.target as HTMLElement).closest("button,a,input")) return; startX.current = e.clientX; }} onPointerUp={(e) => { if (!physical && startX.current !== null && Math.abs(e.clientX - startX.current) > 65) go(current + (e.clientX < startX.current ? 1 : -1) * (spreadActive ? 2 : 1)); startX.current = null; }} onPointerCancel={() => { startX.current = null; }}>
        <div className="ld-reader-page-caption"><span className="ld-small-dot" /> {instrument.name} 통합교재 <span className="ld-draft-label">검수 전 초안</span>{count > 0 && <button className="ld-reader-mode-toggle" onClick={() => setPhysical(!physical)}>{physical ? "기본 보기" : "책장 넘김"}</button>}</div>
        {loading ? <div className="ld-reader-empty"><BookOpen size={34} /><h3>교재를 불러오고 있어요</h3><p>읽던 페이지를 준비하고 있습니다.</p></div> : count ? <>
          {physical ? <PhysicalBook pages={pages} current={current} spread={spreadActive} zoom={zoom} aspect={book?.width && book?.height ? book.width / book.height : 210 / 297} title={`${instrument.name} 교재`} onFlip={(next) => { if (next !== current) { onPageChange(next); playPageSound(); setStatus(`${next}쪽으로 이동했습니다.`); } }} onLaunch={onLaunch} onFallback={() => { setPhysical(false); setStatus("기본 보기로 교재를 열었습니다."); }} /> : <div className={`ld-page-spread ${spreadActive ? "is-spread" : ""} ${flip ? `ld-flip-${flip}` : ""}`} style={{ width: `${zoom}%`, maxWidth: spreadActive ? `${1180 * zoom / 100}px` : `${720 * zoom / 100}px` }}>{renderPage(current)}{spreadActive && renderPage(current + 1)}</div>}
          {physical && <p className="ld-flip-hint">페이지 모서리를 잡아 넘겨보세요 · 방향키로도 이동할 수 있어요</p>}
          <div className="ld-page-practice" aria-label="이 페이지와 함께 연습하기">
            <span><Hand size={14} /> 읽고 바로 연습</span>
            <button onClick={() => onLaunch("trainer")}><Music2 size={14} /> 운지 연습</button>
            <button onClick={() => onLaunch("video")}><ScanLine size={14} /> 시범 영상</button>
            <button onClick={() => onLaunch("metronome")}><Volume2 size={14} /> 메트로놈</button>
          </div>
        </> : <div className="ld-reader-empty">
          <div className="ld-reader-empty-icon"><BookOpen size={36} strokeWidth={1.3} /></div>
          <span className="ld-eyebrow">YOUR NEXT CHAPTER</span>
          <h3>{instrument.name} 교재를 만나보세요</h3>
          <p>연결된 원본 교재에서 학습을 시작할 수 있어요.<br />페이지 변환본이 등록되면 이곳에서 바로 펼쳐볼 수 있습니다.</p>
          <a className="ld-primary-button" href={sourceUrl} target="_blank" rel="noreferrer">원본 교재 열기 <ExternalLink size={16} /></a>
          <div className="ld-empty-actions"><button onClick={() => onLaunch("trainer")}><Music2 size={16} /> 운지 트레이너</button><button onClick={() => onLaunch("video")}><ScanLine size={16} /> 영상 학습관</button></div>
          <small>전문 교사 검수 전 · 체형과 악기 크기에 맞춰 선생님과 조정해요.</small>
        </div>}
      </div>
    </div>

    <div className="ld-reader-bottom">
      <a className="ld-original-link" href={sourceUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /><span>원본 보기</span></a>
      <div className="ld-page-navigation">
        <button className="ld-tool ld-icon-tool" aria-label="이전 페이지" disabled={current <= 1 || !count} onClick={() => go(current - (spreadActive ? 2 : 1))}><ChevronLeft size={20} /></button>
        <form onSubmit={(e) => { e.preventDefault(); const n = Number(jump); if (Number.isFinite(n)) go(Math.round(n)); setJumpDraft(null); }}>
          <input aria-label="이동할 페이지" type="number" min="1" max={count || 1} value={jump} disabled={!count} onChange={(e) => setJumpDraft(e.target.value)} /><span> / {count || "—"}</span>
        </form>
        <button className="ld-tool ld-icon-tool" aria-label="다음 페이지" disabled={!count || current >= count} onClick={() => go(current + (spreadActive ? 2 : 1))}><ChevronRight size={20} /></button>
      </div>
      <button className="ld-complete-button" disabled={!count} onClick={() => { onComplete(); setStatus("학습 완료를 기록했습니다."); }}><Check size={14} /><span>학습 완료</span></button>
    </div>
    <p className="ld-sr-only" role="status">{status}</p>
  </section>;
}
