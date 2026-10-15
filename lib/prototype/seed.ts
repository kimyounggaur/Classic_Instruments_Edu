import { INSTRUMENTS, instrumentLabels } from "./types.ts";
import type {
  AppLink,
  Instrument,
  LegacyEntry,
  RepositoryData,
  Resource,
  ResourceVersion,
  RightsRecord,
  Unit,
} from "./types.ts";

export const SEED_DATE = "2026-10-15T00:00:00.000Z";
export const DEMO_WATERMARK = "승인 절차 시연 · 교육 내용 검증 아님";
export const SOURCE_DOCUMENTS = {
  plan: "https://docs.google.com/document/d/1yep7kBlfDuPpwnpgokrTfucpaJA99SHHVbyF2FHEVE8",
  apps: "https://docs.google.com/document/d/1UsiGthhLzDkh68ghJswdUfyIThbTdv_kPCigqX06nIc",
  legacy:
    "https://docs.google.com/document/d/1ZjYQY8XUNEKJQGZPltYP9fEG6gRjz-1bbF_0uwxZbNM",
  previous:
    "https://docs.google.com/document/d/1zJnzhYaGzo6JH4RmFjtc1Wcd9hIXS2ogWF1MDx3Sn-0",
};
const legacyRows: Array<[string, Instrument, 1 | 2 | 3, string, string]> = [
  [
    "violin-unit01-posture-left-hand",
    "violin",
    1,
    "1단원. 기본 자세 — 몸의 균형과 왼손·손목",
    "3–8",
  ],
  [
    "violin-unit01-bow-hold-contact",
    "violin",
    1,
    "1단원. 기본 자세 — 오른손 활 잡기와 활의 접촉점",
    "9–15",
  ],
  [
    "violin-unit02-open-strings-bowing",
    "violin",
    1,
    "2단원. 개방현과 첫소리 — 4현 구조·내림활/올림활·현 바꾸기",
    "16–27",
  ],
  [
    "violin-unit03-first-finger",
    "violin",
    2,
    "3단원. 왼손 첫 운지 — 1번 손가락(D현 미 E4, A현 시 B4)",
    "28–38",
  ],
  [
    "violin-unit04-high2-and-3",
    "violin",
    2,
    "4단원. 높은 2번과 3번 손가락 — 온음·반음 간격(파♯·솔, 도♯·레)",
    "39–54",
  ],
  [
    "violin-unit05-06-d-major-two-string-walk",
    "violin",
    3,
    "5–6단원. D장조 한 옥타브와 현 이동 & 첫 연습곡 〈두 줄 산책〉",
    "55–78",
  ],
  [
    "violin-unit07-10-slur-rest-eighth-notes",
    "violin",
    3,
    "7–10단원. 활 분배와 두 음 슬러 · 쉼표 · 8분음표 · 〈작은 산책〉 종합",
    "79–116",
  ],
  [
    "cello-unit01-sitting-endpin-balance",
    "cello",
    1,
    "1단원. 앉는 자세와 악기 균형 — 의자·엔드핀·3분 준비",
    "3–8 (부록 27–30)",
  ],
  [
    "cello-unit02-left-hand-and-bow-grip",
    "cello",
    1,
    "2단원. 왼손과 활 잡기 — 바이올린 활 잡기와의 핵심 차이",
    "9–14 (부록 31–32)",
  ],
  [
    "cello-unit03-open-strings-rhythm",
    "cello",
    2,
    "3단원. 개방현과 기초 리듬 — C·G·D·A 4현과 활 접촉 구간",
    "15–20 (부록 33–35)",
  ],
  [
    "cello-unit04-first-position-0134",
    "cello",
    3,
    "4단원. 첫 포지션과 첫 연습곡 〈첫 걸음〉 — 0·1·3·4 운지 원리",
    "21–26 (부록 36–38)",
  ],
  [
    "flute-unit01-posture-assembly-care",
    "flute",
    1,
    "1단원. 기본 자세와 조립·관리 — 3부분 구조와 3점 지지",
    "3–14 (부록 49–53)",
  ],
  [
    "flute-unit02-headjoint-embouchure-breathing",
    "flute",
    1,
    "2단원. 헤드조인트와 첫소리 — 입술 바람길과 어지러움 예방",
    "15–24 (부록 53–56)",
  ],
  [
    "flute-unit03-b4-a4-g4-fingerings",
    "flute",
    2,
    "3단원. 시·라·솔 기초 운지 — B4·A4·G4 직접 누르는 키와 오선 읽기",
    "25–36 (부록 52, 55)",
  ],
  [
    "flute-unit04-rhythm-little-breeze",
    "flute",
    3,
    "4단원. 첫 리듬과 〈작은 바람〉 — 4/4박자 리듬 시간축과 8마디 창작곡",
    "37–48 (부록 55–56)",
  ],
  [
    "clarinet-unit01-assembly-bridge-key-posture",
    "clarinet",
    1,
    "1단원. 악기 조립과 몸의 균형 — 연결 키(브리지 키) 보호와 오른엄지 받침",
    "3–8 (부록 27–28)",
  ],
  [
    "clarinet-unit02-reed-embouchure-first-sound-g4",
    "clarinet",
    1,
    "2단원. 리드와 입 모양, 첫 소리 — 앙부슈어와 개방 G4(삑 소리 대처)",
    "9–14 (부록 28–30)",
  ],
  [
    "clarinet-unit03-five-notes-c4-to-g4",
    "clarinet",
    2,
    "3단원. 다섯 음과 손가락의 움직임 — 기보 G4·F4·E4·D4·C4 운지와 이조",
    "15–20 (부록 27, 29, 31)",
  ],
  [
    "clarinet-unit04-rhythm-etudes-10min-routine",
    "clarinet",
    3,
    "4단원. 리듬과 첫 연습곡 — 〈두 박의 인사〉·〈다섯 음 산책〉·10분 연습 루틴",
    "21–26",
  ],
];
export const LEGACY_MANIFEST: LegacyEntry[] = legacyRows.map(
  ([id, instrument, level, title, pageRange]) => ({
    id,
    instrument,
    level,
    title,
    pageRange,
    questionCount: 2,
    reviewState: "draft",
    rightsState: "unknown",
    approvedAt: null,
    body: null,
  }),
);
export const APP_URLS = [
  "https://drum-beat-pi.vercel.app/",
  "https://nanta-play.vercel.app/",
  "https://guitar-chord-viewer.vercel.app/",
  "https://ukulele-chord-viewer.vercel.app/",
  "https://miniharp-app.vercel.app/",
  "https://saxophone-edu.vercel.app/",
  "https://ocarina-master.vercel.app/",
  "https://panflute-edu.vercel.app/",
  "https://kalimba-play.vercel.app/",
  "https://tonguedrum-play.vercel.app/",
  "https://violin-edu.vercel.app",
  "https://cello-edu.vercel.app/",
  "https://flute-edu.vercel.app/",
  "https://metronome-app-flax.vercel.app/",
  "https://web-app-animation-test.vercel.app/",
  "https://clarii-fingering-correction.vercel.app/",
  "https://sax-fingering-coach.vercel.app/",
  "https://flute-fingering-coach.vercel.app/",
  "https://ukulele-chord-fingering-correction.vercel.app/",
  "https://guitar-chord-fingering-correction.vercel.app/",
  "https://ocarina-fingering-coach.vercel.app/",
  "https://trumpet-fingering-edu.vercel.app/",
  "https://clarinet-fingering-edu.vercel.app/#instrument=Bb",
  "https://gayageum-fingering-edu.vercel.app/",
  "https://flute-fingering-edu.vercel.app/",
  "https://clarimini-fingering-edu.vercel.app/",
  "https://saxhands-webapp.vercel.app/",
  "https://recorder-fingering-edu.vercel.app/",
  "https://musescore-copy.vercel.app/",
  "https://kimyounggaur.github.io/A_Score/",
  "https://kimyounggaur.github.io/DAW-master-/",
  "https://kimyounggaur.github.io/Vocal_Recording/",
  "https://kimyounggaur.github.io/Guitar-Muti-Effector/",
  "https://kimyounggaur.github.io/Guitar-Pedalboard/",
  "https://kimyounggaur.github.io/synthesizer/",
  "https://accompany-designer2nd.vercel.app/",
  "https://kimyounggaur.github.io/Piano_Roll-FL_Studio-/",
] as const;
export function emptyRights(): RightsRecord {
  return {
    state: "unknown",
    holder: null,
    license: null,
    evidenceRef: null,
    allowView: false,
    allowPrint: false,
    allowDownload: false,
    allowRedistribute: false,
    checkedAt: null,
    checkedBy: null,
  };
}
function demoRights(): RightsRecord {
  return {
    state: "cleared",
    holder: "이 프로토타입의 중립 합성 예시",
    license: "시연용 텍스트",
    evidenceRef: "local:synthetic-ui-copy",
    allowView: true,
    allowPrint: true,
    allowDownload: false,
    allowRedistribute: false,
    checkedAt: SEED_DATE,
    checkedBy: "시연 편집자",
  };
}
export function instrumentSystem(instrument: Instrument): string {
  return instrument === "clarinet"
    ? "표준 Bb 보엠식"
    : `${instrumentLabels[instrument]} · 체계 확인용 합성 예시`;
}
function makeApp(url: string, index: number): AppLink {
  const numbers: Record<
    number,
    { title: string; instruments: Instrument[]; system?: string }
  > = {
    11: { title: "바이올린 자료 후보", instruments: ["violin"] },
    12: { title: "첼로 자료 후보", instruments: ["cello"] },
    13: { title: "플루트 자료 후보", instruments: ["flute"] },
    23: {
      title: "Bb 클라리넷 운지 후보",
      instruments: ["clarinet"],
      system: "표준 Bb 보엠식",
    },
    25: { title: "플루트 운지 자료 후보", instruments: ["flute"] },
  };
  const position = index + 1;
  const known = numbers[position];
  const common = [14, 29].includes(position);
  const mismatch = [16, 17, 26].includes(position);
  return {
    id: `app-${String(position).padStart(2, "0")}`,
    title:
      known?.title ??
      (position === 14
        ? "메트로놈 후보"
        : position === 29
          ? "악보 작성 도구 후보"
          : `앱 후보 ${String(position).padStart(2, "0")}`),
    url,
    sourceDocumentUrl: SOURCE_DOCUMENTS.apps,
    instruments:
      known?.instruments ??
      (common ? [...INSTRUMENTS] : position === 18 ? ["flute"] : []),
    instrumentSystem: known?.system ?? null,
    scope:
      known || position === 18
        ? "mvp_candidate"
        : common
          ? "common_tool"
          : mismatch
            ? "excluded_mismatch"
            : "other",
    purpose: known
      ? "원자료에 기재된 학습 자료 후보 · 실제 내용 점검 전"
      : common
        ? "원자료에 기재된 공통 수업 도구 후보 · 점검 전"
        : "관리자 분류 및 내용 점검 전",
    level: null,
    status: "unchecked",
    checkedAt: null,
    checkEvidence: null,
    contentAccuracyChecked: false,
    requiresCamera: position === 18 ? "yes" : "unknown",
    requiresLogin: "unknown",
    enabled: false,
    fallbackResourceId: known ? `demo-${known.instruments[0]}-textbook` : null,
  };
}
export function createSeed(): RepositoryData {
  const data: RepositoryData = {
    resources: [],
    versions: [],
    units: [],
    legacyEntries: LEGACY_MANIFEST.map((item) => ({ ...item })),
    modulePlans: [],
    apps: APP_URLS.map(makeApp),
    plans: [],
    bookmarks: [],
    positions: [],
    bookPresentations: [],
    readingAssets: [],
    issues: [],
    reviewEvents: [],
  };
  const slots = [
    "악기 이해·관리",
    "기본 자세",
    "첫 소리 또는 개방현",
    "기초 운지와 기보",
    "기본 리듬과 짧은 연습",
    "한 회차 수업 적용",
  ];
  for (const instrument of INSTRUMENTS) {
    const entries = data.legacyEntries.filter(
      (entry) => entry.instrument === instrument,
    );
    slots.forEach((title, index) => {
      const slot = (index + 1) as 1 | 2 | 3 | 4 | 5 | 6;
      const mapped =
        slot === 2
          ? entries.filter((entry) =>
              /posture|bow-hold|sitting|left-hand-and/.test(entry.id),
            )
          : slot === 3
            ? entries.filter((entry) =>
                /open-strings|embouchure/.test(entry.id),
              )
            : slot === 4
              ? entries.filter(
                  (entry) =>
                    /finger|high2|first-position|five-notes/.test(entry.id) &&
                    !/fingering-correction/.test(entry.id),
                )
              : slot === 5
                ? entries.filter((entry) =>
                    /rhythm|slur|d-major/.test(entry.id),
                  )
                : [];
      data.modulePlans.push({
        id: `module-${instrument}-${slot}`,
        instrument,
        slot,
        title,
        legacyEntryIds: mapped.map((entry) => entry.id),
        mappingState: "proposed",
      });
    });
    for (let index = 0; index < 3; index++) {
      const workflow = index === 2;
      const kind =
        index === 0
          ? "textbook"
          : instrument === "clarinet" && index === 1
            ? "score"
            : index === 1
              ? "activity"
              : "diagram";
      const id = `demo-${instrument}-${index === 0 ? "textbook" : index === 1 ? "activity" : "review"}`;
      const versionId = `${id}-v1`;
      const title = `${instrumentLabels[instrument]} ${index === 0 ? "수업 준비 노트" : index === 1 ? (kind === "score" ? "악보 자리표시자" : "함께 만드는 활동지") : "검수 흐름 시연"}`;
      const resource: Resource = {
        id,
        title,
        description: workflow
          ? "관리자용 합성 검수 상태 예시입니다. 음악 주법은 포함하지 않습니다."
          : "승인된 교육 자료를 교사가 확인하고 한 회차 수업을 준비하는 중립 합성 예시입니다.",
        instrument,
        instrumentSystem: instrumentSystem(instrument),
        kind,
        level: index === 1 ? 2 : 1,
        objectives: [
          "자료의 출처와 판본 확인",
          index === 0 ? "수업 준비" : "활동 순서 정리",
        ],
        topics: ["수업 준비", "자료 확인", index === 0 ? "기초" : "활동"],
        prerequisites: ["교사가 실제 승인 자료를 별도로 선택"],
        estimatedMinutes: index === 0 ? 10 : 15,
        datasetKind: "synthetic_demo",
        currentDraftVersionId: versionId,
        publishedVersionId: workflow ? null : versionId,
        publicationState:
          workflow && instrument === "clarinet"
            ? "on_hold"
            : workflow
              ? "private"
              : "published",
        sourceRefs: [
          {
            id: `source-${id}`,
            title: "직접 작성한 중립 UI 시연 텍스트",
            url: null,
            chapter: "교육 내용 검증 아님",
            pageRange: null,
          },
        ],
        legacyEntryIds: [],
        modulePlanIds: [`module-${instrument}-${index + 1}`],
        revision: 1,
        demoShelf: !workflow,
      };
      const unitIds = [1, 2].map((order) => `${versionId}-unit-${order}`);
      const version: ResourceVersion = {
        id: versionId,
        resourceId: id,
        version: "1.0",
        reviewState: workflow
          ? instrument === "violin"
            ? "draft"
            : instrument === "cello"
              ? "in_review"
              : instrument === "flute"
                ? "changes_requested"
                : "approved"
          : "approved",
        rights:
          workflow && instrument === "cello" ? emptyRights() : demoRights(),
        unitIds,
        aiUsage: "중립 UI 구조 예시 작성 · 교육 내용 자동 생성 없음",
        reviewScope: "화면과 승인 절차의 합성 시연만 확인",
        reviewerDisplayName: null,
        reviewerNameConsent: false,
        reviewedAt: workflow ? null : SEED_DATE,
        approvedBy:
          workflow && instrument !== "clarinet" ? null : "demo-reviewer",
        approvedAt: workflow && instrument !== "clarinet" ? null : SEED_DATE,
        approvalEvidenceRef:
          workflow && instrument !== "clarinet"
            ? null
            : "local:demo-workflow-only",
        basedOnVersionId: null,
        changeSummary: "초기 중립 합성 시연본",
        revision: 1,
        createdAt: SEED_DATE,
      };
      resource.updatedAt = SEED_DATE;
      data.resources.push(resource);
      data.versions.push(version);
      unitIds.forEach((unitId, unitIndex) => {
        const unit: Unit = {
          id: unitId,
          resourceVersionId: versionId,
          order: unitIndex + 1,
          title: unitIndex === 0 ? "자료를 열기 전에" : "한 회차 수업에 담기",
          blocks: [
            { id: `${unitId}-notice`, type: "paragraph", text: DEMO_WATERMARK },
            {
              id: `${unitId}-body`,
              type: "paragraph",
              text:
                unitIndex === 0
                  ? "이 단원은 자료를 읽는 화면의 구조를 보여 줍니다. 교사는 실제 사용하려는 자료의 출처, 권리, 검수 범위와 판본을 확인한 뒤 승인된 내용을 이 자리에 연결합니다."
                  : "선택한 단원을 수업안에 담고 활동 시간과 준비물을 정리할 수 있습니다. 운지·호흡·자세·연주법에 대한 지시는 포함하지 않습니다. 실제 수업 내용은 해당 악기의 전문가 검수가 필요합니다.",
            },
            {
              id: `${unitId}-check`,
              type: "paragraph",
              text: "확인할 항목: 자료 제목, 악기체계, 판본, 열람·출력 권리, 검수 범위. 모르는 정보는 추정하여 채우지 않습니다.",
            },
          ],
          appLinkIds: [
            instrument === "violin"
              ? "app-11"
              : instrument === "cello"
                ? "app-12"
                : instrument === "flute"
                  ? "app-13"
                  : "app-23",
          ],
        };
        data.units.push(unit);
      });
      data.readingAssets.push({
        id: `${id}-structured`,
        resourceVersionId: versionId,
        format: "structured",
        fileRef: null,
        pageCount: null,
        checksum: null,
        availability: "available",
        rights: {
          allowView: true,
          allowPrint: !workflow || instrument !== "cello",
          allowDownload: false,
        },
      });
      data.bookPresentations.push({
        resourceId: id,
        resourceVersionId: versionId,
        coverAssetId: null,
        coverOrigin: "generated_typography",
        shelfOrder: INSTRUMENTS.indexOf(instrument) * 2 + index,
        displayTitle: title,
      });
    }
    const refId = `demo-${instrument}-textbook`;
    data.plans.push({
      id: `plan-${instrument}-demo`,
      title: `${instrumentLabels[instrument]} 40분 수업 준비`,
      instrument,
      targetLevel: 1,
      objectives: ["자료의 출처와 판본 확인", "한 회차 활동 순서 정리"],
      durationMinutes: 40,
      materials: ["승인 자료 확인 목록", "교사용 메모"],
      activities: [5, 10, 15, 10].map((minutes, index) => ({
        id: `activity-${instrument}-${index + 1}`,
        phase: index === 0 ? "intro" : index === 3 ? "wrapup" : "main",
        title: [
          "자료와 목표 확인",
          "선택 자료 함께 살펴보기",
          "활동 순서 정리",
          "돌아보고 다음 자료 정하기",
        ][index],
        minutes,
        teacherNotes: "교사가 실제 승인 자료에 맞추어 작성할 자리입니다.",
        alternative:
          "외부 앱을 사용할 수 없으면 구조화 단원의 자료 확인 목록을 이용합니다.",
        resources:
          index === 1
            ? [
                {
                  resourceId: refId,
                  versionId: `${refId}-v1`,
                  unitId: `${refId}-v1-unit-1`,
                },
              ]
            : [],
        appLinkIds: [],
      })),
      isDemo: true,
      updatedAt: SEED_DATE,
      revision: 1,
    });
  }
  data.issues.push({
    id: "issue-demo-flute",
    resourceId: "demo-flute-review",
    versionId: "demo-flute-review-v1",
    unitId: "demo-flute-review-v1-unit-1",
    blockId: null,
    category: "other",
    severity: "minor",
    description: "시연용 확인 항목의 표현을 더 명확히 정리해 주세요.",
    evidence: "가상 UI 검수 의견이며 교육 내용 평가가 아닙니다.",
    suggestion: "확인 목록 제목을 명확히 적기",
    resolution: null,
    status: "open",
    dismissalReason: null,
  });
  return data;
}
