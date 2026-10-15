"use client";

import { useEffect, useSyncExternalStore, type RefObject } from "react";
import { Pause, Play } from "lucide-react";

const preferenceKey = "lesson-designer-library:motion:v1";
const preferenceEvent = "classical-library-motion-change";
const mediaQuery = "(prefers-reduced-motion: reduce)";
// Browser-session fallback for restricted or full storage; never set during SSR.
let sessionPreference: "on" | "off" | null = null;

function readPreference() {
  if (window.matchMedia(mediaQuery).matches) return "system-reduced";
  if (sessionPreference) return sessionPreference;
  try {
    return window.localStorage.getItem(preferenceKey) === "off" ? "off" : "on";
  } catch {
    return "on";
  }
}

function subscribePreference(notify: () => void) {
  const media = window.matchMedia(mediaQuery);
  const onStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === null) {
      sessionPreference = null;
      notify();
    }
  };
  media.addEventListener("change", notify);
  window.addEventListener("storage", onStorage);
  window.addEventListener(preferenceEvent, notify);
  return () => {
    media.removeEventListener("change", notify);
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(preferenceEvent, notify);
  };
}

export function useClassicalMotion() {
  const preference = useSyncExternalStore(
    subscribePreference,
    readPreference,
    () => "off",
  );
  return { enabled: preference === "on", systemReduced: preference === "system-reduced" };
}

export function MotionToggle({
  enabled,
  systemReduced,
}: {
  enabled: boolean;
  systemReduced: boolean;
}) {
  return (
    <button
      className="motion-toggle"
      type="button"
      aria-label={systemReduced ? "기기 설정에 따라 애니메이션 꺼짐" : "애니메이션"}
      aria-pressed={enabled}
      disabled={systemReduced}
      title={systemReduced ? "기기의 동작 줄이기 설정을 따르고 있습니다." : "장식과 전환 애니메이션을 켜거나 끕니다."}
      onClick={() => {
        const next = enabled ? "off" : "on";
        sessionPreference = next;
        try {
          window.localStorage.setItem(preferenceKey, next);
        } catch {
          // The in-memory preference still keeps the pause control usable.
        }
        window.dispatchEvent(new Event(preferenceEvent));
      }}
    >
      {enabled ? <Pause size={14} /> : <Play size={14} />}
      <span>{enabled ? "움직임 켜짐" : "움직임 꺼짐"}</span>
    </button>
  );
}

/** Enhance visible content progressively; unsupported observers leave it readable. */
export function useClassicalReveal(
  root: RefObject<HTMLDivElement | null>,
  location: string,
  ready: boolean,
  enabled: boolean,
) {
  useEffect(() => {
    const surface = root.current;
    if (!surface || !ready) return;
    const targets = Array.from(surface.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!enabled || !("IntersectionObserver" in window)) {
      targets.forEach((target) => {
        target.classList.remove("reveal-ready");
        target.classList.add("is-revealed");
      });
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        entry.target.classList.add("is-revealed");
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.06, rootMargin: "0px 0px 36px 0px" });
    for (const target of targets) {
      if (target.classList.contains("is-revealed")) continue;
      target.classList.add("reveal-ready");
      observer.observe(target);
    }
    const onFocus = (event: FocusEvent) => {
      if (event.target instanceof Element)
        event.target.closest("[data-reveal]")?.classList.add("is-revealed");
    };
    surface.addEventListener("focusin", onFocus);
    return () => {
      observer.disconnect();
      surface.removeEventListener("focusin", onFocus);
      targets.forEach((target) => target.classList.remove("reveal-ready"));
    };
  }, [root, location, ready, enabled]);
}

export function MusicPageBackground() {
  return (
    <div className="music-page-background" aria-hidden="true">
      <svg viewBox="0 0 1200 1000" fill="none" preserveAspectRatio="xMidYMin slice">
        <g stroke="currentColor" strokeWidth="1">
          {[0, 1, 2, 3, 4].map((line) => (
            <path key={line} d={`M620 ${92 + line * 17}C830 ${40 + line * 17} 1000 ${220 + line * 17} 1270 ${125 + line * 17}`} />
          ))}
          {[0, 1, 2, 3, 4].map((line) => (
            <path key={line} d={`M-160 ${650 + line * 17}C80 ${545 + line * 17} 220 ${850 + line * 17} 460 ${735 + line * 17}`} />
          ))}
          <path d="M885 152v-51m0 0q26 15 24 34M1057 177v-50h39v56M130 709v-48m0 0q25 15 23 32M265 765v-46" />
        </g>
        <g fill="currentColor">
          <ellipse cx="877" cy="153" rx="10" ry="7" transform="rotate(-25 877 153)" />
          <ellipse cx="1049" cy="180" rx="10" ry="7" transform="rotate(-25 1049 180)" />
          <ellipse cx="1088" cy="185" rx="10" ry="7" transform="rotate(-25 1088 185)" />
          <ellipse cx="122" cy="711" rx="10" ry="7" transform="rotate(-25 122 711)" />
          <ellipse cx="257" cy="767" rx="10" ry="7" transform="rotate(-25 257 767)" />
        </g>
      </svg>
    </div>
  );
}
