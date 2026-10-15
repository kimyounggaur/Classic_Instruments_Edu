"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type FormEvent,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookMarked,
  BookOpen,
  Bookmark,
  Check,
  ChevronRight,
  Clock,
  ExternalLink,
  FolderOpen,
  Grid2X2,
  Library,
  List,
  Menu,
  Music2,
  NotebookPen,
  Search,
  ShieldCheck,
  SlidersHorizontal,
  X,
  ZoomIn,
  ZoomOut,
} from "lucide-react";
import {
  repository,
  instrumentLabels,
  INSTRUMENTS,
  parseSearchQuery,
  serializeSearchQuery,
  searchResources,
  canOpenAsset,
  canPrint,
  canOpenApp,
  type Instrument,
  type Resource,
  type ResourceVersion,
  type Unit,
  type AppLink,
  type RepositoryState,
  type PrototypeRepository,
  type SearchQuery,
} from "@/lib/prototype";
import { AdminView, TeacherPlansView } from "./WorkspaceViews";

type Run = (
  operation: (repo: PrototypeRepository) => Promise<unknown>,
  success?: string,
) => Promise<unknown>;
const palette: Record<
  Instrument,
  { color: string; light: string; en: string; label: string }
> = {
  violin: { color: "#9e4c34", light: "#f3ddd0", en: "VIOLIN", label: "현악기" },
  cello: { color: "#3d6460", light: "#dce7de", en: "CELLO", label: "현악기" },
  flute: { color: "#625b82", light: "#e5e1ed", en: "FLUTE", label: "목관악기" },
  clarinet: {
    color: "#865a19",
    light: "#f0e5ca",
    en: "CLARINET",
    label: "목관악기",
  },
};
const kindLabels: Record<string, string> = {
  textbook: "교재",
  score: "악보",
  diagram: "도식",
  activity: "활동자료",
  lesson_plan: "수업안",
};
const nav = [
  { path: "/", label: "나의 책장", icon: Library },
  { path: "/library", label: "모든 자료", icon: FolderOpen },
  { path: "/practice", label: "악기 연습실", icon: Music2 },
  { path: "/bookmarks", label: "북마크 · 이어보기", icon: Bookmark },
  { path: "/teacher/plans", label: "나의 수업안", icon: NotebookPen },
  { path: "/admin/resources", label: "자료 · 검수 관리", icon: ShieldCheck },
];

function InstrumentDrawing({ instrument }: { instrument: Instrument }) {
  return (
    <svg viewBox="0 0 160 190" fill="none" aria-hidden="true">
      <g
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {instrument === "violin" || instrument === "cello" ? (
          <>
            <path d="M77 19h7l1 68c21-10 35 4 27 20-9 8-9 13 2 21 17 30-1 49-33 49s-50-19-33-49c11-8 11-13 2-21-8-16 6-30 27-20z" />
            <path d="M77 18l-3-8 13 1-3 9M76 25h10M75 32h12M79 45v116M83 45v116M72 129h19M69 143q-11-13-7-22m34 0q4 9-4 18M78 164h7l-3 12M120 31l8 139M124 31l8 139" />
            {instrument === "cello" && <path d="M81 177v11" />}
          </>
        ) : instrument === "flute" ? (
          <>
            <path d="M36 154L118 27l7 5-82 127zM112 36l8 5M104 47l8 5M39 149l8 5M117 28l5-9 8 5-5 9" />
            {[0, 1, 2, 3, 4, 5, 6].map((n) => (
              <g
                key={n}
                transform={`translate(${55 + n * 8},${131 - n * 12}) rotate(-57)`}
              >
                <circle r="5" />
                <path d="M0-5v-6h7" />
              </g>
            ))}
            <path d="M30 165l12-5M44 149l-7-4" />
          </>
        ) : (
          <>
            <path d="M77 18h10l-2 21 4 104 11 24q-17 9-35 0l11-24 3-104zM78 42h8M77 54h10M76 138h14M70 156h24M74 20l4-11h10l-1 11M76 63h15v12H76" />
            {[0, 1, 2, 3, 4].map((n) => (
              <g key={n}>
                <circle cx="82" cy={84 + n * 11} r="3.5" />
                <path d={`M88 ${84 + n * 11}h9v-7`} />
              </g>
            ))}
          </>
        )}
      </g>
    </svg>
  );
}

export default function PrototypeApp() {
  const router = useRouter(),
    path = usePathname(),
    params = useSearchParams();
  const [store, setStore] = useState(() => repository.snapshot()),
    [notice, setNotice] = useState(""),
    [menu, setMenu] = useState(false),
    [role, setRole] = useState("teacher");
  const [planTarget, setPlanTarget] = useState<{
    resource: Resource;
    version: ResourceVersion;
    unit: Unit;
  } | null>(null);
  const location = `${path}${params.size ? "?" + params.toString() : ""}`;
  const notify = useCallback((message: string) => setNotice(message), []);
  useEffect(() => {
    const off = repository.subscribe(() => setStore(repository.snapshot()));
    void repository.initialize().catch((e: Error) => setNotice(e.message));
    return off;
  }, []);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 6500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    if (!menu) return;
    const previous = document.activeElement as HTMLElement;
    const sidebar = document.querySelector<HTMLElement>(".proto-sidebar");
    sidebar?.querySelector<HTMLButtonElement>(".mobile-close")?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setMenu(false);
      }
      if (event.key === "Tab" && sidebar) {
        const focusable = Array.from(
          sidebar.querySelectorAll<HTMLElement>(
            "a[href],button:not(:disabled)",
          ),
        ).filter((el) => el.getClientRects().length);
        const first = focusable[0],
          last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus();
    };
  }, [menu]);
  useEffect(() => {
    if ("serviceWorker" in navigator)
      void navigator.serviceWorker
        .getRegistrations()
        .then(async (registrations) => {
          for (const registration of registrations) {
            if (registration.active?.scriptURL.endsWith("/sw.js"))
              await registration.unregister();
          }
          if ("caches" in window) await caches.delete("lesson-textbooks-v1");
        })
        .catch(() => {});
  }, []);
  const navigate = useCallback(
    (to: string) => {
      if (
        !window.dispatchEvent(
          new Event("lesson-designer-before-navigate", { cancelable: true }),
        )
      )
        return;
      setMenu(false);
      router.push(to);
    },
    [router],
  );
  const run: Run = useCallback(async (operation, success) => {
    try {
      const result = await operation(repository);
      if (success) setNotice(success);
      return result;
    } catch (error) {
      setNotice(
        error instanceof Error
          ? error.message
          : "저장하지 못했습니다. 다시 시도해 주세요.",
      );
      return undefined;
    }
  }, []);
  const query = parseSearchQuery(params.toString());
  const audience = params.get("scope") === "real" ? "public" : "demo";
  const available = store.resources.filter((resource) => {
    if (audience === "public" && resource.datasetKind !== "reviewed_real")
      return false;
    if (
      audience === "demo" &&
      (resource.datasetKind !== "synthetic_demo" ||
        resource.demoShelf === false)
    )
      return false;
    const version = store.versions.find(
      (v) => v.id === resource.publishedVersionId,
    );
    const asset = store.readingAssets.find(
      (a) => a.resourceVersionId === version?.id,
    );
    return !!(
      version &&
      asset &&
      canOpenAsset(resource, version, asset, store.issues)
    );
  });
  const books = searchResources(available, query);
  if (path === "/" && !params.has("sort"))
    books.sort(
      (a, b) =>
        (store.bookPresentations.find(
          (p) => p.resourceVersionId === a.publishedVersionId,
        )?.shelfOrder ?? 999) -
        (store.bookPresentations.find(
          (p) => p.resourceVersionId === b.publishedVersionId,
        )?.shelfOrder ?? 999),
    );
  const demoCount = store.resources.filter(
    (r) =>
      r.datasetKind === "synthetic_demo" &&
      r.demoShelf !== false &&
      r.publicationState === "published",
  ).length;
  const realCount = store.resources.filter(
    (r) =>
      r.datasetKind === "reviewed_real" && r.publicationState === "published",
  ).length;
  const segments = path.split("/").filter(Boolean);
  const selected =
    segments[0] === "library" && segments.length > 1
      ? store.resources.find((r) => r.id === segments[1])
      : undefined;
  const activeNav = nav.find((n) =>
    n.path === "/" ? path === "/" : path.startsWith(n.path),
  );
  const recent = [...store.positions].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  )[0];
  const recentResource = store.resources.find(
    (r) => r.id === recent?.resourceId,
  );
  async function addToPlan(
    resource: Resource,
    version: ResourceVersion,
    unit: Unit,
  ) {
    setPlanTarget({ resource, version, unit });
  }
  return (
    <div className="proto-app">
      <a className="skip-link" href="#main-content">
        본문으로 바로가기
      </a>
      <div className="demo-strip">
        <span className="status-dot" /> 시연용 프로토타입{" "}
        <span>· 실계정 인증 없음 · 가상 데이터</span>
      </div>
      <aside className={`proto-sidebar ${menu ? "is-open" : ""}`}>
        <Link
          href="/"
          className="proto-brand"
          onClick={(e) => {
            e.preventDefault();
            navigate("/");
          }}
        >
          <span className="brand-mark">
            <BookOpen size={26} />
          </span>
          <span>
            레슨 디자이너<small>CLASSICAL MUSIC LIBRARY</small>
          </span>
        </Link>
        <button
          className="mobile-close icon-button"
          aria-label="메뉴 닫기"
          onClick={() => setMenu(false)}
        >
          <X />
        </button>
        <p className="nav-label">나의 음악 작업실</p>
        <nav aria-label="주 메뉴">
          {nav.map((item) => (
            <a
              key={item.path}
              href={item.path}
              aria-current={activeNav?.path === item.path ? "page" : undefined}
              className={activeNav?.path === item.path ? "active" : ""}
              onClick={(e) => {
                e.preventDefault();
                navigate(item.path);
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
              {item.path === "/teacher/plans" && (
                <small>{store.plans.length}</small>
              )}
            </a>
          ))}
        </nav>
        <div className="side-rule" />
        <p className="nav-label">악기로 찾기</p>
        <nav aria-label="악기">
          {INSTRUMENTS.map((instrument) => (
            <a
              key={instrument}
              href={`/library?instrument=${instrument}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/library?instrument=${instrument}`);
              }}
            >
              <i style={{ background: palette[instrument].color }} />
              {instrumentLabels[instrument]}
              <ChevronRight size={15} />
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <BookMarked size={24} />
          <h3>한 권에서, 한 번의 수업으로.</h3>
          <p>
            자료를 살펴보고 수업에 필요한
            <br />
            단원을 수업안에 담아 보세요.
          </p>
          <Link
            href="/teacher/plans"
            onClick={(e) => {
              e.preventDefault();
              navigate("/teacher/plans");
            }}
          >
            수업 준비 시작하기 <ArrowUpRight size={16} />
          </Link>
        </div>
        <div className="local-profile">
          <span>LD</span>
          <div>
            <strong>선생님의 시연 작업실</strong>
            <small>이 브라우저에만 저장</small>
          </div>
        </div>
      </aside>
      {menu && (
        <button
          className="menu-scrim"
          aria-label="메뉴 닫기"
          onClick={() => setMenu(false)}
        />
      )}
      <div className="proto-body" inert={menu}>
        <header className="proto-topbar">
          <button
            className="mobile-menu icon-button"
            aria-label="메뉴 열기"
            onClick={() => setMenu(true)}
          >
            <Menu />
          </button>
          <div className="topbar-location">
            클래식 전자도서관 <ChevronRight size={14} />
            <strong>
              {selected
                ? instrumentLabels[selected.instrument]
                : activeNav?.label || "자료 열람"}
            </strong>
          </div>
          <label className="role-select">
            시연 역할{" "}
            <select
              value={role}
              onChange={(e) => {
                setRole(e.target.value);
                if (e.target.value !== "teacher") navigate("/admin/resources");
              }}
            >
              <option value="teacher">교사</option>
              <option value="reviewer">가상 검수자</option>
              <option value="editor">편집 관리자</option>
            </select>
          </label>
        </header>
        <main id="main-content" className="proto-main" tabIndex={-1}>
          {store.storageNotice && (
            <div className="notice warning" role="alert">
              {store.storageNotice}
              <button
                className="text-button"
                onClick={() => {
                  if (
                    window.confirm(
                      "이 브라우저의 수업안, 북마크, 검수 기록을 초기화할까요?",
                    )
                  )
                    void run(
                      (repo) => repo.reset(true),
                      "초기 데이터를 복원했습니다.",
                    );
                }}
              >
                저장소 초기화
              </button>
            </div>
          )}
          {!store.initialized ? (
            <div className="loading-state" role="status">
              <BookOpen /> 책장을 준비하고 있습니다…
            </div>
          ) : path.startsWith("/teacher/plans") ? (
            <TeacherPlansView
              path={location}
              navigate={navigate}
              store={store}
              run={run}
              notify={notify}
            />
          ) : path.startsWith("/admin") ? (
            <AdminView
              path={location}
              navigate={navigate}
              store={store}
              run={run}
              notify={notify}
            />
          ) : segments[0] === "library" && segments.length > 1 ? (
            <ReaderView
              key={`${segments[1]}-${params.get("version") || ""}`}
              store={store}
              resource={
                segments.length === 2 ||
                (segments.length === 4 && segments[2] === "units")
                  ? selected
                  : undefined
              }
              unitId={segments[3]}
              versionId={params.get("version") || undefined}
              navigate={navigate}
              run={run}
              notify={notify}
              addToPlan={addToPlan}
            />
          ) : path === "/practice" ? (
            <PracticeView store={store} query={query} navigate={navigate} />
          ) : path === "/bookmarks" ? (
            <BookmarksView store={store} navigate={navigate} run={run} />
          ) : path === "/" || path === "/library" ? (
            <>
              {path === "/" ? (
                <>
                  <div className="heading-row">
                    <div>
                      <p className="eyebrow">
                        A SMALL LIBRARY, A NEW BEGINNING
                      </p>
                      <h1>좋은 수업은, 좋은 한 권에서.</h1>
                      <p className="intro">
                        읽고, 고르고, 연결하며 나만의 음악 수업을 준비하세요.
                      </p>
                    </div>
                    <span className="edition-mark">
                      가을의 책장 <span>2026 · VOL. 01</span>
                    </span>
                  </div>
                  <section className="library-hero">
                    <div className="hero-content">
                      <span className="hero-kicker">
                        <span /> 선생님을 위한 클래식 전자도서관
                      </span>
                      <h2>
                        책을 펼치는 순간,
                        <br />
                        수업의 영감이 시작됩니다.
                      </h2>
                      <p>
                        네 가지 악기, 서로 다른 첫걸음.
                        <br />
                        필요한 자료를 찾아 한 번의 수업으로 엮어 보세요.
                      </p>
                      <button
                        className="button hero-button"
                        onClick={() =>
                          document
                            .getElementById("bookshelf")
                            ?.scrollIntoView({
                              behavior: window.matchMedia(
                                "(prefers-reduced-motion: reduce)",
                              ).matches
                                ? "auto"
                                : "smooth",
                            })
                        }
                      >
                        책장 둘러보기 <ArrowDown size={17} />
                      </button>
                      <div className="hero-footnote">
                        <BookOpen size={16} /> 합성 데모 {demoCount}권{" "}
                        <span>·</span> 구조화 단원 열람
                      </div>
                    </div>
                    <div className="hero-still-life" aria-hidden="true">
                      <div className="still-halo" />
                      <div className="still-book back">
                        <span>THE ART OF</span>
                        <b>
                          MUSIC
                          <br />
                          LESSONS
                        </b>
                        <i>한 권으로 시작하는 수업</i>
                      </div>
                      <div className="still-book front">
                        <span>LESSON DESIGNER</span>
                        <b>
                          나의 첫<br />
                          클래식 수업
                        </b>
                        <InstrumentDrawing instrument="violin" />
                        <small>읽고, 연주하고, 함께 자라다.</small>
                      </div>
                      <div className="still-shelf" />
                      <span className="still-caption">
                        A place for your next musical chapter.
                      </span>
                    </div>
                  </section>
                  <div className="quick-links">
                    <button onClick={() => navigate("/teacher/plans")}>
                      <span>
                        <NotebookPen size={22} />
                      </span>
                      <div>
                        <strong>수업안 만들기</strong>
                        <small>선택한 단원을 한 회차 수업으로</small>
                      </div>
                      <ArrowUpRight size={19} />
                    </button>
                    <button onClick={() => navigate("/practice")}>
                      <span>
                        <Music2 size={22} />
                      </span>
                      <div>
                        <strong>악기 연습실</strong>
                        <small>단원과 연결할 앱 후보 살펴보기</small>
                      </div>
                      <ArrowUpRight size={19} />
                    </button>
                    <button onClick={() => navigate("/bookmarks")}>
                      <span>
                        <Bookmark size={22} />
                      </span>
                      <div>
                        <strong>나의 북마크</strong>
                        <small>다시 보고 싶은 자료 모아두기</small>
                      </div>
                      <ArrowUpRight size={19} />
                    </button>
                  </div>
                  {recent && recentResource && (
                    <div className="resume-card">
                      <div className="resume-icon">
                        <BookOpen size={23} />
                      </div>
                      <div>
                        <small>지난 책갈피에서 이어서</small>
                        <strong>{recentResource.title}</strong>
                        <p>저장한 판본과 단원으로 이동합니다.</p>
                      </div>
                      <button
                        className="text-button"
                        onClick={() =>
                          navigate(
                            `/library/${recent.resourceId}/units/${recent.unitId}?version=${recent.resourceVersionId}`,
                          )
                        }
                      >
                        이어읽기 <ArrowRight size={17} />
                      </button>
                    </div>
                  )}
                </>
              ) : (
                <div className="heading-row">
                  <div>
                    <p className="eyebrow">EXPLORE THE COLLECTION</p>
                    <h1>모든 자료</h1>
                    <p className="intro">
                      수업의 목표에 맞는 한 권을 찾아보세요.
                    </p>
                  </div>
                </div>
              )}
              <section id="bookshelf" aria-labelledby="shelf-title">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">CURATED FOR YOUR CLASSROOM</p>
                    <h2 id="shelf-title">
                      선생님의 책장 <span>{books.length}</span>
                    </h2>
                  </div>
                  <span className="badge">합성 데모 서고</span>
                </div>
                <ShelfControls
                  key={location}
                  query={query}
                  params={params.toString()}
                  path={path}
                  navigate={navigate}
                />
                <div className="collection-tabs">
                  <div>
                    <button
                      className={audience === "demo" ? "active" : ""}
                      onClick={() => {
                        const p = new URLSearchParams(params);
                        p.delete("scope");
                        navigate(`${path}?${p}`);
                      }}
                    >
                      데모 서고 <small>{demoCount}</small>
                    </button>
                    <button
                      className={audience === "public" ? "active" : ""}
                      onClick={() => {
                        const p = new URLSearchParams(params);
                        p.set("scope", "real");
                        navigate(`${path}?${p}`);
                      }}
                    >
                      실자료 공개 보기 <small>{realCount}</small>
                    </button>
                  </div>
                  <span className="collection-help">
                    실제 교육 내용의 검수·권리 승인이 완료된 자료가 아닙니다.
                  </span>
                </div>
                {books.length ? (
                  <div
                    className={
                      params.get("view") === "list"
                        ? "book-list"
                        : "bookshelf-grid"
                    }
                  >
                    {books.map((resource) => (
                      <BookCard
                        key={resource.id}
                        resource={resource}
                        store={store}
                        navigate={navigate}
                        run={run}
                      />
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title={
                      audience === "public"
                        ? "현재 공개할 수 있는 승인 실자료가 없습니다."
                        : "조건에 맞는 자료가 없습니다."
                    }
                    text={
                      audience === "public"
                        ? "기존 자료는 검수와 권리 확인을 기다리고 있습니다. 합성 데모 서고에서 흐름을 체험할 수 있습니다."
                        : "검색어를 바꾸거나 필터를 초기화해 주세요."
                    }
                    action="필터 초기화 · 데모 서고 보기"
                    onAction={() => navigate(path)}
                  />
                )}
                <div className="shelf-caption">
                  <span>
                    {books.length}권의 자료 <i>·</i> PDF 파일 준비 중 · 구조화
                    단원 제공
                  </span>
                  <span>타이포그래피 표지 / 합성 시연 자료</span>
                </div>
              </section>
              <div className="library-footnote">
                <ShieldCheck size={23} />
                <div>
                  <strong>자료의 출처와 상태를 함께 읽어주세요.</strong>
                  <p>
                    합성 데모는 승인 흐름을 체험하기 위한 자료입니다. 원자료
                    19개와 기획 모듈 24개는 실제 승인 자료 수에 포함되지
                    않습니다.
                  </p>
                </div>
                <Link
                  href="/admin/resources"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate("/admin/resources");
                  }}
                >
                  관리 내역 <ArrowUpRight size={16} />
                </Link>
              </div>
            </>
          ) : (
            <EmptyState
              title="페이지를 찾을 수 없습니다."
              text="주소를 확인하거나 책장으로 돌아가세요."
              action="책장으로"
              onAction={() => navigate("/")}
            />
          )}
        </main>
        <footer className="proto-footer">
          <span>
            <BookOpen size={16} /> 레슨 디자이너 · 클래식 악기 교육 전자도서관
          </span>
          <span>
            이 브라우저에만 저장 <i>·</i> 시연용 프로토타입
          </span>
          <button
            className="text-button"
            onClick={() => {
              const confirmed = window.confirm(
                "저장된 북마크, 수업안과 시연 기록을 초기화할까요?",
              );
              if (confirmed)
                void run(
                  (repo) => repo.reset(true),
                  "시연 데이터를 초기화했습니다.",
                );
            }}
          >
            데이터 초기화
          </button>
        </footer>
      </div>
      {planTarget && (
        <PlanPicker
          target={planTarget}
          store={store}
          run={run}
          navigate={navigate}
          close={() => setPlanTarget(null)}
        />
      )}
      {notice && (
        <div role="status" className="proto-toast">
          <Check size={18} />
          <span>{notice}</span>
          <button aria-label="알림 닫기" onClick={() => setNotice("")}>
            <X size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function ShelfControls({
  query,
  params,
  path,
  navigate,
}: {
  query: SearchQuery;
  params: string;
  path: string;
  navigate: (to: string) => void;
}) {
  const [q, setQ] = useState(query.q || "");
  function change(patch: Partial<SearchQuery>) {
    const next = { ...query, ...patch };
    const extra = new URLSearchParams(params);
    const result = new URLSearchParams(serializeSearchQuery(next));
    if(path==='/' && (patch.sort==='title' || (patch.sort===undefined && extra.get('sort')==='title')))result.set('sort','title');
    for (const key of ["scope", "view"])
      if (extra.has(key)) result.set(key, extra.get(key)!);
    navigate(`${path}?${result}`);
  }
  function search(event: FormEvent) {
    event.preventDefault();
    change({ q });
  }
  const view = new URLSearchParams(params).get("view") || "shelf";
  return (
    <div className="shelf-controls">
      <div className="instrument-tabs" aria-label="악기 필터">
        <button
          className={!query.instruments?.length ? "active" : ""}
          onClick={() => change({ instruments: [] })}
        >
          전체 악기
        </button>
        {INSTRUMENTS.map((instrument) => (
          <button
            key={instrument}
            className={query.instruments?.includes(instrument) ? "active" : ""}
            onClick={() =>
              change({
                instruments: query.instruments?.includes(instrument)
                  ? query.instruments.filter((i) => i !== instrument)
                  : [...(query.instruments || []), instrument],
              })
            }
          >
            <i style={{ background: palette[instrument].color }} />
            {instrumentLabels[instrument]}
          </button>
        ))}
      </div>
      <form className="shelf-search" onSubmit={search}>
        <Search size={20} />
        <input
          aria-label="자료 검색"
          placeholder="제목, 주제, 학습목표로 검색"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" aria-label="검색 실행">
          <ArrowRight size={20} />
        </button>
      </form>
      <details className="advanced-filters">
        <summary>
          <SlidersHorizontal size={17} /> 상세 필터
        </summary>
        <div className="filter-fields">
          <label>
            자료 종류
            <select
              value={query.kinds?.[0] || ""}
              onChange={(e) =>
                change({
                  kinds: e.target.value
                    ? [e.target.value as Resource["kind"]]
                    : [],
                })
              }
            >
              <option value="">모든 종류</option>
              {Object.entries(kindLabels)
                .filter(([id]) => id !== "lesson_plan")
                .map(([id, label]) => (
                  <option key={id} value={id}>
                    {label}
                  </option>
                ))}
            </select>
          </label>
          <label>
            대상 수준
            <select
              value={query.levels?.[0] || ""}
              onChange={(e) =>
                change({
                  levels: e.target.value ? [Number(e.target.value)] : [],
                })
              }
            >
              <option value="">모든 수준</option>
              <option value="1">수준 1</option>
              <option value="2">수준 2</option>
              <option value="3">수준 3</option>
            </select>
          </label>
          <label>
            학습목표
            <input
              aria-label="학습목표 필터"
              defaultValue={query.objectives?.[0] || ""}
              onBlur={(e) => {
                if (e.target.value !== (query.objectives?.[0] || ""))
                  change({
                    objectives: e.target.value ? [e.target.value] : [],
                  });
              }}
            />
          </label>
          <label>
            주제
            <input
              aria-label="주제 필터"
              defaultValue={query.topics?.[0] || ""}
              onBlur={(e) => {
                if (e.target.value !== (query.topics?.[0] || ""))
                  change({ topics: e.target.value ? [e.target.value] : [] });
              }}
            />
          </label>
        </div>
      </details>
      <div className="shelf-sort">
        <label>
          <span className="sr-only">자료 정렬</span>
          <select
            value={new URLSearchParams(params).get('sort') || (path==='/'?'shelf':'title')}
            onChange={(e) => {
              if(e.target.value==='shelf'){const p=new URLSearchParams(params);p.delete('sort');navigate(`${path}?${p}`)}
              else change({ sort: e.target.value as SearchQuery["sort"] });
            }}
          >
            {path==='/'&&<option value="shelf">책장 순서</option>}
            <option value="title">제목순</option>
            <option value="recent">최근 수정순</option>
          </select>
        </label>
        <div className="view-toggle">
          <button
            aria-label="책장 보기"
            aria-pressed={view === "shelf"}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.delete("view");
              navigate(`${path}?${p}`);
            }}
          >
            <Grid2X2 size={18} />
          </button>
          <button
            aria-label="목록 보기"
            aria-pressed={view === "list"}
            onClick={() => {
              const p = new URLSearchParams(params);
              p.set("view", "list");
              navigate(`${path}?${p}`);
            }}
          >
            <List size={20} />
          </button>
        </div>
        <button className="text-button" onClick={() => navigate(path)}>
          초기화
        </button>
      </div>
      {query.instruments?.length ||
      query.kinds?.length ||
      query.levels?.length ||
      query.q ||
      query.objectives?.length ||
      query.topics?.length ? (
        <div className="active-filters">
          <span>적용 중</span>
          {[
            ...(query.instruments || []).map((i) => instrumentLabels[i]),
            ...(query.kinds || []).map((k) => kindLabels[k]),
            ...(query.levels || []).map((l) => `수준 ${l}`),
            query.q,
            ...(query.objectives || []),
            ...(query.topics || []),
          ]
            .filter(Boolean)
            .map((text, i) => (
              <span className="badge" key={i}>
                {text}
              </span>
            ))}
        </div>
      ) : null}
    </div>
  );
}

function BookCard({
  resource,
  store,
  navigate,
  run,
}: {
  resource: Resource;
  store: RepositoryState;
  navigate: (to: string) => void;
  run: Run;
}) {
  const version = store.versions.find(
    (v) => v.id === resource.publishedVersionId,
  )!;
  const bookmarked = store.bookmarks.some(
    (b) => b.resourceId === resource.id && b.versionId === version.id,
  );
  const color = palette[resource.instrument];
  const presentation = store.bookPresentations.find(
    (p) => p.resourceVersionId === version.id,
  );
  const displayTitle = presentation?.displayTitle || resource.title;
  return (
    <article
      className="shelf-book"
      style={
        {
          "--book-color": color.color,
          "--book-light": color.light,
        } as CSSProperties
      }
    >
      <a
        className="book-cover"
        href={`/library/${resource.id}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(`/library/${resource.id}`);
        }}
        aria-label={`${resource.title} 책 열기`}
      >
        <span className="cover-edition">
          LESSON DESIGNER LIBRARY{" "}
          <span>0{INSTRUMENTS.indexOf(resource.instrument) + 1}</span>
        </span>
        <span className="cover-demo">합성 데모</span>
        <h3>
          {instrumentLabels[resource.instrument]}
          <span>{displayTitle}</span>
        </h3>
        <span className="cover-english">
          {color.en}
          <br />
          {resource.kind === "textbook"
            ? "THE FIRST CHAPTER"
            : "CLASSROOM NOTES"}
        </span>
        {presentation?.coverOrigin !== "none" && (
          <div className="cover-drawing">
            <InstrumentDrawing instrument={resource.instrument} />
          </div>
        )}
        <span className="cover-bottom">
          {kindLabels[resource.kind]} <i /> SYNTHETIC EDITION
        </span>
      </a>
      <button
        className={`book-bookmark ${bookmarked ? "selected" : ""}`}
        aria-label={`${resource.title} 북마크 ${bookmarked ? "해제" : "추가"}`}
        aria-pressed={bookmarked}
        onClick={() =>
          void run(
            (repo) =>
              repo.toggleBookmark({
                resourceId: resource.id,
                versionId: version.id,
                unitId: null,
              }),
            bookmarked ? "북마크를 해제했습니다." : "북마크에 담았습니다.",
          )
        }
      >
        <Bookmark size={19} fill={bookmarked ? "currentColor" : "none"} />
      </button>
      <div className="book-description">
        <div className="book-category">
          <i />
          {instrumentLabels[resource.instrument]} · {kindLabels[resource.kind]}
        </div>
        <h3>{resource.title}</h3>
        <div className="book-meta">
          <span>수준 {resource.level}</span>
          <span>{version.version}</span>
          <span>{resource.estimatedMinutes}분</span>
        </div>
        <p>{resource.objectives[0]}</p>
        <span className="book-state">
          <span /> 승인 흐름 시연 · 구조화 단원
        </span>
      </div>
    </article>
  );
}

function ReaderView({
  store,
  resource,
  unitId,
  versionId,
  navigate,
  run,
  addToPlan,
}: {
  store: RepositoryState;
  resource: Resource | undefined;
  unitId?: string;
  versionId?: string;
  navigate: (to: string) => void;
  run: Run;
  notify: (s: string) => void;
  addToPlan: (r: Resource, v: ResourceVersion, u: Unit) => Promise<void>;
}) {
  const version = store.versions.find(
    (v) => v.id === (versionId || resource?.publishedVersionId),
  );
  const asset = store.readingAssets.find(
    (a) => a.resourceVersionId === version?.id,
  );
  const units = store.units
    .filter((u) => u.resourceVersionId === version?.id)
    .sort((a, b) => a.order - b.order);
  const unit = unitId ? units.find((u) => u.id === unitId) : undefined;
  const [zoom, setZoom] = useState(100),
    [report, setReport] = useState(false);
  const canView = !!(
    resource &&
    version &&
    asset &&
    canOpenAsset(resource, version, asset, store.issues)
  );
  const readingResourceId = resource?.id,
    readingVersionId = version?.id,
    readingUnitId = unit?.id,
    readingAssetId = asset?.id;
  useEffect(() => {
    if (
      readingResourceId &&
      readingVersionId &&
      readingUnitId &&
      readingAssetId &&
      canView
    )
      void run((repo) =>
        repo.recordBookPosition({
          projectId: "classical-library",
          resourceId: readingResourceId,
          resourceVersionId: readingVersionId,
          assetId: readingAssetId,
          pageNumber: null,
          unitId: readingUnitId,
          updatedAt: new Date().toISOString(),
        }),
      );
  }, [
    readingResourceId,
    readingVersionId,
    readingUnitId,
    readingAssetId,
    canView,
    run,
  ]);
  if (!resource || !version || !asset)
    return (
      <EmptyState
        title="자료 또는 판본을 찾을 수 없습니다."
        text="주소가 바뀌었거나 공개되지 않은 자료입니다."
        action="자료 목록으로"
        onAction={() => navigate("/library")}
      />
    );
  if (!canView)
    return (
      <EmptyState
        title="이 자료의 열람이 중지되었습니다."
        text="권리 미확인, 미공개 또는 오류 신고로 보류된 자료입니다. 기존 수업안의 판본은 자동으로 바뀌지 않습니다."
        action="안전하게 책장으로"
        onAction={() => navigate("/library")}
      />
    );
  if (unitId && !unit)
    return (
      <EmptyState
        title="이 판본의 단원이 아닙니다."
        text="자료와 단원 주소를 확인해 주세요."
        action="자료 상세로"
        onAction={() =>
          navigate(`/library/${resource.id}?version=${version.id}`)
        }
      />
    );
  const index = units.findIndex((u) => u.id === unit?.id);
  const bookmarked = store.bookmarks.some(
    (b) =>
      b.resourceId === resource.id &&
      b.versionId === version.id &&
      b.unitId === (unit?.id || null),
  );
  const goUnit = (u: Unit) =>
    navigate(`/library/${resource.id}/units/${u.id}?version=${version.id}`);
  return (
    <div
      className={`reader-view ${canPrint(resource, version, asset, store.issues) ? "" : "print-restricted"}`}
    >
      <button
        className="text-button back-link"
        onClick={() =>
          window.history.length > 1
            ? window.history.back()
            : navigate("/library")
        }
      >
        <ArrowLeft size={17} /> 이전 화면
      </button>
      <div className="heading-row">
        <div>
          <p className="eyebrow">
            {palette[resource.instrument].en} · SYNTHETIC DEMO
          </p>
          <h1>{resource.title}</h1>
          <p className="intro">{resource.description}</p>
        </div>
        <span className="badge">승인 흐름 시연</span>
      </div>
      <div className="reader-meta-bar">
        <span>
          {instrumentLabels[resource.instrument]} · {resource.instrumentSystem}
        </span>
        <span>수준 {resource.level}</span>
        <span>판본 {version.version}</span>
        <span>
          <Clock size={16} /> {resource.estimatedMinutes}분
        </span>
        <span>PDF 파일 준비 중</span>
      </div>
      <div className="reader-layout">
        <aside className="reader-toc panel">
          <h2>
            <List size={20} /> 목차
          </h2>
          <button
            className={!unit ? "active" : ""}
            onClick={() =>
              navigate(`/library/${resource.id}?version=${version.id}`)
            }
          >
            자료 안내
          </button>
          {units.map((u, i) => (
            <button
              key={u.id}
              aria-current={u.id === unit?.id ? "page" : undefined}
              className={u.id === unit?.id ? "active" : ""}
              onClick={() => goUnit(u)}
            >
              <span>{String(i + 1).padStart(2, "0")}</span>
              {u.title}
            </button>
          ))}
          <p>
            원본 교재를 대신하지 않는
            <br />
            중립적인 구조 예시입니다.
          </p>
        </aside>
        <div className="reader-paper panel">
          <div className="reader-toolbar">
            <span>
              {unit ? `단원 ${index + 1} / ${units.length}` : "자료 안내"}
            </span>
            <div>
              <button
                className="icon-button"
                aria-label="글자 축소"
                onClick={() => setZoom((z) => Math.max(100, z - 25))}
                disabled={zoom === 100}
              >
                <ZoomOut size={18} />
              </button>
              <span>{zoom}%</span>
              <button
                className="icon-button"
                aria-label="글자 확대"
                onClick={() => setZoom((z) => Math.min(200, z + 25))}
                disabled={zoom === 200}
              >
                <ZoomIn size={18} />
              </button>
              <button
                className="icon-button"
                aria-label="현재 위치 북마크"
                aria-pressed={bookmarked}
                onClick={() =>
                  void run(
                    (repo) =>
                      repo.toggleBookmark({
                        resourceId: resource.id,
                        versionId: version.id,
                        unitId: unit?.id || null,
                      }),
                    "북마크를 변경했습니다.",
                  )
                }
              >
                <Bookmark
                  size={19}
                  fill={bookmarked ? "currentColor" : "none"}
                />
              </button>
            </div>
          </div>
          <div className="reading-content" style={{ fontSize: `${zoom}%` }}>
            {unit ? (
              <>
                <span className="eyebrow">
                  CHAPTER {String(index + 1).padStart(2, "0")}
                </span>
                <h2>{unit.title}</h2>
                {unit.blocks.map((block) =>
                  block.type === "paragraph" ? (
                    <p key={block.id}>{block.text}</p>
                  ) : (
                    <figure key={block.id}>
                      <div
                        className="neutral-diagram"
                        role="img"
                        aria-label={
                          block.alt ||
                          "자료 확인, 수업 준비, 되돌아보기의 중립적 학습 순서"
                        }
                      >
                        <span>자료 확인</span>
                        <ArrowRight />
                        <span>수업 준비</span>
                        <ArrowRight />
                        <span>되돌아보기</span>
                      </div>
                      <figcaption>
                        {block.caption ||
                          block.alt ||
                          "교육 내용의 정확성을 주장하지 않는 합성 도식"}
                      </figcaption>
                    </figure>
                  ),
                )}
                <div className="demo-watermark">
                  SYNTHETIC DEMO · 교육 내용 검수 전
                </div>
              </>
            ) : (
              <>
                <span className="eyebrow">ABOUT THIS BOOK</span>
                <h2>수업을 준비하는 작은 첫걸음</h2>
                <p>{resource.description}</p>
                <h3>학습목표</h3>
                <ul>
                  {resource.objectives.map((objective) => (
                    <li key={objective}>{objective}</li>
                  ))}
                </ul>
                <h3>선수학습 · 준비</h3>
                <p>
                  {resource.prerequisites.join(" · ") ||
                    "교사가 실제 승인 자료를 확인한 뒤 수업에 맞게 구성합니다."}
                </p>
                <div className="notice">
                  이 자료는 합성 시연용입니다. 실제 운지·호흡·자세를 가르치는
                  원문이나 전문가 승인 자료가 아닙니다.
                </div>
                <button
                  className="button primary"
                  onClick={() => units[0] && goUnit(units[0])}
                >
                  첫 단원 열기 <ArrowRight size={17} />
                </button>
              </>
            )}
          </div>
          {unit && (
            <div className="unit-navigation">
              <button
                className="button"
                disabled={index === 0}
                onClick={() => goUnit(units[index - 1])}
              >
                <ArrowLeft size={16} /> 이전 단원
              </button>
              <button
                className="button primary"
                onClick={() => void addToPlan(resource, version, unit)}
              >
                <NotebookPen size={17} /> 수업안에 담기
              </button>
              <button
                className="button"
                disabled={index === units.length - 1}
                onClick={() => goUnit(units[index + 1])}
              >
                다음 단원 <ArrowRight size={16} />
              </button>
            </div>
          )}
        </div>
        <aside className="resource-info">
          <section className="panel">
            <h2>
              <ShieldCheck size={19} /> 자료 정보
            </h2>
            <dl>
              <dt>검수 상태</dt>
              <dd>승인 흐름 시연</dd>
              <dt>검수 범위</dt>
              <dd>{version.reviewScope || "시연 UI와 데이터 흐름"}</dd>
              <dt>검수자</dt>
              <dd>
                {version.reviewerNameConsent
                  ? version.reviewerDisplayName
                  : "표시명 비공개"}
              </dd>
              <dt>검수일</dt>
              <dd>{version.reviewedAt?.slice(0, 10) || "실제 검수일 없음"}</dd>
              <dt>권리</dt>
              <dd>
                {version.rights.state === "cleared"
                  ? "합성 데모 열람 허용"
                  : "권리 확인 전"}
              </dd>
              <dt>AI 활용</dt>
              <dd>{version.aiUsage}</dd>
              <dt>출처</dt>
              <dd>
                {resource.sourceRefs.map((s) => (
                  <p key={s.id}>
                    {s.title}
                    {s.pageRange &&
                      ` · ${s.pageRange} (원자료 메타데이터 · 원문 대조 전)`}
                  </p>
                ))}
              </dd>
            </dl>
            <button
              className="button"
              disabled={!canPrint(resource, version, asset, store.issues)}
              onClick={() =>
                void run(async (repo) => {
                  await repo.authorizeAsset(
                    resource.id,
                    version.id,
                    asset.id,
                    "print",
                  );
                  window.print();
                })
              }
            >
              이 자료 출력
            </button>
            <p className="muted">다운로드 파일 준비 중</p>
          </section>
          <section className="panel">
            <h2>단원과 함께</h2>
            <p>검증된 관련 앱이 연결되면 표시됩니다.</p>
            <button
              className="button"
              onClick={() =>
                navigate(`/practice?instrument=${resource.instrument}`)
              }
            >
              앱 후보 살펴보기 <ExternalLink size={16} />
            </button>
            <p className="muted">점검 전 앱은 실행할 수 없습니다.</p>
            {unit?.appLinkIds
              .map((id) => store.apps.find((a) => a.id === id))
              .filter((app): app is AppLink => !!app)
              .map((app) => (
                <div className="unit-app-link" key={app.id}>
                  <strong>{app.title}</strong>
                  <p>{app.purpose}</p>
                  {canOpenApp(app) ? (
                    <a
                      className="button"
                      href={app.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      관련 앱 새 탭 열기 <ExternalLink size={15} />
                    </a>
                  ) : (
                    <span className="badge">점검 전 · 연결 준비 중</span>
                  )}
                </div>
              ))}
          </section>
          <button
            className="text-button report-link"
            onClick={() => setReport(true)}
          >
            이 위치의 오류 신고
          </button>
        </aside>
      </div>
      {report && (
        <ReportDialog
          resource={resource}
          version={version}
          unit={unit}
          run={run}
          close={() => setReport(false)}
        />
      )}
      <div className="print-provenance">
        <strong>
          합성 시연 자료 · {resource.title} · {version.version}
        </strong>
        <p>
          출처: {resource.sourceRefs.map((s) => s.title).join(", ")} · 실제 교육
          내용 검수 전 · 권리: 합성 데모
        </p>
      </div>
    </div>
  );
}

function ReportDialog({
  resource,
  version,
  unit,
  run,
  close,
}: {
  resource: Resource;
  version: ResourceVersion;
  unit?: Unit;
  run: Run;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    submitting = useRef(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog ref={ref} aria-label="오류 신고" className="report-dialog" onCancel={close}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (submitting.current) return;
          submitting.current = true;
          setBusy(true);
          const f = new FormData(e.currentTarget);
          const result = await run(
            (repo) =>
              repo.reportIssue({
                resourceId: resource.id,
                versionId: version.id,
                unitId: unit?.id || null,
                blockId: String(f.get("block") || "") || null,
                category: f.get("category") as "other",
                severity: f.get("severity") as "minor",
                description: String(f.get("description")),
                evidence: String(f.get("evidence")),
                suggestion: String(f.get("suggestion")),
              }),
            "오류 신고를 저장했습니다. 안전·중대 오류는 열람이 보류됩니다.",
          );
          submitting.current = false;
          setBusy(false);
          if (result) close();
        }}
      >
        <div className="section-heading">
          <h2>이 위치의 오류 신고</h2>
          <button
            type="button"
            className="icon-button"
            aria-label="신고 창 닫기"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <p>
          {resource.title} · {version.version} · {unit?.title || "자료 안내"}
        </p>
        <p className="muted">
          학생 이름, 연락처 등 개인정보를 입력하지 마세요.
        </p>
        <label>
          범주
          <select aria-label="범주" name="category">
            <option value="other">기타</option>
            <option value="music">음악 내용</option>
            <option value="pedagogy">교육 방법</option>
            <option value="safety">안전</option>
            <option value="rights">권리</option>
          </select>
        </label>
        <label>
          심각도
          <select aria-label="심각도" name="severity">
            <option value="minor">일반</option>
            <option value="major">중대</option>
            <option value="critical">긴급</option>
          </select>
        </label>
        <label>
          본문 위치
          <select aria-label="본문 위치" name="block">
            <option value="">단원 전체</option>
            {unit?.blocks.map((b, i) => (
              <option key={b.id} value={b.id}>
                블록 {i + 1} · {b.text?.slice(0, 30) || b.alt || b.type}
              </option>
            ))}
          </select>
        </label>
        <label>
          오류 내용
          <textarea name="description" required minLength={5} />
        </label>
        <label>
          확인 근거
          <textarea name="evidence" required />
        </label>
        <label>
          수정 제안
          <textarea name="suggestion" required />
        </label>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "저장 중…" : "신고 저장"}
        </button>
      </form>
    </dialog>
  );
}

function PlanPicker({
  target,
  store,
  run,
  navigate,
  close,
}: {
  target: { resource: Resource; version: ResourceVersion; unit: Unit };
  store: RepositoryState;
  run: Run;
  navigate: (path: string) => void;
  close: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    busyRef = useRef(false);
  const plans = store.plans.filter(
    (p) => p.instrument === target.resource.instrument,
  );
  const [planId, setPlanId] = useState(plans[0]?.id || "new"),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement;
    ref.current?.showModal();
    return () => previous?.focus();
  }, []);
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    try {
      const result = await run(async (repo) => {
        const plan =
          planId === "new"
            ? await repo.createLessonPlan(target.resource.instrument)
            : repo.snapshot().plans.find((p) => p.id === planId);
        if (!plan) throw new Error("수업안을 찾을 수 없습니다.");
        const exists = plan.activities.some((a) =>
          a.resources.some(
            (r) =>
              r.resourceId === target.resource.id &&
              r.versionId === target.version.id &&
              r.unitId === target.unit.id,
          ),
        );
        if (exists) return { id: plan.id, duplicate: true };
        const targetIndex = Math.max(
          0,
          plan.activities.findIndex((a) => a.phase === "main"),
        );
        const activities = plan.activities.map((a, i) =>
          i === targetIndex
            ? {
                ...a,
                resources: [
                  ...a.resources,
                  {
                    resourceId: target.resource.id,
                    versionId: target.version.id,
                    unitId: target.unit.id,
                  },
                ],
              }
            : a,
        );
        const saved = await repo.saveLessonPlan(
          { ...plan, activities },
          plan.revision,
        );
        return { id: saved.id, duplicate: false };
      });
      if (result) {
        const saved = result as { id: string; duplicate: boolean };
        close();
        navigate(`/teacher/plans/${saved.id}`);
        if (saved.duplicate)
          void run(
            async () => undefined,
            "이미 담긴 단원입니다. 해당 수업안을 열었습니다.",
          );
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return (
    <dialog ref={ref} aria-label="수업안 선택" className="report-dialog" onCancel={close}>
      <form onSubmit={save}>
        <div className="section-heading">
          <h2>수업안에 담기</h2>
          <button
            className="icon-button"
            type="button"
            aria-label="수업안 선택 닫기"
            onClick={close}
          >
            <X />
          </button>
        </div>
        <p>
          {target.resource.title} · {target.version.version}
        </p>
        <p>{target.unit.title}</p>
        <label>
          수업안 선택
          <select
            aria-label="수업안 선택"
            value={planId}
            onChange={(e) => setPlanId(e.target.value)}
          >
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
            <option value="new">새 수업안 만들기</option>
          </select>
        </label>
        <p className="muted">
          이 판본과 단원을 고정해 담습니다. 같은 단원은 중복으로 담지 않습니다.
        </p>
        <button className="button primary" type="submit" disabled={busy}>
          {busy ? "저장 중…" : "단원 담기"} <NotebookPen size={17} />
        </button>
      </form>
    </dialog>
  );
}

function PracticeView({
  store,
  query,
  navigate,
}: {
  store: RepositoryState;
  query: SearchQuery;
  navigate: (s: string) => void;
}) {
  const apps = store.apps
    .filter(
      (app) => app.scope === "mvp_candidate" || app.scope === "common_tool",
    )
    .filter(
      (app) =>
        !query.instruments?.length ||
        !app.instruments.length ||
        app.instruments.some((i) => query.instruments?.includes(i)),
    );
  return (
    <>
      <div className="heading-row">
        <div>
          <p className="eyebrow">CONNECT YOUR LESSON</p>
          <h1>악기 연습실</h1>
          <p className="intro">
            단원에서 연습으로 이어지는 앱 후보를 살펴보세요.
          </p>
        </div>
        <span className="badge">문서 기반 후보 · 점검 전</span>
      </div>
      <div className="notice">
        <ShieldCheck size={21} />
        <p>
          앱의 실행·내용·개인정보 처리는 아직 점검하지 않았습니다. 검증된 앱만
          실행 버튼이 활성화되며, 앱을 열어도 학습 완료로 기록하지 않습니다.
        </p>
      </div>
      <div className="instrument-tabs practice-tabs">
        <button
          className={!query.instruments?.length ? "active" : ""}
          onClick={() => navigate("/practice")}
        >
          전체
        </button>
        {INSTRUMENTS.map((i) => (
          <button
            key={i}
            className={query.instruments?.includes(i) ? "active" : ""}
            onClick={() => navigate(`/practice?instrument=${i}`)}
          >
            {instrumentLabels[i]}
          </button>
        ))}
      </div>
      <div className="practice-grid">
        {apps.map((app) => (
          <PracticeCard key={app.id} app={app} store={store} />
        ))}
      </div>
      <div className="library-footnote">
        <Music2 />
        <div>
          <strong>정적 대체 자료로 수업을 이어가세요.</strong>
          <p>
            앱이 준비되지 않았을 때는 데모 서고의 구조화 단원을 수업 준비 예시로
            사용할 수 있습니다. 카메라·마이크는 사용하지 않습니다.
          </p>
        </div>
        <button className="text-button" onClick={() => navigate("/library")}>
          데모 서고 <ArrowRight size={16} />
        </button>
      </div>
    </>
  );
}
function PracticeCard({
  app,
  store,
}: {
  app: AppLink;
  store: RepositoryState;
}) {
  const enabled = canOpenApp(app);
  return (
    <article className="panel practice-card">
      <span className="app-symbol">
        <Music2 size={28} />
      </span>
      <span className="badge">
        {app.status === "available" ? "링크 점검 기록 있음" : "점검 전"}
      </span>
      <h2>{app.title}</h2>
      <p>{app.purpose}</p>
      <dl>
        <dt>악기 · 체계</dt>
        <dd>
          {app.instruments.map((i) => instrumentLabels[i]).join(", ") ||
            "공통 도구"}{" "}
          · {app.instrumentSystem || "확인 전"}
        </dd>
        <dt>교육 내용</dt>
        <dd>
          {app.contentAccuracyChecked
            ? "확인 기록 있음"
            : "음악적 정확성 검수 전"}
        </dd>
        <dt>실행 확인</dt>
        <dd>{app.checkedAt ? app.checkedAt.slice(0, 10) : "미실행"}</dd>
      </dl>
      {enabled ? (
        <a
          className="button primary"
          href={app.url}
          target="_blank"
          rel="noopener noreferrer"
        >
          외부 앱 새 탭 열기 <ExternalLink size={16} />
        </a>
      ) : (
        <button className="button" disabled>
          점검 후 연결 예정
        </button>
      )}
      <p className="muted">
        {enabled
          ? "새 탭을 닫으면 원래 단원으로 돌아옵니다."
          : "권한·내용·악기체계 확인 전입니다."}
      </p>
      {app.fallbackResourceId &&
        store.resources.some((r) => r.id === app.fallbackResourceId) && (
          <a href={`/library/${app.fallbackResourceId}`}>대체 자료 보기</a>
        )}
    </article>
  );
}

function BookmarksView({
  store,
  navigate,
  run,
}: {
  store: RepositoryState;
  navigate: (s: string) => void;
  run: Run;
}) {
  return (
    <>
      <div className="heading-row">
        <div>
          <p className="eyebrow">YOUR SAVED CHAPTERS</p>
          <h1>북마크 · 이어보기</h1>
          <p className="intro">다음 수업을 위해 남겨둔 책갈피입니다.</p>
        </div>
        <BookMarked size={35} />
      </div>
      <h2>
        나의 북마크 <span className="muted">{store.bookmarks.length}</span>
      </h2>
      {!store.bookmarks.length ? (
        <EmptyState
          title="아직 꽂아둔 책갈피가 없습니다."
          text="책 표지나 단원에서 북마크를 눌러 모아보세요."
          action="책장 둘러보기"
          onAction={() => navigate("/library")}
        />
      ) : (
        <div className="saved-list">
          {store.bookmarks.map((b, i) => {
            const r = store.resources.find((r) => r.id === b.resourceId),
              v = store.versions.find((v) => v.id === b.versionId);
            return (
              <article className="panel saved-row" key={i}>
                <BookOpen />
                <div>
                  <h3>{r?.title || "삭제된 자료"}</h3>
                  <p>
                    {v?.version} ·{" "}
                    {store.units.find((u) => u.id === b.unitId)?.title ||
                      "자료 안내"}
                    {r?.publicationState === "on_hold"
                      ? " · 보류됨: 열람 중지"
                      : ""}
                  </p>
                </div>
                <button
                  className="button"
                  disabled={!r}
                  onClick={() =>
                    navigate(
                      `/library/${b.resourceId}${b.unitId ? `/units/${b.unitId}` : ""}?version=${b.versionId}`,
                    )
                  }
                >
                  책 열기
                </button>
                <button
                  className="icon-button"
                  aria-label={`${r?.title || "자료"} 북마크 해제`}
                  onClick={() =>
                    void run(
                      (repo) => repo.toggleBookmark(b),
                      "북마크를 해제했습니다.",
                    )
                  }
                >
                  <X size={18} />
                </button>
              </article>
            );
          })}
        </div>
      )}
      <h2 className="recent-title">최근 읽은 위치</h2>
      {store.positions.length ? (
        <div className="saved-list">
          {[...store.positions]
            .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
            .map((p) => (
              <article
                className="panel saved-row"
                key={`${p.resourceVersionId}-${p.assetId}`}
              >
                <Clock />
                <div>
                  <h3>
                    {store.resources.find((r) => r.id === p.resourceId)
                      ?.title || "삭제된 자료"}
                  </h3>
                  <p>
                    저장한 판본의{" "}
                    {store.units.find((u) => u.id === p.unitId)?.title ||
                      "유효하지 않은 위치"}
                  </p>
                </div>
                <button
                  className="button"
                  onClick={() =>
                    navigate(
                      `/library/${p.resourceId}/units/${p.unitId}?version=${p.resourceVersionId}`,
                    )
                  }
                >
                  이어읽기 <ArrowRight size={16} />
                </button>
              </article>
            ))}
        </div>
      ) : (
        <p className="muted">단원을 열면 읽던 위치가 저장됩니다.</p>
      )}
    </>
  );
}
function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action: string;
  onAction: () => void;
}) {
  return (
    <div className="proto-empty">
      <BookOpen size={36} />
      <h2>{title}</h2>
      <p>{text}</p>
      <button className="button primary" onClick={onAction}>
        {action} <ArrowRight size={16} />
      </button>
    </div>
  );
}
