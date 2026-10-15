"use client";

import {
  cloneElement,
  isValidElement,
  useLayoutEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from "react";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BookOpen,
  Check,
  ClipboardList,
  Copy,
  FileCheck2,
  Link2,
  Plus,
  Printer,
  Save,
  Search,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import {
  INSTRUMENTS,
  instrumentLabels,
  normalizeSearch,
  planWarnings,
  totalPlanMinutes,
  publishBlockers,
  appBlockers,
  canPrint,
  canPublish,
  demoPublishBlockers,
  visibleTo,
  type RepositoryState,
  type PrototypeRepository,
  type LessonPlan,
  type Resource,
  type ResourceVersion,
  type AppLink,
  type ReviewIssue,
  type Unit,
  type RightsRecord,
  type BookPresentation,
  type ReadingAsset,
} from "@/lib/prototype";
import "./workspace.css";

export interface WorkspaceViewProps {
  path: string;
  navigate: (path: string) => void;
  store: RepositoryState;
  run: (
    operation: (repository: PrototypeRepository) => Promise<unknown>,
    success?: string,
  ) => Promise<unknown>;
  notify: (message: string) => void;
}

const reviewLabels: Record<string, string> = {
  draft: "초안",
  in_review: "검토 중",
  changes_requested: "수정 요청",
  re_review: "재검토 중",
  approved: "승인 흐름 시연",
  rejected: "반려",
};
const rightsLabels: Record<string, string> = {
  unknown: "권리 미확인",
  pending: "권리 확인 중",
  cleared: "권리 확인",
  restricted: "사용 제한",
};
const phaseLabels = { intro: "도입", main: "활동", wrapup: "정리" };
const kindLabels: Record<string, string> = {
  textbook: "교재",
  score: "악보",
  diagram: "도식",
  activity: "활동자료",
};
const issueLabels: Record<string, string> = {
  open: "검토 대기",
  fixed: "수정 완료 · 재확인 전",
  verified: "재검수 확인",
  dismissed: "사유 기록 후 제외",
};
const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const dateLabel = (value: string | null | undefined) =>
  value
    ? new Date(value).toLocaleString("ko-KR", {
        timeZone: "Asia/Seoul",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "기록 없음";
const uid = () =>
  `activity-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
const canLeaveEditor = () =>
  window.dispatchEvent(
    new Event("lesson-designer-before-navigate", { cancelable: true }),
  );

function Field({
  label,
  children,
  hint,
  wide = false,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
  wide?: boolean;
}) {
  const id = useId();
  const control = isValidElement<{ id?: string; "aria-describedby"?: string }>(
    children,
  )
    ? cloneElement(children, {
        id,
        ...(hint ? { "aria-describedby": `${id}-hint` } : {}),
      })
    : children;
  return (
    <div className={`ws-field${wide ? " ws-wide" : ""}`}>
      <label htmlFor={id}>{label}</label>
      {control}
      {hint && <small id={`${id}-hint`}>{hint}</small>}
    </div>
  );
}
function LocalLink({
  to,
  navigate,
  children,
  className = "",
}: {
  to: string;
  navigate: WorkspaceViewProps["navigate"];
  children: ReactNode;
  className?: string;
}) {
  return (
    <a
      href={to}
      className={className}
      onClick={(event) => {
        if (
          !event.ctrlKey &&
          !event.metaKey &&
          !event.shiftKey &&
          event.button === 0
        ) {
          event.preventDefault();
          navigate(to);
        }
      }}
    >
      {children}
    </a>
  );
}
function Empty({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="ws-empty">
      <BookOpen size={32} aria-hidden="true" />
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
function SaveButton({
  busy,
  children = "변경사항 저장",
}: {
  busy: boolean;
  children?: ReactNode;
}) {
  return (
    <button className="ws-button ws-primary" type="submit" disabled={busy}>
      <Save size={17} aria-hidden="true" />
      {busy ? "저장 중…" : children}
    </button>
  );
}
function useUnsavedGuard(dirty: boolean) {
  useLayoutEffect(() => {
    if (!dirty) return;
    const editorUrl = window.location.href;
    const editorHistoryState: unknown = window.history.state;
    const browserNavigation = (window as Window & { navigation?: EventTarget })
      .navigation;
    let acceptedTraversal = false;
    const unload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    const navigate = (event: Event) => {
      const navigation = event as Event & { discardConfirmed?: boolean };
      if (event.defaultPrevented || navigation.discardConfirmed) return;
      if (
        !window.confirm(
          "저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 이동할까요?",
        )
      )
        event.preventDefault();
      else navigation.discardConfirmed = true;
    };
    const beforeTraversal = (event: Event) => {
      const navigation = event as Event & {
        navigationType?: string;
        destination?: { sameDocument: boolean };
        discardConfirmed?: boolean;
      };
      if (
        navigation.navigationType !== "traverse" ||
        navigation.destination?.sameDocument === false ||
        !event.cancelable ||
        event.defaultPrevented
      )
        return;
      if (navigation.discardConfirmed) {
        acceptedTraversal = true;
        return;
      }
      if (
        window.confirm(
          "저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 이동할까요?",
        )
      ) {
        acceptedTraversal = true;
        navigation.discardConfirmed = true;
        return;
      }
      // Next can commit its route before popstate. Cancel at navigation start.
      event.preventDefault();
      event.stopImmediatePropagation();
    };
    const popstate = (event: PopStateEvent) => {
      if (acceptedTraversal) {
        acceptedTraversal = false;
        return;
      }
      const navigation = event as PopStateEvent & { discardConfirmed?: boolean };
      if (navigation.discardConfirmed) return;
      if (
        window.confirm(
          "저장하지 않은 변경사항이 있습니다. 변경사항을 버리고 이동할까요?",
        )
      ) {
        navigation.discardConfirmed = true;
        return;
      }
      // Restore the editor entry before Next handles a canceled Back/Forward.
      event.stopImmediatePropagation();
      window.history.pushState(editorHistoryState, "", editorUrl);
    };
    window.addEventListener("beforeunload", unload);
    window.addEventListener("lesson-designer-before-navigate", navigate);
    browserNavigation?.addEventListener("navigate", beforeTraversal);
    window.addEventListener("popstate", popstate, { capture: true });
    return () => {
      window.removeEventListener("beforeunload", unload);
      window.removeEventListener("lesson-designer-before-navigate", navigate);
      browserNavigation?.removeEventListener("navigate", beforeTraversal);
      window.removeEventListener("popstate", popstate, { capture: true });
    };
  }, [dirty]);
}

export function TeacherPlansView(props: WorkspaceViewProps) {
  const planId = decodeURIComponent(
    props.path.split("?")[0].split("/")[3] || "",
  );
  const selected = props.store.plans.find((plan) => plan.id === planId);
  return (
    <section className="workspace-view ws-teacher">
      {planId ? (
        selected ? (
          <PlanEditor key={selected.id} {...props} plan={selected} />
        ) : (
          <>
            <LocalLink
              to="/teacher/plans"
              navigate={props.navigate}
              className="ws-back"
            >
              <ArrowLeft size={16} />
              수업안 목록
            </LocalLink>
            <Empty title="수업안을 찾을 수 없습니다">
              삭제된 수업안이거나 이 브라우저에 저장되지 않은 주소입니다.
            </Empty>
          </>
        )
      ) : (
        <PlanList {...props} />
      )}
    </section>
  );
}

function PlanList({ store, run, navigate }: WorkspaceViewProps) {
  const [query, setQuery] = useState("");
  const [instrument, setInstrument] =
    useState<LessonPlan["instrument"]>("violin");
  const [busy, setBusy] = useState(false);
  const plans = [...store.plans]
    .filter((plan) =>
      normalizeSearch(plan.title).includes(normalizeSearch(query)),
    )
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  async function create() {
    setBusy(true);
    try {
      await run(async (repo) => {
        const plan = await repo.createLessonPlan(instrument);
        navigate(`/teacher/plans/${plan.id}`);
      }, "새 수업안을 만들었습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="ws-heading">
        <div>
          <span className="ws-eyebrow">TEACHER’S DESK</span>
          <h1>나의 수업안</h1>
          <p>도서관의 자료를 모아, 한 시간의 수업으로 엮어보세요.</p>
        </div>
        <span className="ws-count">
          <ClipboardList size={19} />
          {store.plans.length}개의 수업안
        </span>
      </div>
      <div className="ws-storage">
        <span className="ws-status-dot" />이 브라우저에 저장하는 시연용 수업안 ·
        실제 학생 정보를 입력하지 마세요.
      </div>
      <div className="ws-plan-toolbar">
        <label className="ws-search">
          <Search size={18} aria-hidden="true" />
          <input
            aria-label="수업안 제목 검색"
            placeholder="수업안 제목으로 찾아보세요"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="ws-inline">
          <select
            aria-label="새 수업안 악기"
            value={instrument}
            onChange={(event) =>
              setInstrument(event.target.value as LessonPlan["instrument"])
            }
          >
            {INSTRUMENTS.map((id) => (
              <option key={id} value={id}>
                {instrumentLabels[id]}
              </option>
            ))}
          </select>
          <button
            className="ws-button ws-primary"
            type="button"
            disabled={busy}
            onClick={create}
          >
            <Plus size={18} />새 수업안
          </button>
        </div>
      </div>
      <div className="ws-plan-grid">
        {plans.map((plan) => (
          <article className="ws-plan-card" key={plan.id}>
            <div className={`ws-plan-art ws-${plan.instrument}`}>
              <ClipboardList size={37} strokeWidth={1.15} aria-hidden="true" />
              <span>{instrumentLabels[plan.instrument]}</span>
              <span className="ws-art-minutes">
                {plan.durationMinutes}
                <small>분</small>
              </span>
            </div>
            <div className="ws-plan-body">
              <div className="ws-tags">
                <span className="ws-tag">수준 {plan.targetLevel}</span>
                {plan.isDemo && (
                  <span className="ws-tag ws-demo">합성 시연</span>
                )}
              </div>
              <h2>
                <LocalLink to={`/teacher/plans/${plan.id}`} navigate={navigate}>
                  {plan.title || "제목 없는 수업안"}
                </LocalLink>
              </h2>
              <p>{plan.objectives.join(" · ") || "수업 목표를 채워주세요."}</p>
              <div className="ws-plan-bottom">
                <span>
                  {plan.activities.length}개 활동 · {dateLabel(plan.updatedAt)}
                </span>
                <LocalLink
                  to={`/teacher/plans/${plan.id}`}
                  navigate={navigate}
                  className="ws-icon-link"
                >
                  <ArrowRight size={18} />
                  <span className="ws-sr">수업안 편집</span>
                </LocalLink>
              </div>
            </div>
          </article>
        ))}
      </div>
      {plans.length === 0 && (
        <Empty
          title={
            query ? "검색한 수업안이 없습니다" : "첫 수업안을 준비해볼까요?"
          }
        >
          {query
            ? "다른 제목으로 검색하거나 검색어를 지워보세요."
            : "악기를 선택하고 새 수업안을 눌러 시작하세요."}
        </Empty>
      )}
    </>
  );
}

function PlanEditor({
  plan,
  store,
  run,
  navigate,
  notify,
}: WorkspaceViewProps & { plan: LessonPlan }) {
  const [draft, setDraft] = useState(() => clone(plan));
  const [savedSnapshot, setSavedSnapshot] = useState(() =>
    JSON.stringify(plan),
  );
  const [busy, setBusy] = useState(false);
  const [printPreview, setPrintPreview] = useState(false);
  const [referenceActivity, setReferenceActivity] = useState<string | null>(
    null,
  );
  const [selectedUnit, setSelectedUnit] = useState("");
  const [selectedApp, setSelectedApp] = useState("");
  const dirty = JSON.stringify(draft) !== savedSnapshot;
  useUnsavedGuard(dirty);
  const total = totalPlanMinutes(draft);
  const warnings = planWarnings(draft, store);
  const availableUnits = store.units.filter((unit) => {
    const version = store.versions.find((v) => v.id === unit.resourceVersionId);
    const resource = store.resources.find((r) => r.id === version?.resourceId);
    return (
      resource &&
      version &&
      visibleTo(
        resource,
        version,
        resource.datasetKind === "synthetic_demo" ? "demo" : "public",
        store.issues,
        store.units,
      )
    );
  });
  const currentActivity = draft.activities.find(
    (activity) => activity.id === referenceActivity,
  );
  function update<K extends keyof LessonPlan>(key: K, value: LessonPlan[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  function updateActivity(
    id: string,
    values: Partial<LessonPlan["activities"][number]>,
  ) {
    setDraft((current) => ({
      ...current,
      activities: current.activities.map((activity) =>
        activity.id === id ? { ...activity, ...values } : activity,
      ),
    }));
  }
  function move(id: string, direction: -1 | 1) {
    const items = [...draft.activities];
    const index = items.findIndex((activity) => activity.id === id);
    if (index + direction < 0 || index + direction >= items.length) return;
    [items[index], items[index + direction]] = [
      items[index + direction],
      items[index],
    ];
    update("activities", items);
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      await run(async (repo) => {
        const saved = await repo.saveLessonPlan(
          {
            ...draft,
            objectives: draft.objectives
              .map((value) => value.trim())
              .filter(Boolean),
            materials: draft.materials
              .map((value) => value.trim())
              .filter(Boolean),
          },
          draft.revision,
        );
        setDraft(clone(saved));
        setSavedSnapshot(JSON.stringify(saved));
      }, "수업안을 이 브라우저에 저장했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function duplicate() {
    if (busy) return;
    if (dirty) {
      notify("변경사항을 먼저 저장하거나 취소한 후 복제하세요.");
      return;
    }
    setBusy(true);
    try {
      await run(async (repo) => {
        const saved = await repo.duplicateLessonPlan(plan.id);
        navigate(`/teacher/plans/${saved.id}`);
      }, "수업안을 복제했습니다.");
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    if (
      !window.confirm(
        `‘${plan.title}’ 수업안을 삭제할까요? 이 작업은 되돌릴 수 없습니다.`,
      )
    )
      return;
    setBusy(true);
    try {
      await run(async (repo) => {
        await repo.deleteLessonPlan(plan.id, plan.revision);
        setSavedSnapshot(JSON.stringify(draft));
        navigate("/teacher/plans");
      }, "수업안을 삭제했습니다.");
    } finally {
      setBusy(false);
    }
  }
  function addReference() {
    if (!currentActivity || !selectedUnit) return;
    const unit = store.units.find((item) => item.id === selectedUnit);
    const version = store.versions.find(
      (item) => item.id === unit?.resourceVersionId,
    );
    if (!unit || !version) return;
    if (
      currentActivity.resources.some(
        (ref) => ref.unitId === unit.id && ref.versionId === version.id,
      )
    ) {
      notify("이 활동에 이미 담긴 단원입니다.");
      return;
    }
    updateActivity(currentActivity.id, {
      resources: [
        ...currentActivity.resources,
        {
          resourceId: version.resourceId,
          versionId: version.id,
          unitId: unit.id,
        },
      ],
    });
    setSelectedUnit("");
  }
  function addApp() {
    if (!currentActivity || !selectedApp) return;
    if (currentActivity.appLinkIds.includes(selectedApp)) {
      notify("이 활동에 이미 연결한 앱입니다.");
      return;
    }
    updateActivity(currentActivity.id, {
      appLinkIds: [...currentActivity.appLinkIds, selectedApp],
    });
    setSelectedApp("");
  }
  return (
    <>
      <div className="ws-no-print">
        <LocalLink to="/teacher/plans" navigate={navigate} className="ws-back">
          <ArrowLeft size={16} />
          수업안 목록으로
        </LocalLink>
        <div className="ws-heading">
          <div>
            <span className="ws-eyebrow">LESSON PLANNER</span>
            <h1>수업의 흐름을 디자인하세요</h1>
            <p>자료의 판본을 고정하고, 활동마다 교사만의 메모를 남깁니다.</p>
          </div>
          <span className={`ws-save-state ${dirty ? "ws-dirty" : ""}`}>
            {dirty ? (
              "● 저장하지 않은 변경"
            ) : (
              <>
                <Check size={15} /> 저장된 수업안
              </>
            )}
          </span>
        </div>
      </div>
      <form onSubmit={save} className="ws-plan-editor ws-no-print">
        <div className="ws-editor-main">
          <section className="ws-panel">
            <div className="ws-section-heading">
              <h2>수업의 기본 정보</h2>
              <span className="ws-tag ws-demo">합성 시연 · 브라우저 저장</span>
            </div>
            <div className="ws-form-grid">
              <Field label="수업안 제목" wide>
                <input
                  required
                  maxLength={160}
                  value={draft.title}
                  onChange={(event) => update("title", event.target.value)}
                />
              </Field>
              <Field label="악기">
                <select
                  value={draft.instrument}
                  onChange={(event) =>
                    update(
                      "instrument",
                      event.target.value as LessonPlan["instrument"],
                    )
                  }
                >
                  {INSTRUMENTS.map((id) => (
                    <option key={id} value={id}>
                      {instrumentLabels[id]}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="자료 대상 수준">
                <select
                  value={draft.targetLevel}
                  onChange={(event) =>
                    update(
                      "targetLevel",
                      Number(event.target.value) as LessonPlan["targetLevel"],
                    )
                  }
                >
                  {[1, 2, 3].map((level) => (
                    <option key={level} value={level}>
                      수준 {level}
                    </option>
                  ))}
                </select>
              </Field>
              <Field
                label="수업 목표"
                hint="한 줄에 하나씩 입력합니다. 실제 학생 진단이 아닙니다."
                wide
              >
                <textarea
                  required
                  rows={3}
                  value={draft.objectives.join("\n")}
                  onChange={(event) =>
                    update("objectives", event.target.value.split("\n"))
                  }
                />
              </Field>
              <Field label="전체 수업 시간 (분)">
                <input
                  required
                  type="number"
                  min="1"
                  step="1"
                  value={draft.durationMinutes}
                  onChange={(event) =>
                    update("durationMinutes", Number(event.target.value))
                  }
                />
              </Field>
              <Field label="준비물" hint="한 줄에 하나씩 입력합니다.">
                <textarea
                  rows={2}
                  value={draft.materials.join("\n")}
                  onChange={(event) =>
                    update("materials", event.target.value.split("\n"))
                  }
                />
              </Field>
            </div>
          </section>
          <section className="ws-panel">
            <div className="ws-section-heading">
              <h2>활동 구성</h2>
              <span>{draft.activities.length}개 활동</span>
            </div>
            <div className="ws-activity-list">
              {draft.activities.map((activity, index) => (
                <div className="ws-activity" key={activity.id}>
                  <div className="ws-activity-top">
                    <span className="ws-activity-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <select
                      aria-label={`${index + 1}번 활동 단계`}
                      value={activity.phase}
                      onChange={(event) =>
                        updateActivity(activity.id, {
                          phase: event.target.value as keyof typeof phaseLabels,
                        })
                      }
                    >
                      {Object.entries(phaseLabels).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                    <div className="ws-activity-actions">
                      <button
                        type="button"
                        title="활동 위로"
                        aria-label={`${index + 1}번 활동 위로`}
                        disabled={index === 0}
                        onClick={() => move(activity.id, -1)}
                      >
                        <ArrowUp size={16} />
                      </button>
                      <button
                        type="button"
                        title="활동 아래로"
                        aria-label={`${index + 1}번 활동 아래로`}
                        disabled={index === draft.activities.length - 1}
                        onClick={() => move(activity.id, 1)}
                      >
                        <ArrowDown size={16} />
                      </button>
                      <button
                        type="button"
                        title="활동 삭제"
                        aria-label={`${index + 1}번 활동 삭제`}
                        onClick={() =>
                          update(
                            "activities",
                            draft.activities.filter(
                              (item) => item.id !== activity.id,
                            ),
                          )
                        }
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <div className="ws-form-grid">
                    <Field label="활동 제목">
                      <input
                        required
                        value={activity.title}
                        onChange={(event) =>
                          updateActivity(activity.id, {
                            title: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="활동 시간 (분)">
                      <input
                        required
                        type="number"
                        min="1"
                        step="1"
                        value={activity.minutes}
                        onChange={(event) =>
                          updateActivity(activity.id, {
                            minutes: Number(event.target.value),
                          })
                        }
                      />
                    </Field>
                    <Field label="교사 메모">
                      <textarea
                        rows={2}
                        value={activity.teacherNotes}
                        onChange={(event) =>
                          updateActivity(activity.id, {
                            teacherNotes: event.target.value,
                          })
                        }
                      />
                    </Field>
                    <Field label="대체 활동">
                      <textarea
                        rows={2}
                        value={activity.alternative}
                        onChange={(event) =>
                          updateActivity(activity.id, {
                            alternative: event.target.value,
                          })
                        }
                      />
                    </Field>
                  </div>
                  <div className="ws-reference-list">
                    {activity.resources.map((ref, refIndex) => {
                      const resource = store.resources.find(
                        (item) => item.id === ref.resourceId,
                      );
                      const version = store.versions.find(
                        (item) => item.id === ref.versionId,
                      );
                      const unit = store.units.find(
                        (item) => item.id === ref.unitId,
                      );
                      return (
                        <div
                          className="ws-reference"
                          key={`${ref.versionId}-${ref.unitId}`}
                        >
                          <BookOpen size={16} />
                          <span>
                            {resource?.title || "삭제된 자료"}
                            <small>
                              {unit?.title || "단원 없음"} · 판본{" "}
                              {version?.version || ref.versionId}
                              {resource?.publicationState === "on_hold" &&
                                " · 현재 보류됨"}
                            </small>
                          </span>
                          <button
                            type="button"
                            aria-label={`${unit?.title || "자료"} 연결 해제`}
                            onClick={() =>
                              updateActivity(activity.id, {
                                resources: activity.resources.filter(
                                  (_, itemIndex) => itemIndex !== refIndex,
                                ),
                              })
                            }
                          >
                            ×
                          </button>
                        </div>
                      );
                    })}
                    {activity.appLinkIds.map((id) => (
                      <div className="ws-reference" key={id}>
                        <Link2 size={16} />
                        <span>
                          {store.apps.find((app) => app.id === id)?.title ||
                            "앱 없음"}
                          <small>외부 링크 · 연습 완료를 기록하지 않음</small>
                        </span>
                        <button
                          type="button"
                          aria-label="앱 연결 해제"
                          onClick={() =>
                            updateActivity(activity.id, {
                              appLinkIds: activity.appLinkIds.filter(
                                (appId) => appId !== id,
                              ),
                            })
                          }
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <button
                    type="button"
                    className="ws-text-button"
                    onClick={() =>
                      setReferenceActivity(
                        referenceActivity === activity.id ? null : activity.id,
                      )
                    }
                  >
                    <Plus size={15} />
                    자료 · 연습 앱 연결
                  </button>
                  {referenceActivity === activity.id && (
                    <div className="ws-attach-panel">
                      <label>
                        단원 선택
                        <select
                          value={selectedUnit}
                          onChange={(event) =>
                            setSelectedUnit(event.target.value)
                          }
                        >
                          <option value="">자료와 단원을 선택하세요</option>
                          {availableUnits.map((unit) => {
                            const version = store.versions.find(
                              (item) => item.id === unit.resourceVersionId,
                            );
                            const resource = store.resources.find(
                              (item) => item.id === version?.resourceId,
                            );
                            return (
                              <option value={unit.id} key={unit.id}>
                                {resource?.title} · {unit.title} · v
                                {version?.version}
                              </option>
                            );
                          })}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ws-button"
                        disabled={!selectedUnit}
                        onClick={addReference}
                      >
                        단원 담기
                      </button>
                      <label>
                        앱 후보 선택
                        <select
                          value={selectedApp}
                          onChange={(event) =>
                            setSelectedApp(event.target.value)
                          }
                        >
                          <option value="">앱을 선택하세요</option>
                          {store.apps
                            .filter(
                              (app) =>
                                app.instruments.includes(draft.instrument) ||
                                app.scope === "common_tool",
                            )
                            .map((app) => (
                              <option key={app.id} value={app.id}>
                                {app.title} ·{" "}
                                {app.status === "unchecked"
                                  ? "미점검"
                                  : app.status}
                              </option>
                            ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="ws-button"
                        disabled={!selectedApp}
                        onClick={addApp}
                      >
                        앱 연결
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <button
              className="ws-button ws-add-activity"
              type="button"
              onClick={() =>
                update("activities", [
                  ...draft.activities,
                  {
                    id: uid(),
                    phase: "main",
                    title: "",
                    minutes: 5,
                    teacherNotes: "",
                    alternative: "",
                    resources: [],
                    appLinkIds: [],
                  },
                ])
              }
            >
              <Plus size={17} />
              활동 추가
            </button>
          </section>
        </div>
        <aside className="ws-plan-aside">
          <section className="ws-panel ws-summary">
            <span className="ws-eyebrow">LESSON AT A GLANCE</span>
            <h2>시간 구성</h2>
            <div className="ws-time-total">
              <strong>{total}</strong>
              <span>/ {draft.durationMinutes}분</span>
            </div>
            <div className="ws-time-bar" aria-hidden="true">
              {draft.activities.map((activity, index) => (
                <span
                  key={activity.id}
                  style={{
                    flex: Math.max(1, activity.minutes),
                    background: ["#496f62", "#d4b17a", "#708ca3", "#bb8067"][
                      index % 4
                    ],
                  }}
                />
              ))}
            </div>
            <ol className="ws-time-legend">
              {draft.activities.map((activity, index) => (
                <li key={activity.id}>
                  <span>
                    {String(index + 1).padStart(2, "0")}{" "}
                    {activity.title || "새 활동"}
                  </span>
                  <b>{activity.minutes}분</b>
                </li>
              ))}
            </ol>
            {total !== draft.durationMinutes && (
              <p className="ws-warning" role="alert">
                전체 시간과 활동 합계가{" "}
                {Math.abs(total - draft.durationMinutes)}분 다릅니다. 시간을
                조정해주세요.
              </p>
            )}
            <SaveButton busy={busy}>수업안 저장</SaveButton>
            <button
              className="ws-button"
              type="button"
              onClick={() => {
                if (
                  total !== draft.durationMinutes ||
                  !draft.title.trim() ||
                  !draft.objectives.some((item) => item.trim())
                ) {
                  notify("제목, 목표와 활동 시간 합계를 먼저 확인해주세요.");
                  return;
                }
                setPrintPreview(!printPreview);
              }}
            >
              <Printer size={17} />
              출력 미리보기
            </button>
            <button
              className="ws-text-button"
              type="button"
              disabled={!dirty}
              onClick={() => {
                setDraft(clone(plan));
                setSavedSnapshot(JSON.stringify(plan));
                notify("저장된 값으로 되돌렸습니다.");
              }}
            >
              저장하지 않은 변경 취소
            </button>
          </section>
          {warnings.length > 0 && (
            <section className="ws-panel ws-warning-panel">
              <h3>자료 사용 확인</h3>
              <ul>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </section>
          )}
          <div className="ws-sub-actions">
            <button
              className="ws-text-button"
              disabled={busy}
              type="button"
              onClick={duplicate}
            >
              <Copy size={15} />
              복제
            </button>
            <button
              className="ws-text-button ws-danger"
              disabled={busy}
              type="button"
              onClick={remove}
            >
              <Trash2 size={15} />
              삭제
            </button>
          </div>
          <p className="ws-small">
            마지막 저장 {dateLabel(plan.updatedAt)}
            <br />
            revision {draft.revision} · 자료 판본은 자동 변경되지 않습니다.
          </p>
        </aside>
      </form>
      <div className={printPreview ? "ws-print-preview" : "ws-print-hidden"}>
        {printPreview && (
          <div className="ws-preview-actions ws-no-print">
            <h2>출력 미리보기</h2>
            <div className="ws-inline">
              <button
                type="button"
                className="ws-button"
                onClick={() => setPrintPreview(false)}
              >
                미리보기 닫기
              </button>
              <button
                type="button"
                className="ws-button ws-primary"
                onClick={() => window.print()}
              >
                <Printer size={17} />
                인쇄
              </button>
            </div>
          </div>
        )}
        <PlanPrint plan={draft} store={store} />
      </div>
    </>
  );
}

function PlanPrint({
  plan,
  store,
}: {
  plan: LessonPlan;
  store: RepositoryState;
}) {
  return (
    <article className="ws-print-sheet">
      <div className="ws-print-watermark">
        합성 시연용 수업안 · 교육 내용 검수 전
      </div>
      <p className="ws-eyebrow">레슨 디자이너 · 클래식 악기 교육 전자도서관</p>
      <h1>{plan.title}</h1>
      <p>
        {instrumentLabels[plan.instrument]} · 수준 {plan.targetLevel} · 전체{" "}
        {plan.durationMinutes}분
      </p>
      <h2>수업 목표</h2>
      <ul>
        {plan.objectives.filter(Boolean).map((goal, index) => (
          <li key={index}>{goal}</li>
        ))}
      </ul>
      <p>
        <strong>준비물</strong>{" "}
        {plan.materials.filter(Boolean).join(", ") || "없음"}
      </p>
      {plan.activities.map((activity, index) => (
        <section key={activity.id}>
          <h2>
            {index + 1}. {phaseLabels[activity.phase]} · {activity.title}{" "}
            <span>{activity.minutes}분</span>
          </h2>
          {activity.teacherNotes && <p>{activity.teacherNotes}</p>}
          {activity.alternative && (
            <p>
              <strong>대체 활동:</strong> {activity.alternative}
            </p>
          )}
          {activity.resources.map((ref) => {
            const resource = store.resources.find(
              (item) => item.id === ref.resourceId,
            );
            const version = store.versions.find(
              (item) => item.id === ref.versionId,
            );
            const unit = store.units.find((item) => item.id === ref.unitId);
            const asset = store.readingAssets.find(
              (item) => item.resourceVersionId === ref.versionId,
            );
            const printable = !!(
              version &&
              resource &&
              asset &&
              canPrint(resource, version, asset, store.issues)
            );
            return (
              <div
                className="ws-print-source"
                key={`${ref.versionId}-${ref.unitId}`}
              >
                <p>
                  <strong>참조 자료:</strong>{" "}
                  {resource?.title || ref.resourceId} · 판본{" "}
                  {version?.version || ref.versionId} ·{" "}
                  {unit?.title || ref.unitId}
                </p>
                <p>
                  출처:{" "}
                  {resource?.sourceRefs
                    .map(
                      (source) =>
                        `${source.title}${source.chapter ? `, ${source.chapter}` : ""}${source.pageRange ? `, ${source.pageRange}쪽` : ""}${source.url ? ` (${source.url})` : ""}`,
                    )
                    .join(" / ") || "출처 확인 필요"}
                </p>
                <p>
                  {resource?.datasetKind === "synthetic_demo"
                    ? "자체 제작 합성 데모 · 실제 교재 본문 아님"
                    : "교육 내용 검수 전"}{" "}
                  · {rightsLabels[version?.rights.state || "unknown"]}
                </p>
                {printable ? (
                  unit?.blocks
                    .filter((block) => block.type === "paragraph")
                    .map((block) => <p key={block.id}>{block.text}</p>)
                ) : (
                  <p className="ws-print-restriction">
                    인쇄권 미확인 또는 자료 보류로 본문·이미지를 제외하고
                    메타데이터만 출력합니다.
                  </p>
                )}
              </div>
            );
          })}
          {activity.appLinkIds.map((id) => {
            const app = store.apps.find((item) => item.id === id);
            return (
              <p key={id}>
                외부 앱 참고: {app?.title || id} · {app?.url || "주소 없음"} ·
                실행/정확성 미보증
              </p>
            );
          })}
        </section>
      ))}
      <footer>
        이 브라우저의 로컬 시연 자료 · revision {plan.revision} · 출력일{" "}
        {new Date().toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
        <br />
        실제 전문가 승인이나 교육 효과 검증을 의미하지 않습니다.
      </footer>
    </article>
  );
}

export function AdminView(props: WorkspaceViewProps) {
  const pathname = props.path.split("?")[0];
  const tab = pathname.startsWith("/admin/reviews")
    ? "reviews"
    : pathname.split("/")[2] || "resources";
  return (
    <section className="workspace-view ws-admin">
      <div className="ws-heading">
        <div>
          <span className="ws-eyebrow">EDITORIAL WORKSPACE</span>
          <h1>자료 관리실</h1>
          <p>출처와 권리, 검수의 과정을 빠짐없이 기록합니다.</p>
        </div>
        <span className="ws-count">
          <ShieldCheck size={19} />
          시연용 관리 화면
        </span>
      </div>
      <div className="ws-admin-notice">
        <ShieldCheck size={19} aria-hidden="true" />
        <p>
          <strong>가상 역할로 살펴보는 관리 화면입니다.</strong> 역할 전환은
          실제 인증이 아닙니다. 직접 URL과 새로고침으로 접근할 수 있으며, 이
          브라우저의 기록은 위·변조 방지 감사 증거가 아닙니다.
        </p>
      </div>
      <AdminStats store={props.store} />
      <nav className="ws-tabs" aria-label="관리 메뉴">
        {[
          ["resources", "자료 메타데이터"],
          ["apps", "앱 후보 37"],
          ["mapping", "19개 항목 · 24개 기획"],
          ["issues", "오류 신고"],
          ["reviews", "검수 · 판본"],
        ].map(([id, label]) => (
          <LocalLink
            key={id}
            to={
              id === "reviews"
                ? `/admin/reviews/${props.store.resources.find((resource) => resource.datasetKind === "synthetic_demo")?.id || ""}`
                : `/admin/${id}`
            }
            navigate={props.navigate}
            className={tab === id ? "active" : ""}
          >
            {label}
          </LocalLink>
        ))}
      </nav>
      {tab === "resources" ? (
        <ResourceManagement {...props} />
      ) : tab === "apps" ? (
        <AppManagement {...props} />
      ) : tab === "mapping" ? (
        <MappingView store={props.store} />
      ) : tab === "issues" ? (
        <IssuesView {...props} />
      ) : (
        <ReviewView
          key={pathname}
          {...props}
          resourceId={decodeURIComponent(pathname.split("/")[3] || "")}
        />
      )}
    </section>
  );
}

function ResourceManagement(props: WorkspaceViewProps) {
  const [query, setQuery] = useState("");
  const [instrument, setInstrument] = useState("all");
  const [selected, setSelected] = useState(props.store.resources[0]?.id || "");
  const filtered = props.store.resources.filter(
    (resource) =>
      (instrument === "all" || resource.instrument === instrument) &&
      normalizeSearch(
        `${resource.title} ${resource.topics.join(" ")} ${resource.description}`,
      ).includes(normalizeSearch(query)),
  );
  const resource = props.store.resources.find((item) => item.id === selected);
  const version = props.store.versions.find(
    (item) => item.id === resource?.currentDraftVersionId,
  );
  return (
    <>
      <div className="ws-management-toolbar">
        <label className="ws-search">
          <Search size={17} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="제목 · 주제 · 설명 검색"
            aria-label="관리 자료 검색"
          />
        </label>
        <select
          aria-label="관리 자료 악기"
          value={instrument}
          onChange={(event) => setInstrument(event.target.value)}
        >
          <option value="all">모든 악기</option>
          {INSTRUMENTS.map((id) => (
            <option value={id} key={id}>
              {instrumentLabels[id]}
            </option>
          ))}
        </select>
        <span>{filtered.length}개 자료</span>
      </div>
      <div className="ws-management-layout">
        <aside className="ws-resource-list" aria-label="편집할 자료 선택">
          {filtered.map((item) => {
            const current = props.store.versions.find(
              (v) => v.id === item.currentDraftVersionId,
            );
            return (
              <button
                type="button"
                key={item.id}
                aria-pressed={selected === item.id}
                className={selected === item.id ? "active" : ""}
                onClick={() => {
                  if (canLeaveEditor()) setSelected(item.id);
                }}
              >
                <span className="ws-list-eyebrow">
                  {instrumentLabels[item.instrument]} ·{" "}
                  {item.datasetKind === "synthetic_demo"
                    ? "합성 데모"
                    : "미검수 원자료"}
                </span>
                <strong>{item.title}</strong>
                <small>
                  {reviewLabels[current?.reviewState || "draft"]} ·{" "}
                  {rightsLabels[current?.rights.state || "unknown"]}
                </small>
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="ws-small">검색 결과가 없습니다.</p>
          )}
        </aside>
        {resource && version ? (
          <ResourceEditor
            key={`${resource.id}-${resource.revision}-${version.revision}`}
            {...props}
            resource={resource}
            version={version}
          />
        ) : (
          <Empty title="자료를 선택하세요">
            왼쪽 목록에서 편집할 자료를 선택합니다.
          </Empty>
        )}
      </div>
    </>
  );
}

function ResourceEditor({
  resource,
  version,
  store,
  run,
  navigate,
}: WorkspaceViewProps & { resource: Resource; version: ResourceVersion }) {
  const [draft, setDraft] = useState(() => clone(resource));
  const [rights, setRights] = useState(() => clone(version.rights));
  const [busy, setBusy] = useState(false);
  const blockers = publishBlockers(
    version,
    resource,
    store.issues,
    store.units,
  );
  const dirty =
    JSON.stringify(draft) !== JSON.stringify(resource) ||
    JSON.stringify(rights) !== JSON.stringify(version.rights);
  useUnsavedGuard(dirty);
  const immutable = version.reviewState === "approved";
  const units = store.units
    .filter((unit) => unit.resourceVersionId === version.id)
    .sort((a, b) => a.order - b.order);
  function update<K extends keyof Resource>(key: K, value: Resource[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  async function save(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      await run(async (repo) => {
        if (JSON.stringify(draft) !== JSON.stringify(resource))
          await repo.updateResource(draft, resource.revision);
        if (JSON.stringify(rights) !== JSON.stringify(version.rights))
          await repo.updateRights(version.id, rights, version.revision);
      }, "자료 메타데이터와 권리 기록을 저장했습니다.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="ws-resource-editor">
      <div className="ws-section-heading">
        <div>
          <h2>{resource.title}</h2>
          <p className="ws-small">
            {resource.datasetKind === "synthetic_demo"
              ? "자체 제작 합성 시연"
              : "원자료 메타데이터 · 실제 교재 본문 미확인"}{" "}
            · v{version.version} · revision {version.revision}
          </p>
        </div>
        <LocalLink
          to={`/admin/reviews/${resource.id}`}
          navigate={navigate}
          className="ws-button"
        >
          <FileCheck2 size={16} />
          검수 화면
        </LocalLink>
      </div>
      <div className="ws-publication-state">
        <span className="ws-tag">{reviewLabels[version.reviewState]}</span>
        <span className="ws-tag">{rightsLabels[version.rights.state]}</span>
        <span className="ws-tag">
          {resource.publicationState === "published"
            ? "공개 상태"
            : resource.publicationState === "on_hold"
              ? "자료 보류"
              : "비공개"}
        </span>
      </div>
      {immutable && (
        <p className="ws-warning">
          승인된 교육 내용은 보존합니다. 권리 확인은 별도 기록하며, 본문 수정은
          새 초안에서 진행하세요.
        </p>
      )}
      <form className="ws-panel" onSubmit={save}>
        <fieldset disabled={busy || immutable}>
          <legend className="ws-legend">기본 메타데이터</legend>
          <div className="ws-form-grid">
            <Field label="자료 제목" wide>
              <input
                required
                value={draft.title}
                onChange={(event) => update("title", event.target.value)}
              />
            </Field>
            <Field label="악기">
              <select
                value={draft.instrument}
                onChange={(event) =>
                  update(
                    "instrument",
                    event.target.value as Resource["instrument"],
                  )
                }
              >
                {INSTRUMENTS.map((id) => (
                  <option value={id} key={id}>
                    {instrumentLabels[id]}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="악기체계">
              <input
                required
                value={draft.instrumentSystem}
                onChange={(event) =>
                  update("instrumentSystem", event.target.value)
                }
              />
            </Field>
            <Field label="자료 종류">
              <select
                value={draft.kind}
                onChange={(event) =>
                  update("kind", event.target.value as Resource["kind"])
                }
              >
                {Object.entries(kindLabels).map(([id, label]) => (
                  <option value={id} key={id}>
                    {label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="난이도 (1–3)">
              <input
                required
                type="number"
                min="1"
                max="3"
                step="1"
                value={draft.level}
                onChange={(event) =>
                  update(
                    "level",
                    Number(event.target.value) as Resource["level"],
                  )
                }
              />
            </Field>
            <Field label="설명" wide>
              <textarea
                rows={3}
                value={draft.description}
                onChange={(event) => update("description", event.target.value)}
              />
            </Field>
            <Field label="교육 목표 (한 줄에 하나)">
              <textarea
                rows={3}
                value={draft.objectives.join("\n")}
                onChange={(event) =>
                  update("objectives", event.target.value.split("\n"))
                }
              />
            </Field>
            <Field label="주제어 (한 줄에 하나)">
              <textarea
                rows={3}
                value={draft.topics.join("\n")}
                onChange={(event) =>
                  update("topics", event.target.value.split("\n"))
                }
              />
            </Field>
            <Field label="선수 학습 (한 줄에 하나)">
              <textarea
                rows={2}
                value={draft.prerequisites.join("\n")}
                onChange={(event) =>
                  update("prerequisites", event.target.value.split("\n"))
                }
              />
            </Field>
            <Field label="예상 시간 (분)">
              <input
                required
                type="number"
                min="1"
                step="1"
                value={draft.estimatedMinutes}
                onChange={(event) =>
                  update("estimatedMinutes", Number(event.target.value))
                }
              />
            </Field>
          </div>
          <div className="ws-subsection">
            <h3>출처 기록</h3>
            {draft.sourceRefs.map((source, index) => (
              <div className="ws-source-edit ws-form-grid" key={source.id}>
                <Field label={`출처 ${index + 1} 제목`}>
                  <input
                    value={source.title}
                    onChange={(event) =>
                      update(
                        "sourceRefs",
                        draft.sourceRefs.map((item, n) =>
                          n === index
                            ? { ...item, title: event.target.value }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="출처 URL (없으면 비워두기)">
                  <input
                    type="url"
                    value={source.url || ""}
                    onChange={(event) =>
                      update(
                        "sourceRefs",
                        draft.sourceRefs.map((item, n) =>
                          n === index
                            ? { ...item, url: event.target.value || null }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="장·단원">
                  <input
                    value={source.chapter || ""}
                    onChange={(event) =>
                      update(
                        "sourceRefs",
                        draft.sourceRefs.map((item, n) =>
                          n === index
                            ? { ...item, chapter: event.target.value || null }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <Field label="쪽 범위">
                  <input
                    value={source.pageRange || ""}
                    onChange={(event) =>
                      update(
                        "sourceRefs",
                        draft.sourceRefs.map((item, n) =>
                          n === index
                            ? { ...item, pageRange: event.target.value || null }
                            : item,
                        ),
                      )
                    }
                  />
                </Field>
                <button
                  type="button"
                  className="ws-text-button ws-danger"
                  onClick={() =>
                    update(
                      "sourceRefs",
                      draft.sourceRefs.filter((_, n) => n !== index),
                    )
                  }
                >
                  이 출처 제거
                </button>
              </div>
            ))}
            <button
              type="button"
              className="ws-text-button"
              onClick={() =>
                update("sourceRefs", [
                  ...draft.sourceRefs,
                  {
                    id: uid(),
                    title: "",
                    url: null,
                    chapter: null,
                    pageRange: null,
                  },
                ])
              }
            >
              <Plus size={15} />
              출처 추가
            </button>
          </div>
        </fieldset>
        <fieldset disabled={busy}>
          <div className="ws-subsection">
            <h3>권리 검토 · 음악 내용 검수와 별도</h3>
            <RightsEditor rights={rights} onChange={setRights} />
          </div>
          <div className="ws-form-actions">
            <button
              type="button"
              className="ws-button"
              onClick={() => {
                setDraft(clone(resource));
                setRights(clone(version.rights));
              }}
            >
              변경 취소
            </button>
            <SaveButton busy={busy} />
          </div>
        </fieldset>
      </form>
      <section className="ws-panel">
        <h3>실제 자료 공개 전 확인</h3>
        {blockers.length ? (
          <ul className="ws-blockers">
            {blockers.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="ws-success">
            공개 조건을 충족했습니다. 공개 명령은 검수 화면에서 실행합니다.
          </p>
        )}
        <p className="ws-small">
          합성 데모는 실제 승인 콘텐츠와 별도로 표시합니다. PDF 파일·쪽수·표지는
          검증된 자산만 사용합니다.
        </p>
        <div className="ws-asset-list">
          {store.readingAssets
            .filter((asset) => asset.resourceVersionId === version.id)
            .map((asset) => (
              <div key={asset.id}>
                <strong>
                  {asset.format === "structured"
                    ? "구조화 단원"
                    : asset.format.toUpperCase()}
                </strong>
                <span>
                  {asset.availability === "available"
                    ? "준비됨"
                    : "준비 중 / 이용 불가"}{" "}
                  ·{" "}
                  {asset.pageCount === null
                    ? "쪽수 미확인"
                    : `${asset.pageCount}쪽`}
                </span>
              </div>
            ))}
        </div>
      </section>
      <section className="ws-panel">
        <h3>단원과 연습 앱 연결</h3>
        {units.map((unit) => (
          <UnitEditor
            key={`${unit.id}-${version.revision}`}
            unit={unit}
            version={version}
            store={store}
            run={run}
          />
        ))}
        {!units.length && (
          <p className="ws-small">실제 본문과 단원 자산은 준비 전입니다.</p>
        )}
      </section>
      <AssetMetadataEditor
        key={JSON.stringify([
          store.bookPresentations.filter(
            (item) => item.resourceVersionId === version.id,
          ),
          store.readingAssets.filter(
            (item) => item.resourceVersionId === version.id,
          ),
        ])}
        resource={resource}
        version={version}
        store={store}
        run={run}
      />
    </div>
  );
}

function AdminStats({ store }: { store: RepositoryState }) {
  const realPublished = store.resources.filter((resource) => {
    const version = store.versions.find(
      (item) => item.id === resource.publishedVersionId,
    );
    return (
      version &&
      resource.datasetKind === "reviewed_real" &&
      canPublish(version, resource, store.issues, store.units)
    );
  }).length;
  const demoPublished = store.resources.filter((resource) => {
    const version = store.versions.find(
      (item) => item.id === resource.publishedVersionId,
    );
    return (
      version &&
      resource.datasetKind === "synthetic_demo" &&
      visibleTo(resource, version, "demo", store.issues, store.units)
    );
  }).length;
  return (
    <div className="ws-admin-stats">
      <div>
        <strong>{realPublished}</strong>
        <span>실제 승인 · 공개 자료</span>
      </div>
      <div>
        <strong>{demoPublished}</strong>
        <span>합성 시연 서고 자료</span>
      </div>
      <div>
        <strong>{store.legacyEntries.length}</strong>
        <span>미검수 출발 항목</span>
      </div>
      <div>
        <strong>{store.apps.length}</strong>
        <span>원본 앱 후보 주소</span>
      </div>
    </div>
  );
}

function AssetMetadataEditor({
  resource,
  version,
  store,
  run,
}: {
  resource: Resource;
  version: ResourceVersion;
  store: RepositoryState;
  run: WorkspaceViewProps["run"];
}) {
  const originalPresentation = store.bookPresentations.find(
    (item) => item.resourceVersionId === version.id,
  );
  const [presentation, setPresentation] = useState<BookPresentation>(() =>
    clone(
      originalPresentation || {
        resourceId: resource.id,
        resourceVersionId: version.id,
        coverAssetId: null,
        coverOrigin: "generated_typography",
        shelfOrder: null,
        displayTitle: resource.title,
      },
    ),
  );
  const [busy, setBusy] = useState(false);
  const assets = store.readingAssets.filter(
    (item) => item.resourceVersionId === version.id,
  );
  useUnsavedGuard(
    JSON.stringify(presentation) !==
      JSON.stringify(
        originalPresentation || {
          resourceId: resource.id,
          resourceVersionId: version.id,
          coverAssetId: null,
          coverOrigin: "generated_typography",
          shelfOrder: null,
          displayTitle: resource.title,
        },
      ),
  );
  return (
    <section className="ws-panel">
      <h3>책 표지와 열람 자산</h3>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await run(
              (repo) => repo.updateBookPresentation(presentation),
              "책 표지 메타데이터를 저장했습니다.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={busy}>
          <div className="ws-form-grid">
            <Field label="책장에 표시할 제목">
              <input
                required
                value={presentation.displayTitle}
                onChange={(event) =>
                  setPresentation({
                    ...presentation,
                    displayTitle: event.target.value,
                  })
                }
              />
            </Field>
            <Field label="표지 방식">
              <select
                value={presentation.coverOrigin}
                onChange={(event) =>
                  setPresentation({
                    ...presentation,
                    coverOrigin: event.target
                      .value as BookPresentation["coverOrigin"],
                  })
                }
              >
                <option value="generated_typography">
                  직접 만든 타이포그래피 표지
                </option>
                <option value="none">제목 텍스트 대체</option>
                {presentation.coverOrigin === "provided" && (
                  <option value="provided" disabled>
                    검증된 제공 표지
                  </option>
                )}
              </select>
            </Field>
            <Field label="책장 정렬 순서 (없으면 비워두기)">
              <input
                type="number"
                min="0"
                step="1"
                value={presentation.shelfOrder ?? ""}
                onChange={(event) =>
                  setPresentation({
                    ...presentation,
                    shelfOrder:
                      event.target.value === ""
                        ? null
                        : Number(event.target.value),
                  })
                }
              />
            </Field>
            <div className="ws-field">
              <span>검증된 표지 자산</span>
              <p className="ws-small">
                {presentation.coverAssetId ||
                  "없음 · 외부 이미지 자동 수집 안 함"}
              </p>
            </div>
          </div>
          <div className="ws-form-actions">
            <button
              type="button"
              className="ws-button"
              onClick={() =>
                setPresentation(
                  clone(
                    originalPresentation || {
                      ...presentation,
                      displayTitle: resource.title,
                      coverOrigin: "generated_typography",
                    },
                  ),
                )
              }
            >
              표지 변경 취소
            </button>
            <SaveButton busy={busy}>표지 정보 저장</SaveButton>
          </div>
        </fieldset>
      </form>
      <div className="ws-subsection">
        <h3>자산 준비 상태 · 자산별 이용 권한</h3>
        <p className="ws-small">
          현재 구조화 단원을 사용합니다. 실제 PDF 파일·쪽수·체크섬은 검사 전까지
          비워둡니다. 변환 완료가 검수 승인이나 이용 허락을 뜻하지 않습니다.
        </p>
        {assets.map((asset) => (
          <ReadingAssetEditor
            key={JSON.stringify(asset)}
            asset={asset}
            version={version}
            run={run}
          />
        ))}
        {!assets.length && (
          <p className="ws-warning">
            연결된 열람 자산이 없습니다. 실제 교재 본문·PDF를 제공하지 않습니다.
          </p>
        )}
      </div>
    </section>
  );
}

function ReadingAssetEditor({
  asset,
  version,
  run,
}: {
  asset: ReadingAsset;
  version: ResourceVersion;
  run: WorkspaceViewProps["run"];
}) {
  const [draft, setDraft] = useState(() => clone(asset));
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(JSON.stringify(draft) !== JSON.stringify(asset));
  return (
    <form
      className="ws-asset-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await run(
            (repo) => repo.updateReadingAsset(draft),
            "열람 자산 메타데이터를 저장했습니다.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <fieldset disabled={busy}>
        <div className="ws-section-heading">
          <strong>
            {asset.format === "structured"
              ? "구조화 단원 자산"
              : asset.format === "pptx_source"
                ? "PPTX 원자료 · PDF 아님"
                : "PDF 자산"}
          </strong>
          <code>{asset.id}</code>
        </div>
        <div className="ws-form-grid">
          <Field label="자산 준비 상태">
            <select
              value={draft.availability}
              onChange={(event) =>
                setDraft({
                  ...draft,
                  availability: event.target
                    .value as ReadingAsset["availability"],
                })
              }
            >
              <option value="missing">파일 미준비</option>
              <option value="processing">준비 중 (완료 미확인)</option>
              {(asset.format === "structured" ||
                asset.availability === "available") && (
                <option value="available">
                  {asset.format === "structured"
                    ? "구조화 단원 준비됨"
                    : "검사된 기존 파일 준비됨"}
                </option>
              )}
              <option value="failed">준비 실패</option>
              <option value="on_hold">열람 보류</option>
            </select>
          </Field>
          <div className="ws-field">
            <span>검사된 파일 정보 (읽기 전용)</span>
            <p className="ws-small">
              파일: {asset.fileRef || "없음"}
              <br />
              쪽수: {asset.pageCount ?? "미확인"}
              <br />
              체크섬: {asset.checksum || "미확인"}
            </p>
          </div>
        </div>
        <div className="ws-checkboxes">
          {(
            [
              ["allowView", "자산 열람"],
              ["allowPrint", "자산 인쇄"],
              ["allowDownload", "자산 다운로드"],
            ] as const
          ).map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={draft.rights[key]}
                disabled={
                  !version.rights[key] ||
                  (key === "allowDownload" &&
                    (!asset.fileRef || asset.format === "structured"))
                }
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    rights: { ...draft.rights, [key]: event.target.checked },
                  })
                }
              />
              {label} 허용
            </label>
          ))}
        </div>
        <p className="ws-small">
          자료 판본의 권리 허용 범위를 넘을 수 없습니다. 다운로드할 파일이 없는
          경우 다운로드 권한을 켤 수 없습니다.
        </p>
        <div className="ws-form-actions">
          <button
            type="button"
            className="ws-button"
            onClick={() => setDraft(clone(asset))}
          >
            자산 변경 취소
          </button>
          <SaveButton busy={busy}>자산 정보 저장</SaveButton>
        </div>
      </fieldset>
    </form>
  );
}

function RightsEditor({
  rights,
  onChange,
}: {
  rights: RightsRecord;
  onChange: (rights: RightsRecord) => void;
}) {
  return (
    <div className="ws-form-grid">
      <Field label="권리 상태">
        <select
          value={rights.state}
          onChange={(event) =>
            onChange({
              ...rights,
              state: event.target.value as RightsRecord["state"],
            })
          }
        >
          {Object.entries(rightsLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </Field>
      <Field label="권리자">
        <input
          value={rights.holder || ""}
          onChange={(event) =>
            onChange({ ...rights, holder: event.target.value || null })
          }
        />
      </Field>
      <Field label="이용 허락·라이선스">
        <input
          value={rights.license || ""}
          onChange={(event) =>
            onChange({ ...rights, license: event.target.value || null })
          }
        />
      </Field>
      <Field label="권리 확인 근거">
        <input
          value={rights.evidenceRef || ""}
          onChange={(event) =>
            onChange({ ...rights, evidenceRef: event.target.value || null })
          }
        />
      </Field>
      <Field label="확인 담당 표시명">
        <input
          value={rights.checkedBy || ""}
          onChange={(event) =>
            onChange({ ...rights, checkedBy: event.target.value || null })
          }
        />
      </Field>
      <Field label="확인일">
        <input
          type="date"
          value={rights.checkedAt?.slice(0, 10) || ""}
          onChange={(event) =>
            onChange({
              ...rights,
              checkedAt: event.target.value
                ? `${event.target.value}T00:00:00.000Z`
                : null,
            })
          }
        />
      </Field>
      <div className="ws-checkboxes ws-wide">
        {(
          [
            ["allowView", "열람"],
            ["allowPrint", "인쇄"],
            ["allowDownload", "다운로드"],
            ["allowRedistribute", "재배포"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={rights[key]}
              onChange={(event) =>
                onChange({ ...rights, [key]: event.target.checked })
              }
            />
            {label} 허용
          </label>
        ))}
      </div>
    </div>
  );
}

function UnitEditor({
  unit,
  version,
  store,
  run,
}: {
  unit: Unit;
  version: ResourceVersion;
  store: RepositoryState;
  run: WorkspaceViewProps["run"];
}) {
  const [draft, setDraft] = useState(() => clone(unit));
  const [busy, setBusy] = useState(false);
  return (
    <details className="ws-unit-editor">
      <summary>
        {unit.order}. {unit.title}
        <span>{unit.appLinkIds.length}개 앱 연결</span>
      </summary>
      <form
        onSubmit={async (event) => {
          event.preventDefault();
          setBusy(true);
          try {
            await run(
              (repo) => repo.updateUnit(draft, version.revision),
              "단원 메타데이터를 저장했습니다.",
            );
          } finally {
            setBusy(false);
          }
        }}
      >
        <fieldset disabled={version.reviewState === "approved" || busy}>
          <Field label="단원 제목">
            <input
              required
              value={draft.title}
              onChange={(event) =>
                setDraft({ ...draft, title: event.target.value })
              }
            />
          </Field>
          <Field label="단원 순서">
            <input
              type="number"
              min="1"
              step="1"
              value={draft.order}
              onChange={(event) =>
                setDraft({ ...draft, order: Number(event.target.value) })
              }
            />
          </Field>
          <div className="ws-checkboxes">
            {store.apps
              .filter(
                (app) =>
                  app.scope === "mvp_candidate" || app.scope === "common_tool",
              )
              .map((app) => (
                <label key={app.id}>
                  <input
                    type="checkbox"
                    checked={draft.appLinkIds.includes(app.id)}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        appLinkIds: event.target.checked
                          ? [...draft.appLinkIds, app.id]
                          : draft.appLinkIds.filter((id) => id !== app.id),
                      })
                    }
                  />
                  {app.title}
                </label>
              ))}
          </div>
          <p className="ws-small">
            본문: {unit.blocks.length}개 구조화 블록 · 외부 HTML을 실행하지
            않습니다.
          </p>
          <SaveButton busy={busy}>단원 연결 저장</SaveButton>
        </fieldset>
      </form>
    </details>
  );
}

function AppManagement(props: WorkspaceViewProps) {
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState(props.store.apps[0]?.id || "");
  const filtered = props.store.apps.filter(
    (app) =>
      (scope === "all" || app.scope === scope) &&
      (status === "all" || app.status === status) &&
      normalizeSearch(
        `${app.title} ${app.url} ${app.instruments.map((id) => instrumentLabels[id]).join(" ")} ${app.instrumentSystem || ""}`,
      ).includes(normalizeSearch(query)),
  );
  const app = props.store.apps.find((item) => item.id === selected);
  return (
    <>
      <div className="ws-inline-notice">
        원본 목록 {props.store.apps.length}개 후보 · URL을 보관한 목록이며 실제
        실행·안전·내용 정확성 검증과 다릅니다.
      </div>
      <div className="ws-management-toolbar">
        <label className="ws-search">
          <Search size={17} />
          <input
            aria-label="앱 후보 검색"
            placeholder="제목 · URL · 악기 · 체계 검색"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <select
          aria-label="앱 후보 범위"
          value={scope}
          onChange={(event) => setScope(event.target.value)}
        >
          <option value="all">모든 분류</option>
          <option value="mvp_candidate">4악기 후보</option>
          <option value="common_tool">공통 도구</option>
          <option value="other">그 외 보관</option>
          <option value="excluded_mismatch">체계 불일치 제외</option>
        </select>
        <select
          aria-label="앱 점검 상태"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">모든 점검 상태</option>
          <option value="unchecked">미점검</option>
          <option value="available">수동 점검: 이용 가능</option>
          <option value="broken">연결 오류</option>
          <option value="restricted">접근 제한</option>
        </select>
        <span>{filtered.length}개</span>
      </div>
      <div className="ws-management-layout">
        <aside
          className="ws-resource-list ws-app-list"
          aria-label="편집할 앱 후보 선택"
        >
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={selected === item.id ? "active" : ""}
              aria-pressed={selected === item.id}
              onClick={() => {
                if (canLeaveEditor()) setSelected(item.id);
              }}
            >
              <span className="ws-list-eyebrow">
                {item.enabled ? "활성" : "비활성"} ·{" "}
                {item.status === "unchecked" ? "미점검" : item.status}
              </span>
              <strong>{item.title}</strong>
              <small>{item.url}</small>
            </button>
          ))}
        </aside>
        {app ? (
          <AppEditor
            key={`${app.id}-${JSON.stringify(app)}`}
            app={app}
            {...props}
          />
        ) : (
          <Empty title="앱 후보를 선택하세요">
            모든 주소는 수동 점검 전까지 미점검으로 유지합니다.
          </Empty>
        )}
      </div>
    </>
  );
}

function AppEditor({ app, store, run }: WorkspaceViewProps & { app: AppLink }) {
  const [draft, setDraft] = useState(() => clone(app));
  const [busy, setBusy] = useState(false);
  useUnsavedGuard(JSON.stringify(draft) !== JSON.stringify(app));
  const blockers = appBlockers(draft);
  function update<K extends keyof AppLink>(key: K, value: AppLink[K]) {
    setDraft((current) => ({ ...current, [key]: value }));
  }
  return (
    <form
      className="ws-panel ws-app-editor"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        try {
          await run(
            (repo) => repo.updateApp(draft),
            "앱 후보 메타데이터를 저장했습니다.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="ws-section-heading">
        <h2>{app.title}</h2>
        <span className="ws-tag">자동 링크 검사 없음</span>
      </div>
      <div className="ws-form-grid">
        <Field label="앱 제목" wide>
          <input
            required
            value={draft.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </Field>
        <Field
          label="앱 URL"
          hint="http(s) 주소만 허용합니다. 저장 시 중복과 내부·로컬 주소 정책을 검사합니다."
          wide
        >
          <input
            required
            type="url"
            value={draft.url}
            onChange={(event) => update("url", event.target.value)}
          />
        </Field>
        <Field label="분류">
          <select
            value={draft.scope}
            onChange={(event) =>
              update("scope", event.target.value as AppLink["scope"])
            }
          >
            <option value="mvp_candidate">4악기 연결 후보</option>
            <option value="common_tool">공통 도구</option>
            <option value="other">그 외 보관</option>
            <option value="excluded_mismatch">체계 불일치 · 제외</option>
          </select>
        </Field>
        <Field label="악기체계">
          <input
            value={draft.instrumentSystem || ""}
            onChange={(event) =>
              update("instrumentSystem", event.target.value || null)
            }
          />
        </Field>
        <div
          className="ws-checkboxes ws-wide"
          role="group"
          aria-label="앱 연결 악기"
        >
          {INSTRUMENTS.map((id) => (
            <label key={id}>
              <input
                type="checkbox"
                checked={draft.instruments.includes(id)}
                onChange={(event) =>
                  update(
                    "instruments",
                    event.target.checked
                      ? [...draft.instruments, id]
                      : draft.instruments.filter((item) => item !== id),
                  )
                }
              />
              {instrumentLabels[id]}
            </label>
          ))}
        </div>
        <Field label="학습 용도" wide>
          <textarea
            rows={2}
            value={draft.purpose}
            onChange={(event) => update("purpose", event.target.value)}
          />
        </Field>
        <Field label="자료 수준 (미확인이면 비워두기)">
          <input
            type="number"
            min="1"
            max="3"
            step="1"
            value={draft.level ?? ""}
            onChange={(event) =>
              update(
                "level",
                event.target.value ? Number(event.target.value) : null,
              )
            }
          />
        </Field>
        <Field label="대체 자료">
          <select
            value={draft.fallbackResourceId || ""}
            onChange={(event) =>
              update("fallbackResourceId", event.target.value || null)
            }
          >
            <option value="">연결 없음</option>
            {store.resources
              .filter((resource) => resource.datasetKind === "synthetic_demo")
              .map((resource) => (
                <option value={resource.id} key={resource.id}>
                  {resource.title}
                </option>
              ))}
          </select>
        </Field>
        <Field label="링크 수동 점검 상태">
          <select
            value={draft.status}
            onChange={(event) =>
              update("status", event.target.value as AppLink["status"])
            }
          >
            <option value="unchecked">미점검</option>
            <option value="available">수동 점검: 이용 가능</option>
            <option value="broken">연결 오류</option>
            <option value="restricted">접근 제한</option>
          </select>
        </Field>
        <Field label="수동 점검일">
          <input
            type="date"
            value={draft.checkedAt?.slice(0, 10) || ""}
            onChange={(event) =>
              update(
                "checkedAt",
                event.target.value
                  ? `${event.target.value}T00:00:00.000Z`
                  : null,
              )
            }
          />
        </Field>
        <Field label="점검 증거" wide>
          <textarea
            rows={3}
            placeholder="점검 환경, 실제 확인한 범위와 근거를 기록하세요."
            value={draft.checkEvidence || ""}
            onChange={(event) =>
              update("checkEvidence", event.target.value || null)
            }
          />
        </Field>
        <Field label="카메라 요구">
          <select
            value={draft.requiresCamera}
            onChange={(event) =>
              update(
                "requiresCamera",
                event.target.value as AppLink["requiresCamera"],
              )
            }
          >
            <option value="unknown">미확인</option>
            <option value="yes">요구함</option>
            <option value="no">요구하지 않음</option>
          </select>
        </Field>
        <Field label="로그인 요구">
          <select
            value={draft.requiresLogin}
            onChange={(event) =>
              update(
                "requiresLogin",
                event.target.value as AppLink["requiresLogin"],
              )
            }
          >
            <option value="unknown">미확인</option>
            <option value="yes">요구함</option>
            <option value="no">요구하지 않음</option>
          </select>
        </Field>
        <div className="ws-checkboxes ws-wide">
          <label>
            <input
              type="checkbox"
              checked={draft.contentAccuracyChecked}
              onChange={(event) =>
                update("contentAccuracyChecked", event.target.checked)
              }
            />
            교육 내용 정확성 수동 점검 근거 있음
          </label>
          <label>
            <input
              type="checkbox"
              checked={draft.enabled}
              onChange={(event) => update("enabled", event.target.checked)}
            />
            후보 활성화
          </label>
        </div>
      </div>
      {blockers.length > 0 && (
        <div className="ws-inline-notice">
          <strong>연습 화면에서 열 수 없는 이유</strong>
          <ul>
            {blockers.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        </div>
      )}
      <p className="ws-small">
        후보를 활성화해도 점검·체계·권한 조건이 충족되지 않으면 외부 열기는
        차단됩니다. 원본 목록 출처: {app.sourceDocumentUrl}
      </p>
      <div className="ws-form-actions">
        <button
          type="button"
          className="ws-button"
          onClick={() => setDraft(clone(app))}
        >
          변경 취소
        </button>
        <SaveButton busy={busy} />
      </div>
    </form>
  );
}

function MappingView({ store }: { store: RepositoryState }) {
  return (
    <>
      <div className="ws-mapping-summary">
        <div>
          <strong>{store.legacyEntries.length}</strong>
          <span>미검수 원자료 항목</span>
          <small>기존 ID 유지 · 초안 · 권리 미확인</small>
        </div>
        <div>
          <strong>{store.modulePlans.length}</strong>
          <span>편집 기획 슬롯</span>
          <small>4악기 × 6개 목표 · 완성 콘텐츠 아님</small>
        </div>
        <div>
          <strong>
            {
              store.resources.filter(
                (resource) => resource.datasetKind === "synthetic_demo",
              ).length
            }
          </strong>
          <span>합성 시연 자료</span>
          <small>실제 승인 콘텐츠와 별도</small>
        </div>
      </div>
      <p className="ws-inline-notice">
        19개 원자료와 24개 기획 슬롯은 서로 다른 데이터입니다. 아래 연결은 교육
        순서가 확정되지 않은 제안이며, 매핑이 있어도 완성·승인 상태가 바뀌지
        않습니다.
      </p>
      <LegacyInventory store={store} />
      {INSTRUMENTS.map((instrument) => (
        <section className="ws-panel ws-mapping-group" key={instrument}>
          <h2>{instrumentLabels[instrument]} 기획 연결</h2>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <caption className="ws-sr">
                {instrumentLabels[instrument]} 6개 모듈 기획과 원자료 연결
              </caption>
              <thead>
                <tr>
                  <th scope="col">슬롯</th>
                  <th scope="col">기획 제목</th>
                  <th scope="col">원자료 ID 연결</th>
                  <th scope="col">매핑 상태</th>
                </tr>
              </thead>
              <tbody>
                {store.modulePlans
                  .filter((module) => module.instrument === instrument)
                  .map((module) => (
                    <tr key={module.id}>
                      <td>{module.slot}</td>
                      <th scope="row">{module.title}</th>
                      <td>
                        {module.legacyEntryIds.length ? (
                          module.legacyEntryIds.map((id) => (
                            <code key={id}>{id}</code>
                          ))
                        ) : (
                          <span className="ws-muted">
                            연결 없음 · 새 원고 필요
                          </span>
                        )}
                      </td>
                      <td>
                        {module.mappingState === "reviewed"
                          ? "매핑 검토됨"
                          : "제안 매핑"}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}

function LegacyInventory({ store }: { store: RepositoryState }) {
  return (
    <details className="ws-panel ws-legacy-inventory">
      <summary>
        미검수 원자료 {store.legacyEntries.length}개 메타데이터 전체 보기
      </summary>
      <p className="ws-small">
        기존 항목의 ID·제목·수준·쪽 범위만 보존합니다. 실제 교재 본문은
        비워두었으며, 검수 또는 권리가 확인된 자료가 아닙니다.
      </p>
      <div className="ws-table-wrap">
        <table className="ws-table">
          <caption className="ws-sr">19개 미검수 원자료 메타데이터</caption>
          <thead>
            <tr>
              <th scope="col">악기 · 원본 ID</th>
              <th scope="col">원자료 제목</th>
              <th scope="col">수준</th>
              <th scope="col">원문 쪽 범위</th>
              <th scope="col">검수 · 권리</th>
            </tr>
          </thead>
          <tbody>
            {store.legacyEntries.map((entry) => (
              <tr key={entry.id}>
                <td>
                  {instrumentLabels[entry.instrument]}
                  <code>{entry.id}</code>
                </td>
                <th scope="row">{entry.title}</th>
                <td>{entry.level}</td>
                <td>{entry.pageRange}</td>
                <td>
                  초안 · 권리 미확인
                  <br />
                  본문 미확인
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

function VersionComparison({
  versions,
  currentId,
  store,
}: {
  versions: ResourceVersion[];
  currentId: string;
  store: RepositoryState;
}) {
  const [leftId, setLeftId] = useState(
    versions.find((version) => version.id !== currentId)?.id || currentId,
  );
  const [rightId, setRightId] = useState(currentId);
  const left = versions.find((version) => version.id === leftId);
  const right = versions.find((version) => version.id === rightId);
  if (!left || !right) return null;
  const rows = [
    [
      "검수 상태",
      reviewLabels[left.reviewState],
      reviewLabels[right.reviewState],
    ],
    ["검수 범위", left.reviewScope || "미기록", right.reviewScope || "미기록"],
    [
      "권리 상태",
      rightsLabels[left.rights.state],
      rightsLabels[right.rights.state],
    ],
    [
      "인쇄 권한",
      left.rights.allowPrint ? "허용" : "제한",
      right.rights.allowPrint ? "허용" : "제한",
    ],
    [
      "단원",
      left.unitIds
        .map((id) => store.units.find((unit) => unit.id === id)?.title || id)
        .join(" / "),
      right.unitIds
        .map((id) => store.units.find((unit) => unit.id === id)?.title || id)
        .join(" / "),
    ],
    [
      "변경 요약",
      left.changeSummary || "최초 등록",
      right.changeSummary || "최초 등록",
    ],
    ["승인 시연일", dateLabel(left.approvedAt), dateLabel(right.approvedAt)],
  ];
  return (
    <details className="ws-version-comparison">
      <summary>두 판본의 보존된 정보 비교</summary>
      <div className="ws-form-grid">
        <Field label="비교 기준 판본">
          <select
            value={leftId}
            onChange={(event) => setLeftId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.version}
              </option>
            ))}
          </select>
        </Field>
        <Field label="비교할 판본">
          <select
            value={rightId}
            onChange={(event) => setRightId(event.target.value)}
          >
            {versions.map((version) => (
              <option key={version.id} value={version.id}>
                v{version.version}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <div className="ws-table-wrap">
        <table className="ws-table">
          <thead>
            <tr>
              <th scope="col">항목</th>
              <th scope="col">v{left.version}</th>
              <th scope="col">v{right.version}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, before, after]) => (
              <tr key={label} className={before !== after ? "ws-diff-row" : ""}>
                <th scope="row">{label}</th>
                <td>{before}</td>
                <td>{after}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="ws-small">
        서로 다른 행에 배경을 표시했습니다. 구판의 단원·승인 기록과 수업안
        참조는 보존됩니다.
      </p>
    </details>
  );
}

function ReviewView({
  resourceId,
  ...props
}: WorkspaceViewProps & { resourceId: string }) {
  const resource = props.store.resources.find((item) => item.id === resourceId);
  const version = props.store.versions.find(
    (item) => item.id === resource?.currentDraftVersionId,
  );
  return (
    <>
      <label className="ws-review-select">
        검수할 자료
        <select
          value={resource?.id || ""}
          onChange={(event) =>
            props.navigate(`/admin/reviews/${event.target.value}`)
          }
        >
          <option value="">자료 선택</option>
          {props.store.resources.map((item) => (
            <option value={item.id} key={item.id}>
              {item.title} ·{" "}
              {item.datasetKind === "synthetic_demo"
                ? "합성 시연"
                : "원자료 검수 전"}
            </option>
          ))}
        </select>
      </label>
      {resource && version ? (
        <ReviewDetail
          key={`${version.id}-${version.revision}-${resource.revision}`}
          {...props}
          resource={resource}
          version={version}
        />
      ) : (
        <Empty title="검수할 자료를 선택하세요">
          자료별 판본, 의견과 상태 전이 이력을 확인합니다.
        </Empty>
      )}
    </>
  );
}

function ReviewDetail({
  resource,
  version,
  store,
  run,
  navigate,
}: WorkspaceViewProps & { resource: Resource; version: ResourceVersion }) {
  const [reason, setReason] = useState("");
  const [scope, setScope] = useState(version.reviewScope || "");
  const [displayName, setDisplayName] = useState(
    version.reviewerDisplayName || "가상 검수자 A",
  );
  const [consent, setConsent] = useState(version.reviewerNameConsent);
  const [summary, setSummary] = useState("");
  const [busy, setBusy] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);
  const isDemo = resource.datasetKind === "synthetic_demo";
  const candidate = {
    ...resource,
    publishedVersionId: version.id,
    publicationState: "published" as const,
  };
  const blockers = isDemo
    ? demoPublishBlockers(version, resource, store.issues, store.units)
    : publishBlockers(version, candidate, store.issues, store.units);
  const issues = store.issues.filter((issue) => issue.versionId === version.id);
  const versions = store.versions.filter(
    (item) => item.resourceId === resource.id,
  );
  async function transition(to: ResourceVersion["reviewState"]) {
    if (!reason.trim()) return;
    setBusy(true);
    try {
      await run(
        (repo) =>
          repo.transitionReview(
            {
              resourceId: resource.id,
              versionId: version.id,
              to,
              actorId:
                to === "in_review" || to === "re_review"
                  ? "가상 편집자"
                  : "가상 검수자 A",
              role:
                to === "in_review" || to === "re_review"
                  ? "editor"
                  : "reviewer",
              reason: reason.trim(),
              commandId: `transition-${version.id}-${version.revision}-${to}`,
            },
            version.revision,
          ),
        "검수 상태와 이벤트 이력을 기록했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="ws-review-overview">
        <div>
          <span className="ws-tag">
            {isDemo
              ? "합성 fixture · 승인 흐름 시연 가능"
              : "미검수 원자료 · 실제 승인 불가"}
          </span>
          <h2>{resource.title}</h2>
          <p>
            현재 초안 v{version.version} · revision {version.revision} ·{" "}
            {rightsLabels[version.rights.state]}
          </p>
        </div>
        <LocalLink
          to="/admin/resources"
          navigate={navigate}
          className="ws-button"
        >
          메타데이터 편집
          <ArrowRight size={16} />
        </LocalLink>
      </div>
      <div
        className="ws-review-track"
        aria-label={`현재 검수 상태: ${reviewLabels[version.reviewState]}`}
      >
        {[
          "draft",
          "in_review",
          "changes_requested",
          "re_review",
          "approved",
        ].map((state, index) => (
          <div
            key={state}
            className={version.reviewState === state ? "active" : ""}
          >
            <span>{index + 1}</span>
            {reviewLabels[state]}
          </div>
        ))}
      </div>
      <div className="ws-review-columns">
        <section className="ws-panel">
          <h3>검수 범위와 공개 표시명</h3>
          <form
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              try {
                await run(
                  (repo) =>
                    repo.updateVersionMetadata(
                      version.id,
                      {
                        reviewScope: scope || null,
                        reviewerDisplayName: displayName || null,
                        reviewerNameConsent: consent,
                      },
                      version.revision,
                    ),
                  "검수 범위와 표시 동의를 저장했습니다.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <fieldset disabled={busy || version.reviewState === "approved"}>
              <Field label="검수 범위">
                <textarea
                  rows={3}
                  value={scope}
                  onChange={(event) => setScope(event.target.value)}
                  placeholder="예: 합성 도식의 단원 1 문장과 접근성 안내 검토"
                />
              </Field>
              <Field label="검수자 표시명">
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                />
              </Field>
              <label className="ws-check">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                />
                이 표시명을 공개하는 데 동의함 (시연)
              </label>
              <SaveButton busy={busy}>검수 범위 저장</SaveButton>
            </fieldset>
          </form>
          <p className="ws-small">
            음악 내용 검수와 이용 권리 검토는 별도입니다. 실제
            전문가명·서명·승인 증거를 만들지 않습니다.
          </p>
        </section>
        <section className="ws-panel">
          <h3>검수 상태 전이</h3>
          <p className="ws-small">
            현재: <strong>{reviewLabels[version.reviewState]}</strong> · 승인과
            공개는 별도 명령입니다.
          </p>
          <Field label="전이 사유·검수 근거 (필수)">
            <textarea
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              rows={3}
              placeholder="검토 범위, 수정 요청 또는 승인/반려 이유를 기록하세요."
            />
          </Field>
          <div className="ws-transition-actions">
            {version.reviewState === "draft" && (
              <button
                className="ws-button ws-primary"
                disabled={busy || !reason.trim()}
                onClick={() => transition("in_review")}
              >
                검수 요청
              </button>
            )}
            {version.reviewState === "changes_requested" && (
              <button
                className="ws-button ws-primary"
                disabled={busy || !reason.trim()}
                onClick={() => transition("re_review")}
              >
                수정 후 재검수 요청
              </button>
            )}
            {(version.reviewState === "in_review" ||
              version.reviewState === "re_review") && (
              <>
                <button
                  className="ws-button"
                  disabled={busy || !reason.trim()}
                  onClick={() => transition("changes_requested")}
                >
                  수정 요청
                </button>
                <button
                  className="ws-button ws-primary"
                  disabled={busy || !reason.trim() || !isDemo}
                  onClick={() => transition("approved")}
                >
                  합성 승인 시연
                </button>
                <button
                  className="ws-button ws-danger"
                  disabled={busy || !reason.trim()}
                  onClick={() => transition("rejected")}
                >
                  사유와 함께 반려
                </button>
              </>
            )}
            {(version.reviewState === "approved" ||
              version.reviewState === "rejected") && (
              <p className="ws-small">
                이 판본의 검수는 종료되었습니다. 수정은 새 초안에서 시작하세요.
              </p>
            )}
          </div>
          {!isDemo && (
            <p className="ws-warning">
              원자료의 실제 전문가 승인은 이 로컬 시연에서 생성할 수 없습니다.
            </p>
          )}
        </section>
      </div>
      <section className="ws-panel">
        <div className="ws-section-heading">
          <h3>{isDemo ? "합성 시연 서고 공개 조건" : "실제 자료 공개 조건"}</h3>
          <button
            className="ws-button"
            disabled={busy || blockers.length > 0}
            onClick={async () => {
              setBusy(true);
              try {
                await run(
                  (repo) =>
                    isDemo
                      ? repo.publishDemoResource(resource.id, resource.revision)
                      : repo.publishResource(resource.id, resource.revision),
                  "자료의 공개 조건을 확인하고 공개했습니다.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            {isDemo ? "합성 서고 공개 시연" : "조건 확인 후 공개"}
          </button>
        </div>
        {blockers.length ? (
          <ul className="ws-blockers">
            {blockers.map((reason, index) => (
              <li key={index}>{reason}</li>
            ))}
          </ul>
        ) : (
          <p className="ws-success">필수 공개 조건을 충족했습니다.</p>
        )}
      </section>
      <section className="ws-panel">
        <div className="ws-section-heading">
          <h3>현재 판본의 위치별 의견</h3>
          <button
            type="button"
            className="ws-button"
            onClick={() => setShowIssueForm(!showIssueForm)}
          >
            <Plus size={15} />이 판본에 의견 등록
          </button>
          <LocalLink
            to="/admin/issues"
            navigate={navigate}
            className="ws-text-button"
          >
            전체 오류 신고 보기
            <ArrowRight size={15} />
          </LocalLink>
        </div>
        {showIssueForm && (
          <NewIssueForm
            store={store}
            run={run}
            initialResourceId={resource.id}
            onDone={() => setShowIssueForm(false)}
          />
        )}
        {issues.length ? (
          issues.map((issue) => (
            <IssueCard
              key={`${issue.id}-${issue.status}`}
              issue={issue}
              store={store}
              run={run}
            />
          ))
        ) : (
          <p className="ws-small">
            아직 등록된 검토 의견이 없습니다. ‘의견 없음’이 정확성 검증을 뜻하지
            않습니다.
          </p>
        )}
      </section>
      <div className="ws-review-columns">
        <section className="ws-panel">
          <h3>판본 비교와 개정</h3>
          <div className="ws-table-wrap">
            <table className="ws-table">
              <thead>
                <tr>
                  <th>판본</th>
                  <th>상태</th>
                  <th>변경 요약</th>
                  <th>기준 판본</th>
                </tr>
              </thead>
              <tbody>
                {versions.map((item) => (
                  <tr key={item.id}>
                    <th>v{item.version}</th>
                    <td>{reviewLabels[item.reviewState]}</td>
                    <td>{item.changeSummary || "최초 등록"}</td>
                    <td>
                      {versions.find((v) => v.id === item.basedOnVersionId)
                        ?.version || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {versions.length > 1 && (
            <VersionComparison
              versions={versions}
              currentId={version.id}
              store={store}
            />
          )}
          <Field label="새 초안의 변경 요약">
            <input
              value={summary}
              onChange={(event) => setSummary(event.target.value)}
              placeholder="무엇을 수정할지 기록하세요"
            />
          </Field>
          <button
            className="ws-button"
            disabled={busy || !summary.trim()}
            onClick={async () => {
              setBusy(true);
              try {
                await run(
                  (repo) =>
                    repo.reviseResource(
                      resource.id,
                      summary.trim(),
                      version.revision,
                    ),
                  "기존 판본을 보존하고 새 초안을 만들었습니다.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <Plus size={16} />새 판본 초안 만들기
          </button>
          <p className="ws-small">
            구판 승인 스냅샷과 수업안의 자료 참조는 유지됩니다. 새 초안은 검수를
            다시 받아야 합니다.
          </p>
        </section>
        <section className="ws-panel">
          <h3>추가 기록 방식의 검수 이력</h3>
          <ol className="ws-event-history">
            {store.reviewEvents
              .filter((event) => event.resourceId === resource.id)
              .slice()
              .reverse()
              .map((event) => (
                <li key={event.id}>
                  <span>
                    {dateLabel(event.at)} · revision {event.snapshotRevision}
                  </span>
                  <strong>
                    {reviewLabels[event.from]} → {reviewLabels[event.to]}
                  </strong>
                  <p>{event.reason}</p>
                  <small>
                    {event.actorId} · {event.role} · {event.versionId}
                  </small>
                </li>
              ))}
          </ol>
          {!store.reviewEvents.some(
            (event) => event.resourceId === resource.id,
          ) && (
            <p className="ws-small">
              상태 전이 후 첫 이벤트가 여기에 기록됩니다.
            </p>
          )}
          <p className="ws-small">
            기존 이벤트를 편집·삭제하지 않습니다. localStorage 기록은 실제 감사
            보안을 보장하지 않습니다.
          </p>
        </section>
      </div>
    </>
  );
}

function IssuesView({ store, run }: WorkspaceViewProps) {
  const [status, setStatus] = useState("all");
  const [severity, setSeverity] = useState("all");
  const [showNew, setShowNew] = useState(false);
  const issues = store.issues.filter(
    (issue) =>
      (status === "all" || issue.status === status) &&
      (severity === "all" || issue.severity === severity),
  );
  return (
    <>
      <div className="ws-management-toolbar">
        <select
          aria-label="신고 처리 상태"
          value={status}
          onChange={(event) => setStatus(event.target.value)}
        >
          <option value="all">모든 처리 상태</option>
          {Object.entries(issueLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        <select
          aria-label="신고 심각도"
          value={severity}
          onChange={(event) => setSeverity(event.target.value)}
        >
          <option value="all">모든 심각도</option>
          <option value="critical">중대 · critical</option>
          <option value="major">일반 중요 · major</option>
          <option value="minor">경미 · minor</option>
        </select>
        <span>{issues.length}개 신고</span>
        <button
          className="ws-button ws-primary"
          type="button"
          onClick={() => setShowNew(!showNew)}
        >
          <Plus size={16} />
          위치별 의견 등록
        </button>
      </div>
      {showNew && (
        <NewIssueForm
          store={store}
          run={run}
          onDone={() => setShowNew(false)}
        />
      )}
      {issues.length ? (
        <section className="ws-panel">
          <p className="ws-small">
            ‘수정 완료’는 수정자의 처리 주장이고, ‘재검수 확인’은 검수자의 별도
            확인입니다. 안전·핵심 음악 오류는 자료 보류로 이어집니다.
          </p>
          {issues.map((issue) => (
            <IssueCard
              key={`${issue.id}-${issue.status}`}
              issue={issue}
              store={store}
              run={run}
            />
          ))}
        </section>
      ) : (
        <Empty title="해당하는 오류 신고가 없습니다">
          자료와 단원에 위치별 의견을 남기고 수정·재확인 과정을 기록할 수
          있습니다.
        </Empty>
      )}
    </>
  );
}

function IssueCard({
  issue,
  store,
  run,
}: {
  issue: ReviewIssue;
  store: RepositoryState;
  run: WorkspaceViewProps["run"];
}) {
  const [resolution, setResolution] = useState(
    issue.resolution || issue.dismissalReason || "",
  );
  const [busy, setBusy] = useState(false);
  const resource = store.resources.find((item) => item.id === issue.resourceId);
  const version = store.versions.find((item) => item.id === issue.versionId);
  const unit = store.units.find((item) => item.id === issue.unitId);
  const restrictedDismiss =
    issue.category === "safety" ||
    issue.category === "music" ||
    issue.severity === "critical";
  async function resolve(status: ReviewIssue["status"], role: string) {
    if (!resolution.trim()) return;
    setBusy(true);
    try {
      await run(
        (repo) => repo.resolveIssue(issue.id, status, resolution.trim(), role),
        status === "fixed"
          ? "수정 결과를 기록했습니다. 검수자의 재확인이 필요합니다."
          : "의견의 처리 상태를 기록했습니다.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <article className="ws-issue-card">
      <div className="ws-section-heading">
        <div className="ws-tags">
          <span
            className={`ws-tag ${issue.severity !== "minor" ? "ws-alert-tag" : ""}`}
          >
            {issue.severity === "critical"
              ? "중대"
              : issue.severity === "major"
                ? "일반 중요"
                : "경미"}
          </span>
          <span className="ws-tag">{issue.category}</span>
          <span className="ws-tag">{issueLabels[issue.status]}</span>
        </div>
        <small>
          v{version?.version || "?"} · {unit?.title || "자료 전체"}
          {issue.blockId ? ` · 블록 ${issue.blockId}` : ""}
        </small>
      </div>
      <h4>{issue.description}</h4>
      <p className="ws-small">{resource?.title || issue.resourceId}</p>
      <dl>
        <div>
          <dt>근거</dt>
          <dd>{issue.evidence || "근거 추가 확인 필요"}</dd>
        </div>
        <div>
          <dt>수정 제안</dt>
          <dd>{issue.suggestion || "기록 없음"}</dd>
        </div>
        {issue.resolution && (
          <div>
            <dt>처리 결과</dt>
            <dd>{issue.resolution}</dd>
          </div>
        )}
        {issue.dismissalReason && (
          <div>
            <dt>제외 사유</dt>
            <dd>{issue.dismissalReason}</dd>
          </div>
        )}
      </dl>
      {(issue.status === "open" || issue.status === "fixed") && (
        <>
          <Field label="수정 결과 / 재검수 근거 / 제외 사유 (필수)">
            <textarea
              value={resolution}
              onChange={(event) => setResolution(event.target.value)}
              rows={2}
            />
          </Field>
          <div className="ws-transition-actions">
            {issue.status === "open" && (
              <button
                type="button"
                className="ws-button"
                disabled={busy || !resolution.trim()}
                onClick={() => resolve("fixed", "editor")}
              >
                편집자: 수정 완료 기록
              </button>
            )}
            {issue.status === "fixed" && (
              <button
                type="button"
                className="ws-button ws-primary"
                disabled={busy || !resolution.trim()}
                onClick={() => resolve("verified", "reviewer")}
              >
                검수자: 수정 재확인
              </button>
            )}
            <button
              type="button"
              className="ws-button"
              disabled={busy || !resolution.trim() || restrictedDismiss}
              onClick={() => resolve("dismissed", "editor")}
            >
              사유 기록 후 제외
            </button>
          </div>
          {restrictedDismiss && (
            <p className="ws-small">
              안전·핵심 음악·중대 지적은 편집자가 임의로 제외할 수 없습니다.
            </p>
          )}
        </>
      )}
    </article>
  );
}

function NewIssueForm({
  store,
  run,
  onDone,
  initialResourceId,
}: {
  store: RepositoryState;
  run: WorkspaceViewProps["run"];
  onDone: () => void;
  initialResourceId?: string;
}) {
  const [resourceId, setResourceId] = useState(
    initialResourceId || store.resources[0]?.id || "",
  );
  const [unitId, setUnitId] = useState("");
  const [blockId, setBlockId] = useState("");
  const [category, setCategory] = useState<ReviewIssue["category"]>("other");
  const [severity, setSeverity] = useState<ReviewIssue["severity"]>("minor");
  const [description, setDescription] = useState("");
  const [evidence, setEvidence] = useState("");
  const [suggestion, setSuggestion] = useState("");
  const [busy, setBusy] = useState(false);
  const resource = store.resources.find((item) => item.id === resourceId);
  const version = store.versions.find(
    (item) => item.id === resource?.currentDraftVersionId,
  );
  const units = store.units.filter(
    (unit) => unit.resourceVersionId === version?.id,
  );
  const unit = units.find((item) => item.id === unitId);
  return (
    <form
      className="ws-panel ws-new-issue"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!version) return;
        setBusy(true);
        try {
          await run(async (repo) => {
            await repo.reportIssue({
              resourceId,
              versionId: version.id,
              unitId: unitId || null,
              blockId: blockId || null,
              category,
              severity,
              description: description.trim(),
              evidence: evidence.trim(),
              suggestion: suggestion.trim(),
            });
            onDone();
          }, "위치별 검토 의견을 등록했습니다.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>위치별 검토 의견</h2>
      <div className="ws-form-grid">
        <Field label="자료">
          <select
            required
            value={resourceId}
            onChange={(event) => {
              setResourceId(event.target.value);
              setUnitId("");
              setBlockId("");
            }}
          >
            {store.resources.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="판본">
          <input
            readOnly
            value={
              version ? `v${version.version} · ${version.id}` : "판본 없음"
            }
          />
        </Field>
        <Field label="단원">
          <select
            value={unitId}
            onChange={(event) => {
              setUnitId(event.target.value);
              setBlockId("");
            }}
          >
            <option value="">자료 전체</option>
            {units.map((item) => (
              <option key={item.id} value={item.id}>
                {item.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="블록 위치">
          <select
            value={blockId}
            onChange={(event) => setBlockId(event.target.value)}
          >
            <option value="">블록 지정 없음</option>
            {unit?.blocks.map((block, index) => (
              <option key={block.id} value={block.id}>
                {index + 1}. {block.type} · {block.id}
              </option>
            ))}
          </select>
        </Field>
        <Field label="범주">
          <select
            value={category}
            onChange={(event) =>
              setCategory(event.target.value as ReviewIssue["category"])
            }
          >
            <option value="music">음악 내용</option>
            <option value="pedagogy">교육 방법</option>
            <option value="safety">안전</option>
            <option value="rights">권리</option>
            <option value="other">기타</option>
          </select>
        </Field>
        <Field label="심각도">
          <select
            value={severity}
            onChange={(event) =>
              setSeverity(event.target.value as ReviewIssue["severity"])
            }
          >
            <option value="minor">경미 · minor</option>
            <option value="major">일반 중요 · major</option>
            <option value="critical">중대 · critical</option>
          </select>
        </Field>
        <Field label="의견 제목과 내용" wide>
          <textarea
            required
            rows={3}
            value={description}
            onChange={(event) => setDescription(event.target.value)}
          />
        </Field>
        <Field label="근거">
          <textarea
            required
            rows={2}
            value={evidence}
            onChange={(event) => setEvidence(event.target.value)}
          />
        </Field>
        <Field label="수정 제안">
          <textarea
            required
            rows={2}
            value={suggestion}
            onChange={(event) => setSuggestion(event.target.value)}
          />
        </Field>
      </div>
      <p className="ws-small">
        이메일·학생 이름·사진·녹음은 입력하지 마세요. 안전 또는 핵심 음악 오류는
        자료 보류 대상으로 처리됩니다.
      </p>
      <div className="ws-form-actions">
        <button type="button" className="ws-button" onClick={onDone}>
          취소
        </button>
        <SaveButton busy={busy}>의견 등록</SaveButton>
      </div>
    </form>
  );
}
