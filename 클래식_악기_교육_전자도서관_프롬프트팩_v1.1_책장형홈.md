# 클래식 악기 교육 전자도서관: 단계별 바이브코딩 프롬프트팩

레슨 디자이너 · 한국어 웹 프로토타입 · v1.1 책장형 홈 개정판 · 2026-10-14

> 이 파일은 구현을 지시할 때 쓰는 설계·프롬프트 문서입니다. 앱 구현, 계정 생성, 데이터베이스 연결, 배포 또는 전문가 검수가 완료되었다는 보고서가 아닙니다. 현재 자료의 사실과 새로 제안하는 설계를 구분했습니다.

## 목차
1. 초보자를 위한 실행 순서
2. 원자료와 결정 기준
3. MVP 요구사항과 화면 설계
4. 기술 구성과 파일 구조
5. 데이터 모델·상태 전이·시드 계약
6. 한 번에 시작하는 통합 마스터 프롬프트
7. P00–P11 순차 구현 프롬프트
8. 검색 과제·자동 테스트·수동 확인
9. 버그 수정·재개·검수 요청 프롬프트
10. 선택 후속 단계와 상용화 경계
11. 원자료 인벤토리와 공식 기술 문서

## 1. 초보자를 위한 실행 순서

### 무엇을 만들게 되나요?
교사가 ‘악기 선택 → 자료 찾기 → 검수·권리 확인 → 수업안에 담기 → 연습 앱 열기 → 저장·출력 → 오류 신고’를 끝까지 시연할 수 있는 웹 프로토타입입니다. 교재 판매몰이나 학생 감시·평가 서비스부터 만들지 않습니다.

### 준비물
- AI 코딩 도구에서 열 수 있는 빈 작업 폴더 또는 기존 프로젝트
- 이 Markdown 파일 전체. 프로젝트 루트에 `PROMPT_PACK.md`로 두면 편합니다.
- 원자료 접근이 가능한 경우 아래 4개 문서. 접근할 수 없으면 본문 메타데이터 시드로 진행하고 실제 교재 본문은 비워 둡니다.
- 실제 학생 이름·사진·녹음·영상·학교 명단·비밀번호·API 키는 넣지 않습니다.

### 권장 경로: 한 단계씩
1. AI 코딩 도구에 작업 폴더를 열고 이 파일을 첨부합니다.
2. P00 블록만 복사하여 보냅니다. 기존 코드가 있으면 분석 결과부터 확인합니다.
3. P01부터 차례로 한 블록씩 보냅니다. 각 단계의 ‘화면에서 확인’과 자동 검사가 끝나면 다음 단계로 갑니다.
4. 오류가 나오면 해당 로그와 ‘버그 수정 프롬프트’를 보냅니다. 전체 앱을 다시 만들게 하지 않습니다.
5. P11 종료 뒤 로컬 데모를 확인합니다. 배포·실계정·실데이터 연결은 별도 결정입니다.

### 빠른 경로: 마스터 프롬프트
통합 마스터 블록을 한 번 보내되, 구현 AI가 단계별로 진행하고 P00의 범위·환경 충돌에서만 질문하도록 합니다. 긴 작업에서 맥락을 잃으면 재개 프롬프트를 사용합니다. 마스터와 순차 경로를 동시에 별도 작업창에서 실행하지 않습니다.

### 결과를 받는 형식
각 단계마다 ① 변경 파일 ② 실행한 명령과 성공/실패 ③ 화면 확인 방법 ④ 남은 문제 ⑤ 다음 단계의 다섯 항목을 요청합니다. 실행하지 못한 테스트는 ‘미실행’으로 기록하게 하세요. ‘빌드 성공’만으로 기능·보안·음악 내용 검증이 끝난 것은 아닙니다.

## 2. 원자료와 결정 기준

### 기준 문서
- [S1 개발 계획서](https://docs.google.com/document/d/1yep7kBlfDuPpwnpgokrTfucpaJA99SHHVbyF2FHEVE8): 이번 MVP의 우선 범위. 승인 모듈, 교안, 앱 링크, 오류와 판본 관리 중심.
- [S2 교육 웹앱 목록](https://docs.google.com/document/d/1UsiGthhLzDkh68ghJswdUfyIThbTdv_kPCigqX06nIc): URL 37개 확인. 이 문서를 읽었다고 사이트의 실행·안전·내용 정확성을 확인한 것은 아님.
- [S3 기존 지식 데이터셋](https://docs.google.com/document/d/1ZjYQY8XUNEKJQGZPltYP9fEG6gRjz-1bbF_0uwxZbNM): 바이올린 7개, 첼로·플루트·클라리넷 각 4개, 총 19개 항목/38개 질문/level 1–3. 미검수 출발 자료로 취급.
- [S4 이전 통합 대시보드 설계](https://docs.google.com/document/d/1zJnzhYaGzo6JH4RmFjtc1Wcd9hIXS2ogWF1MDx3Sn-0): 악기 전환·이어보기·교실 가독성은 활용하되, 카메라 교정·공통 진도·무환각·자동 배포는 이번 필수 범위에서 제외.

### 사실과 목표를 혼동하지 않기
| 구분 | 현재 확인한 것 | 이번 설계에서의 처리 |
|---|---|---|
| 콘텐츠 | 기존 JSON 지식 항목 19개 | `legacy-entry`로 원본 ID 유지, 전부 초안·권리 미확인 |
| 기획 목표 | 4악기 × 6모듈 = 24개 | 별도 `module-plan` 24개. 승인 콘텐츠 24개로 표시 금지 |
| 웹앱 | 목록 URL 37개 | 관리자 후보 목록. 초기 링크 점검 상태 `unchecked` |
| 전문가 | 섭외·검수 체계를 계획 | 실제 전문가 이름·승인일·서명을 지어내지 않음 |
| 효과 | 준비시간 감소 등을 검증할 계획 | 실적 차트·정확도 수치·학습효과를 생성하지 않음 |

문서 간 충돌 시 최신 사용자 결정 → S1 → 검증된 원문 사실 → 이 프롬프트의 제안 순으로 적용합니다. S3의 `verifiedContent`, `STRICT_ZERO_HALLUCINATION`은 과거 필드/문구이며 검수 증거나 정확도 보장이 아닙니다. 원본은 그대로 두고 새 정규화 모델에서 이름과 상태를 바꿉니다.

### 범위
**MVP P0**: 로컬 mock 저장소, 4악기 전자도서관, 검색/필터, 상세/단원 뷰어, 북마크/이어보기, 외부 앱 카드, 교사용 수업안, 관리자 편집, 검수 상태/이력/오류 신고, 출력, 접근성, 자동 테스트.

**선택 P1**: 승인 근거만 찾는 자료 안내 UI, 앱별 점검, 정적 PDF 자산 연결. 생성형 답변·자동 교정·실제 개인 진도는 포함하지 않습니다.

**후속 P2**: 실제 인증/권한, 다중 사용자 저장, 공동 편집, 앱 API/SSO 통합, 승인 콘텐츠 기반 AI, 동의 기반 학생 서비스. 별도 설계·승인·검증 후 진행합니다.

## 3. MVP 요구사항과 화면 설계

### 사용자와 시연 모드
- 교사: 승인·공개 가능한 자료 검색, 수업안 편집·저장·복제·출력, 오류 신고.
- 검수자: 배정 자료 확인, 위치별 의견, 재검수. 프로토타입에서는 가상 역할입니다.
- 편집 관리자: 메타데이터/앱 후보 관리, 검수 의뢰·수정, 공개 여부 관리.
- 모든 화면 상단: ‘시연용 프로토타입 · 실계정 인증 없음 · 가상 데이터’.
- 역할 전환 스위치는 화면 시연 장치입니다. 실제 보안 경계가 아니며 정적 번들에 포함된 데이터는 비밀이 아닙니다. 실제 미공개 교재·민감 자료는 넣지 않습니다.

### 정보 구조
| 경로 | 주요 구성 | 핵심 행동/예외 |
|---|---|---|
| `/` | 4악기 선택, 이어보기, 수업 준비 바로가기 | 기록 없으면 시작 안내, 삭제된 자료면 이어보기 초기화 |
| `/library` | 검색, 악기/종류/난이도/목표/주제 필터, 정렬, 결과수 | URL query 반영, 초기화, 검색 0건 안내 |
| `/library/[resourceId]` | 설명, 출처·권리·버전·검수 범위, 단원 | 없는 ID는 404, 보류된 자료는 사용 중지 안내 |
| `/library/[resourceId]/units/[unitId]` | 목차, 본문/도식/대체텍스트, 확대 | 전후 단원, 북마크, 앱 연결, 오류 신고 |
| `/practice` | 악기별 앱 카드, 학습목표, 검증·호환성 표시 | 외부 새 탭, 복귀 안내, 정적 대체 자료 |
| `/bookmarks` | 북마크·최근 자료 | 빈 상태, 해제, 상태 변경 경고 |
| `/teacher/plans` | 저장 교안 목록 | 새로 만들기, 복제, 제목 검색 |
| `/teacher/plans/[planId]` | 목표·대상수준·시간·준비물·활동 편집 | 자료 버전 고정, 총시간, 저장·출력 |
| `/admin/resources` | 초안 포함 메타데이터 목록 | 편집/검수 요청, 권리 누락 경고 |
| `/admin/apps` | 37개 후보, 악기체계·URL·상태·단원 연결 | URL 검증, 중복 검사, 점검 증거 기록 |
| `/admin/reviews/[resourceId]` | 버전 비교, 지적·수정·재검토 이력 | 상태 전이 조건, 반려 사유, 공개 차단 |
| `/admin/issues` | 위치별 오류 신고 목록 | 심각도·처리상태, 안전 이슈 보류 |

### 필수 요구사항 ID
- R01 악기: `violin`, `cello`, `flute`, `clarinet`만 주 내비게이션. 표시명 ‘플루트’, 검색 별칭 ‘플룻’ 허용.
- R02 목록: 검색어는 제목·주제어·목표·설명에 적용. 여러 필터는 AND, 같은 필터의 다중 선택은 OR. 공백 정리, Unicode 정규화, 영문 대소문자 무시. URL 복원과 브라우저 뒤로가기 지원.
- R03 종류: 교재/악보/도식/활동자료/수업안. 파일 없는 항목에 가짜 다운로드 버튼 금지.
- R04 공개: 실제 자료는 해당 버전의 승인+권리확인+필수 메타데이터+공개 상태가 모두 있어야 공개 가능. 이 조건은 UI만 아니라 데이터 조회/명령 함수에서 검사.
- R05 상세: 검수자 표기는 동의된 표시명만, 검수 범위·버전·날짜를 분리. 미검수는 ‘교육 내용 검수 전’.
- R06 단원: 본문은 정제된 구조화 블록. 외부 HTML/스크립트 실행 금지. 이미지 alt, 악보 확대와 텍스트 안내, 음원 수동 재생.
- R07 저장: 북마크/최근 위치/수업안은 이 브라우저에만 저장. 새로고침 유지, 스키마 버전, 저장 실패/손상 복구/초기화 확인.
- R08 연습 앱: 외부 링크와 단원 연결만. 열었다고 연습 완료·점수·학습효과 기록 금지.
- R09 교안: 시간 합계가 전체 시간과 맞지 않으면 수정 안내. 인쇄에 출처·버전·데모 여부 포함.
- R10 관리자: URL, 난이도, 단원 매핑, 검수/권리/공개 상태 편집. 임의 승인 드롭다운 금지.
- R11 검수: 위치별 중대/일반 의견, 근거, 수정, 재검수, 승인/반려, 버전 변경 이력.
- R12 안전: 카메라·마이크·위치 권한 요청 없음. 실아동 데이터/분석 SDK/외부 AI 요청 없음.
- R13 접근성: 한국어 문서 언어, 키보드, focus, 레이블, 오류 안내, 명암, 텍스트 확대, 반응형.
- R14 정직성: 샘플 승인은 ‘승인 흐름 시연’으로 별도 표기. 실제 승인·성과 총계와 합산 금지.

### UI 제안
따뜻한 종이색 배경, 진한 남색 본문, 악기별 색은 보조 표식으로만 사용합니다. 기본 본문 18px, 줄간격 1.6, 넓은 행간·여백, 읽기 본문 최대 약 72ch, 핵심 버튼 최소 44×44px을 목표로 합니다. 본문 일반 텍스트 명암비 4.5:1, 큰 글자 3:1 이상을 확인합니다. 글자 크기는 사용자 확대 설정을 존중합니다. 360px 모바일, 768px 태블릿, 1440px 데스크톱, 1920px 교실 화면을 확인하고 200% 확대 시 기능이 잘리지 않게 합니다. 애니메이션은 최소화하고 `prefers-reduced-motion`을 반영합니다.

## 4. 기술 구성과 파일 구조

### 기본 선택
신규 프로젝트는 Next.js App Router + TypeScript + Tailwind CSS + Zod + Vitest + React Testing Library + Playwright로 제안합니다. Next.js는 목록/상세 라우팅과 추후 서버 저장소 분리를 위한 선택입니다. 초기에는 외부 백엔드 없이 동작합니다. 아이콘 라이브러리는 이미 있으면 재사용하고 새 의존성은 필요한 것만 추가합니다.

이 문서는 특정 버전을 ‘최신’으로 고정하지 않습니다. 구현일의 공식 문서와 저장소 lockfile을 확인하고 호환되는 버전을 정한 뒤 정확한 버전을 기록합니다. 기존 Vite/React 프로젝트가 있으면 Next.js로 무조건 이전하지 않습니다. 기능과 데이터 계약을 기존 라우터·스타일·테스트 체계에 맞게 적용하고 큰 이전은 별도 제안합니다.

기본 mock은 Promise 기반 repository 인터페이스로 읽기/쓰기합니다. localStorage는 브라우저 전용 어댑터에서만 접근하며 SSR 중 접근하지 않습니다. 초기 로딩/복원 완료 상태를 분리해 hydration 불일치와 첫 렌더의 저장 덮어쓰기를 막습니다. Zustand 등 전역 상태 라이브러리는 필요성이 확인될 때만 사용합니다.

### 권장 구조: 기존 프로젝트에서는 동등한 구조로 매핑
```text
lesson-designer-library/
  PROMPT_PACK.md
  README.md
  docs/
    SPEC.md  ARCHITECTURE.md  DATA_CONTRACT.md
    SOURCE_MANIFEST.md  ASSET_RIGHTS.md  STATUS.md
    TEST_REPORT.md  DEMO_SCRIPT.md  HANDOFF.md
  public/demo/                  # 자체 만든 중립 데모 도식만
  src/app/
    layout.tsx  page.tsx  globals.css
    library/page.tsx
    library/[resourceId]/page.tsx
    library/[resourceId]/units/[unitId]/page.tsx
    practice/page.tsx  bookmarks/page.tsx
    teacher/plans/page.tsx
    teacher/plans/[planId]/page.tsx
    admin/resources/page.tsx  admin/apps/page.tsx
    admin/reviews/[resourceId]/page.tsx  admin/issues/page.tsx
    loading.tsx  error.tsx  not-found.tsx
  src/components/
    layout/  library/  viewer/  practice/  lesson-plan/  review/  ui/
  src/domain/
    schemas.ts  types.ts  visibility.ts  review-machine.ts
    search.ts  url-policy.ts  lesson-plan.ts
  src/data/
    legacy-manifest.json  module-plans.json  app-catalog.json
    demo-fixtures.ts  seed.ts
  src/repositories/
    contracts.ts  mock-repository.ts  local-storage.ts  index.ts
  src/hooks/  src/lib/
  tests/unit/  tests/component/  tests/e2e/
  package.json  [package-manager-lockfile]
```

화면 컴포넌트가 seed 배열이나 localStorage를 직접 고치지 않고 repository 명령을 호출하게 합니다. URL 정책·공개 조건·상태 전이는 순수 함수로 분리해 테스트합니다.

## 5. 데이터 모델·상태 전이·시드 계약

### 데이터 분리 원칙
`legacyEntry`는 원자료 지식 항목, `modulePlan`은 24개 편집 목표, `resource`는 서고 자료, `resourceVersion`은 불변 콘텐츠 버전, `unit`은 뷰어 단원입니다. 다대다 연결로 관리하며 ID 개수를 같게 만들지 않습니다. 모듈 1개가 여러 항목을 참조하거나 출발 항목이 아직 없는 경우도 허용합니다.

### 최소 타입 계약
아래는 구현용 기준이며 Zod 스키마로 런타임 입력도 검증합니다. ID는 안정적인 문자열, 시간은 ISO 8601, 알 수 없는 값은 null로 두고 추정값을 채우지 않습니다.

```typescript
type Instrument = 'violin' | 'cello' | 'flute' | 'clarinet';
type ReviewState = 'draft' | 'in_review' | 'changes_requested'
  | 're_review' | 'approved' | 'rejected';
type PublicationState = 'private' | 'published' | 'on_hold';
type RightsState = 'unknown' | 'pending' | 'cleared' | 'restricted';
type DatasetKind = 'legacy_unreviewed' | 'synthetic_demo' | 'reviewed_real';
type LinkStatus = 'unchecked' | 'available' | 'broken' | 'restricted';
interface SourceRef {
  id: string; title: string; url: string | null;
  chapter: string | null; pageRange: string | null;
  originalFieldName?: string;
}
interface RightsRecord {
  state: RightsState; holder: string | null; license: string | null;
  evidenceRef: string | null; allowView: boolean; allowPrint: boolean;
  allowDownload: boolean; allowRedistribute: boolean;
  checkedAt: string | null; checkedBy: string | null;
}
interface Resource {
  id: string; title: string; instrument: Instrument;
  instrumentSystem: string; kind: 'textbook'|'score'|'diagram'|'activity';
  level: 1|2|3; objectives: string[]; topics: string[];
  prerequisites: string[]; estimatedMinutes: number;
  datasetKind: DatasetKind; currentDraftVersionId: string;
  publishedVersionId: string | null; publicationState: PublicationState;
  sourceRefs: SourceRef[]; legacyEntryIds: string[]; modulePlanIds: string[];
}
interface ResourceVersion {
  id: string; resourceId: string; version: string;
  reviewState: ReviewState; rights: RightsRecord; unitIds: string[];
  aiUsage: string; reviewScope: string | null;
  reviewerDisplayName: string | null; reviewerNameConsent: boolean;
  reviewedAt: string | null; approvedBy: string | null;
  approvedAt: string | null; approvalEvidenceRef: string | null;
  basedOnVersionId: string | null; changeSummary: string;
  revision: number; createdAt: string;
}
interface Unit {
  id: string; resourceVersionId: string; order: number; title: string;
  blocks: Array<{ id: string; type: 'paragraph'|'image'|'score'|'audio';
    text?: string; src?: string; alt?: string; caption?: string }>;
  appLinkIds: string[];
}
interface AppLink {
  id: string; title: string; url: string; sourceDocumentUrl: string;
  instruments: Instrument[]; instrumentSystem: string | null;
  scope: 'mvp_candidate'|'common_tool'|'other'|'excluded_mismatch';
  purpose: string; level: number | null; status: LinkStatus;
  checkedAt: string | null; checkEvidence: string | null;
  contentAccuracyChecked: boolean; requiresCamera: 'yes'|'no'|'unknown';
  requiresLogin: 'yes'|'no'|'unknown'; enabled: boolean;
  fallbackResourceId: string | null;
}
interface ModulePlan {
  id: string; instrument: Instrument; slot: 1|2|3|4|5|6;
  title: string; legacyEntryIds: string[]; mappingState: 'proposed'|'reviewed';
}
interface ReviewIssue {
  id: string; resourceId: string; versionId: string; unitId: string | null;
  blockId: string | null; category: 'music'|'pedagogy'|'safety'|'rights'|'other';
  severity: 'critical'|'major'|'minor'; description: string;
  evidence: string; suggestion: string; resolution: string | null;
  status: 'open'|'fixed'|'verified'|'dismissed'; dismissalReason: string | null;
}
interface ReviewEvent {
  id: string; resourceId: string; versionId: string;
  from: ReviewState; to: ReviewState; actorId: string; role: string;
  reason: string; at: string; snapshotRevision: number;
}
interface LessonPlan {
  id: string; title: string; instrument: Instrument; targetLevel: 1|2|3;
  objectives: string[]; durationMinutes: number; materials: string[];
  activities: Array<{ id: string; phase: 'intro'|'main'|'wrapup';
    title: string; minutes: number; teacherNotes: string; alternative: string;
    resources: Array<{resourceId: string; versionId: string; unitId: string}>;
    appLinkIds: string[] }>;
  isDemo: boolean; updatedAt: string; revision: number;
}
interface Bookmark { resourceId: string; versionId: string; unitId: string | null }
interface ReadingPosition { resourceId: string; versionId: string; unitId: string; updatedAt: string }
```

학생·학교·성적·얼굴·음성 테이블은 만들지 않습니다. 교안 targetLevel은 자료 난이도이며 실제 학생 진단이 아닙니다. `ReviewIssue.fixed`는 수정자가 고쳤다는 주장이고 `verified`는 재검수 확인이므로 분리합니다. 변경 이력은 mock에서도 기존 이벤트 수정/삭제 대신 새 이벤트를 추가합니다. 그러나 localStorage는 위·변조 방지 감사 저장소가 아니므로 실제 감사 증거로 쓰지 않습니다.

### 공개 판정
`canPublish(version, resource, issues)`는 다음을 모두 확인합니다.
1. 실제 콘텐츠는 `reviewed_real`, 검수 `approved`, 승인 증빙/승인자/일시/범위가 존재.
2. 권리 `cleared`와 열람 허용, 필수 출처/악기체계/수준/단원 메타데이터 충족.
3. 해당 버전에 미해결 critical/major 지적 없음. dismissed는 사유 필수이며 안전·핵심 음악 이슈를 편집자 혼자 무시할 수 없음.
4. 공개 상태가 published이고 승인된 해당 versionId와 일치.
5. 일반 공개 조회에는 이 판정만 통과. 교안·북마크의 직접 ID 조회에도 동일 적용.

합성 데모는 별도 `demoVisible` 판정으로 시연 서고에만 보입니다. 공개 승인 함수를 우회해 실제 승인으로 만들지 않습니다. 기본 화면에서 ‘데모 서고’임을 계속 알리고, ‘실자료 공개 보기’는 승인 자료가 아직 없으면 정직하게 0건을 표시합니다. 기존 19개 초안은 관리자 메타데이터 목록에만 있습니다. 원문 내용은 권리와 검수 확인 전 공개하지 않습니다.

### 검수 상태 전이
| 현재 | 행동/다음 | 조건 |
|---|---|---|
| draft | 검토 요청 → in_review | 버전·출처·검토범위 존재, 검수자 역할 배정 |
| in_review | 수정 요청 → changes_requested | 위치·심각도·근거·수정요청 기록 |
| changes_requested | 수정 제출 → re_review | 새 버전/수정내역, 각 지적에 응답 |
| re_review | 재수정 → changes_requested | 미해결 지적 기록 |
| in_review/re_review | 승인 → approved | 실제 승인 증거와 미해결 중대 오류 0, 검수 범위 명시 |
| in_review/re_review | 반려 → rejected | 반려 사유 필수 |
| rejected | 새 초안 버전 생성 → draft | 기존 버전 보존, 새 ID와 수정 요약 |
| approved | 내용 개정 → 새 draft | 기존 승인 버전 불변, 승인 승계 금지 |

승인과 공개는 별도 행동입니다. 권리 확인 전에는 승인되었어도 공개할 수 없습니다. 안전/중대 오류 신고가 들어오면 해당 공개본을 on_hold로 전환하는 시연을 제공하고, 교안에서 ‘보류된 자료 사용 중’ 경고를 띄웁니다. 새 판본을 저장했다고 기존 교안 버전을 몰래 바꾸지 않습니다. ‘새 판본 비교 후 적용’은 교사가 선택합니다.

### 저장소 계약
`listResources(query, audience)`, `getResource(id, versionId, audience)`, `getUnit(...)`, `listApps(...)`, `saveLessonPlan(plan, expectedRevision)`, `toggleBookmark(...)`, `recordReadingPosition(...)`, `transitionReview(command, expectedRevision)`, `reportIssue(...)`, `updateApp(...)`를 정의합니다. 모든 읽기와 쓰기는 Promise를 반환하고 `not_found`, `validation_error`, `storage_unavailable`, `conflict`, `not_allowed` 오류를 UI에서 구분합니다. double-click 중복 이벤트를 막고 수정 revision 충돌 시 덮어쓰기 대신 새로고침/복사 안내를 제공합니다.

### 시드 수량과 표기
- `legacy-manifest.json`: 아래 원본 19개 ID의 메타데이터. `draft`, rights unknown, approvedAt null. 본문은 기본 포함하지 않음.
- `module-plans.json`: 4악기마다 아래 6개 슬롯, 총 24개의 기획 레코드. 기존 19개를 억지로 24개로 부풀리지 않음.
  1. 악기 이해·관리
  2. 기본 자세
  3. 첫 소리 또는 개방현
  4. 기초 운지와 기보
  5. 기본 리듬과 짧은 연습
  6. 한 회차 수업 적용
- `demo-fixtures.ts`: 악기별 중립 합성 자료 2개(교재형 1, 활동/악보 자리표시자형 1), 합계 8개, 각각 단원 2개. 실제 운지·호흡·자세 지시 대신 ‘교사가 승인된 자료를 확인할 자리’라는 구조 예시를 사용.
- 승인 흐름 데모는 synthetic_demo로만 구성. 모든 화면/출력에 ‘승인 절차 시연 · 교육 내용 검증 아님’ 워터마크. 실자료 승인 집계에서 제외.
- 악기별 교안 1개, 합계 4개. 40분 예시(도입 5, 활동 10+15, 정리 10), 가상 제목·목표만 사용.
- 앱 목록 37개 보존. MVP 관련 앱만 우선 표시하고 그 밖의 앱은 관리자 후보 목록에 보관.
- 실제 저작권 보호 교재·악보·음원·사진·폰트의 복제·재배포 권한은 자동으로 있다고 가정하지 않음.


## 책장형 홈 적용 계약 — 이번 판 필수 추가

사용자가 요청한 책 진열대 배경·가지런한 책 형태 PDF 교재·클릭 열람을 홈에 적용합니다. 아래 부록의 공통 설계가 기존 홈 설명을 보완하며 충돌 시 책장형 홈을 우선합니다. 현재 실제 PDF가 없는 자료는 PDF 준비 중/구조화 단원으로 구분합니다. 검색·악기분류·수준·읽던 위치·영상/연습 연결·권리·검수 기능은 유지합니다.

P00에는 BOOKSHELF_SPEC, P01에는 책장+목록 대안, P02에는 ReadingAsset/BookPosition, P03에는 판본별 위치 저장, P04에는 책장 필터, P05에는 PDF/구조화 뷰어 분기, P06에는 연습 후 복귀, P10에는 320px/200% 확대·페이지 복원·권리 차단, P11에는 책장형 데모를 추가합니다. 이 적용 계약은 아래 모든 P단계와 마스터 프롬프트의 입력입니다.

## 6. 한 번에 시작하는 통합 마스터 프롬프트

이 파일 전체를 코딩 AI에 첨부하고 아래 블록을 보내세요. 파일을 첨부하지 않은 채 블록만 보내면 세부 시드/요구사항 근거가 부족할 수 있습니다.

```text
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

첨부한 프롬프트팩의 P00~P11을 차례대로 수행하여 로컬에서 완결된 프로토타입을 만들어라. 핵심 흐름은 검색→상세/단원→수업안→연습 앱→저장/출력→오류 신고이다. 관리자 화면에는 검수/권리/버전과 앱 후보 관리가 있어야 한다. 네트워크나 로그인 없이 합성 데모 데이터로 작동해야 한다.

먼저 기존 저장소/환경/실행 명령을 분석하고 개발 계획을 작성하라. 기존 프로젝트가 없다면 선택 스택으로 초기화한다. 주요 화면부터 만들고 저장소 계약·검수 상태 전이·접근성·테스트를 단계마다 연결한다. 37 URL을 자동 실행하거나 교재 전체를 임의로 복사하지 마라. 실제 승인자료가 0개이면 0개라고 표시하고 합성 시연자료를 별도 모드로 제공하라.

각 단계 완료 기준을 만족하면 다음 단계로 이어가되, 큰 아키텍처 변경·외부 계정/권한/비용/개인정보가 필요하면 해당 단계만 멈추고 이유를 질문하라. UI 자리표시자를 완성 기능이라고 보고하지 마라. 최종적으로 lint/typecheck/unit/component/e2e/build를 실행하고 실행한 증거와 못한 검사를 구분하라. README, DEMO_SCRIPT, TEST_REPORT, HANDOFF를 작성하고 프로토타입을 로컬에 남겨라. 자동 배포하지 마라.
```

## 7. P00–P11 순차 구현 프롬프트

각 블록은 단계의 목적·입력·안전 경계·출력·검증을 함께 담았습니다. 새 대화에서 쓸 때도 이 파일과 기존 작업 폴더를 제공하면 됩니다. 앞 단계 산출물이 없으면 다음 단계 기능을 임의로 추측하지 말고 필요한 파일부터 최소한으로 준비하게 하세요.

### P00. 현황 분석과 구현 계약

화면에서 확인: 문서에 4악기, 24개 목표, 19개 미검수 항목, mock·배포 제외가 분명히 나옵니다.

```text
[P00: 현황 분석과 구현 계약]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

코드를 바꾸기 전에 루트 AGENTS.md/README/package.json/lockfile/라우터/테스트/스타일/기존 변경사항을 확인하라. 빈 폴더면 신규 프로젝트로 기록한다. .env 내용이나 비밀값은 출력하지 마라. 새 스택 선택은 공식 Next.js 설치 문서와 도구 호환성을 확인하고 근거 URL/확인일/선택 버전을 적어라. 기존 Vite 등이면 그대로 사용할 구조 매핑을 제안한다.
산출물: docs/SPEC.md에 R01~R14, 범위/비범위/역할/경로/예외를 기록; ARCHITECTURE.md에 데이터 흐름과 mock 교체 경계; SOURCE_MANIFEST.md에 S1~S4와 확인/미확인 상태; STATUS.md에 P00~P11 체크리스트. 24모듈 계획과 19지식 항목의 다대다 연결을 설계한다. 원자료 접근 불가 시 메타데이터와 중립 fixture로 진행한다.
검증: 요구사항-화면-테스트 ID 대응표를 만들고 누락을 자체 점검하라. 개발 범위와 큰 충돌이 없다면 문서를 만든 뒤 멈춰 결과를 보고하라.
```

### P01. 기초 실행 환경과 디자인 시스템

화면에서 확인: 상단에 시연용 배너와 4악기 선택이 있고 모든 주요 메뉴가 빈 화면 안내까지 연결됩니다.

```text
[P01: 기초 실행 환경과 디자인 시스템]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

P00 계약을 따라 앱을 초기화하거나 기존 앱에 빈 경로를 추가하라. 새 프로젝트는 공식 설치법을 확인하여 TypeScript strict, 한국어 html lang, App Router, Tailwind를 구성한다. 기존 package manager 하나와 lockfile 하나를 유지한다. dev/build/lint/typecheck/test/test:e2e 스크립트를 실제 도구 명령으로 설정한다. lint를 build의 부수효과로 가정하지 마라.
공통 헤더, 주 내비게이션(서고/연습실/수업 준비/북마크), 가상 역할 전환, 지속 데모 배너, 악기 선택, 컨테이너, 버튼, 필드, 배지, 빈상태, 오류/로딩 컴포넌트를 만든다. 본문 18px/넉넉한 줄간격/명확한 focus/44px 터치 목표를 적용한다. 아이콘 단독 버튼에는 접근 가능한 이름을 붙인다. 로그인된 것처럼 보이는 실사용자 프로필을 만들지 마라.
검증: 모든 경로가 렌더링되고 없는 경로가 404인지 확인한다. 모바일 360px 가로 넘침, 키보드 Tab 이동, 200% 확대, 시스템 reduced-motion을 확인한다. lint/typecheck/build를 실행한다.
```

### P02. 도메인 스키마와 안전한 시드

화면에서 확인: 관리용 데이터 요약에 원본 항목 19, 모듈 목표 24, 앱 후보 37이 서로 다른 수치로 표시됩니다.

```text
[P02: 도메인 스키마와 안전한 시드]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

DATA_CONTRACT와 이 파일의 타입을 TypeScript/Zod로 구현하라. Resource/Version/Unit/ModulePlan/LegacyEntry/AppLink/ReviewIssue/Event/LessonPlan/Bookmark/ReadingPosition을 분리하고 FK 무결성 검증을 작성하라. level은 현재 1~3만 쓰고 고급 단계를 만들어 채우지 마라.
19 legacy 메타데이터와 24 modulePlan, 37 app 후보를 이 파일 부록에서 구성하라. 원자료 ID/URL을 그대로 보존하며 verifiedContent를 자동 승인하지 마라. legacy 본문은 placeholder, rights unknown, review draft, approval null이다. 8 synthetic_demo 자료/16단원/4교안을 만든다. 데모 본문은 새로 작성한 중립 UI 예시이고 교육적으로 검증된 주법이라고 말하지 마라. 승인 시연·검수중·수정중·보류·권리미확인 등 fixture를 준비하되 실자료와 분리한다.
검증: 19/24/37 수량, 7+4+4+4 분포, 38 질문은 원자료 통계로만 기록, 모든 참조의 유효성, 중복 ID 없음, legacy 승인 0건을 단위 테스트한다. 실제 교재 내용을 내려받거나 재배포하지 마라.
```

### P03. mock 저장소와 브라우저 저장 복구

화면에서 확인: 새로고침해도 가상 교안이 유지되고 저장 실패를 일부러 만들면 실패 안내와 복구 선택지가 나옵니다.

```text
[P03: mock 저장소와 브라우저 저장 복구]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

Promise 기반 repository 인터페이스와 mock/localStorage 구현을 만들고 UI가 이를 통해서만 데이터에 접근하도록 하라. 조회 audience를 demo/public/admin으로 구분하고 public은 canPublish 검사, demo는 합성 데이터만 조회하게 하라. URL/검색/상태 전이 로직은 순수 함수로 분리한다.
저장 key는 lesson-designer-library:v1처럼 앱 전용이며 schemaVersion을 기록한다. SSR window 접근 금지, 클라이언트 복원 전 초기 데이터를 저장하여 기존 교안을 덮어쓰는 오류를 방지하라. 복구 불가능한 JSON/이전 스키마/용량 초과/차단된 localStorage는 예외를 잡고 임시 메모리 모드와 사용자 알림을 제공한다. 데이터 초기화는 확인 대화상자를 거치며 취소 시 유지된다. 낙관적 저장 실패를 성공 토스트로 표시하지 마라. 교안/검수 변경은 expectedRevision 충돌을 검사한다.
검증: 새로고침 유지, 저장 차단, 손상 JSON, 중복 클릭, 두 탭 충돌, 초기화 취소/확정 테스트를 만든다. 실제 인증이 없다는 한계를 README에 기록한다.
```

### P04. 전자도서관 검색과 필터

화면에서 확인: ‘플룻’ 검색이 플루트 자료를 찾고 필터 상태가 주소와 뒤로가기에서 유지됩니다.

```text
[P04: 전자도서관 검색과 필터]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

/library를 구현하라. 제목/주제어/목표/설명 검색, 악기/종류/level/학습목표 필터, 제목순/최근수정순 정렬, 결과수, 활성 필터 chip과 전체 초기화를 제공한다. 검색/필터/정렬은 URL query에 저장하고 refresh/back/forward에서 복원하라. invalid query는 안전한 기본값으로 정규화한다. 플룻/플루트 별칭과 Unicode 정규화, 영문 대소문자/공백 처리를 구현하라.
기본은 합성 ‘데모 서고’로 표시하고 실제자료 공개보기는 승인자료 0건의 안내를 제공한다. 관리자 초안 목록은 별도 경로로 두고 공개 필터를 조작해 legacy가 노출되지 않도록 repository에서 판정한다. 카드에는 악기·난이도·종류·버전·데모/검수 표시, 간단 목표와 북마크를 배치한다. 자료 카드 전체 클릭과 안쪽 버튼의 이벤트 충돌을 막는다.
검증: 이 파일 검색 과제 10개를 자동화하고 합성 fixture에만 적용하라. no-result에는 검색어 수정/필터 해제 버튼이 있어야 한다. 키보드만으로 검색·선택·초기화 가능하게 하라.
```

### P05. 자료 상세와 단원 뷰어

화면에서 확인: 자료에서 단원으로 들어가면 목차·판본·권리·데모 표시가 보이고 북마크와 이어보기가 작동합니다.

```text
[P05: 자료 상세와 단원 뷰어]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

상세에는 목차, 목표/선수학습/시간/난이도, 출처 문서와 페이지 표기, 권리, AI 활용, 판본, 검수 범위를 제공하라. 원자료에서 읽어온 페이지 범위는 ‘원자료 메타데이터 · 원문 대조 전’으로 표시하라. 데모 자료를 정식 출판 교재라고 쓰지 마라.
단원 뷰어는 이전/다음·목차·본문·중립 도식·확대·북마크·수업안에 담기·관련 앱·오류 신고를 포함한다. HTML 문자열 실행을 피하고 검증된 구조화 블록으로 렌더링하라. 파일이 없으면 ‘자료 파일 준비 중’ 안내, 권리상 인쇄/다운로드 불가하면 버튼과 이유를 표시하라. 음원은 사용자가 재생을 눌렀을 때만 작동하고 정지 버튼을 제공한다. 앱 이동/라우트 변경 시 재생 중지.
최근 위치는 resource/version/unit 단위로 저장한다. 삭제/보류/새 버전 발생 시 이전 위치가 유효한지 검사하고 대체 경로를 안내한다. 상세 URL을 직접 입력해도 공개 조건을 우회할 수 없어야 한다.
검증: 없는 resource/unit, 다른 자료의 unit, 권리 미확인, 보류된 버전, 200% 확대, focus 복귀, 뒤로가기, 음원 자동재생 없음 테스트를 수행하라.
```

### P06. 악기 연습실과 외부 앱 안전 연결

화면에서 확인: 단원에서 관련 앱의 목적과 점검 전 상태를 보고 새 탭으로 이동할 수 있고 원래 수업 화면이 남습니다.

```text
[P06: 악기 연습실과 외부 앱 안전 연결]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

/practice와 단원의 관련 앱 카드를 구현하라. 후보 URL은 부록의 원문을 보존하라. MVP 우선 후보는 violin-edu, cello-edu, flute-edu, flute-fingering-edu, clarinet-fingering-edu(#instrument=Bb)이며 공통 메트로놈/ScoreForge는 별도 표시한다. 이 선정은 문서 기반 후보이며 실행/교육 정확성 검증 완료가 아니다.
unchecked는 ‘점검 전’, available은 실행 확인일과 범위를 표시한다. HTTP 성공만으로 운지 정확성을 승인하지 마라. 표준 Bb 보엠식과 clarimini/clarii를 구별하고 클라리미니를 표준 클라리넷 단원에 매핑하면 오류로 거부한다. sax-fingering-coach는 문서 설명과 이름이 충돌하므로 체계 미확인/비활성으로 둔다. 카메라형 앱은 기본 비활성, 별도 점검 전 학생 사용 권장 금지.
외부 이동은 검증된 https URL만 허용하고 javascript/data/file/protocol-relative URL을 거부한다. 새 탭에는 noopener noreferrer, 외부 사이트 이동 안내와 복귀 방법을 제공한다. 토큰/학생정보를 query로 전달하지 않는다. iframe 강제 삽입·CORS 우회·앱 코드 복사·로그인 통합은 하지 않는다. 앱 열기는 진도 완료가 아니다. 깨진 링크/접근제한에는 정적 대체자료 안내.
검증: URL 정책, #instrument=Bb 보존, 체계 불일치 차단, 외부 링크 속성, unavailable 카드, 새 탭 후 원래 단원 유지 테스트. 외부 사이트의 실제 정상 작동은 별도 수동 점검 기록으로 분리하라.
```

### P07. 교사용 수업안 만들기와 출력

화면에서 확인: 교사가 40분 교안을 저장·복제하고 인쇄 미리보기에서 출처·판본·데모 표시까지 확인합니다.

```text
[P07: 교사용 수업안 만들기와 출력]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

교안 목록/편집 화면을 구현하라. 필드는 제목, 악기, 대상수준, 목표, 전체 시간, 준비물, 도입/활동/정리, 교사 메모, 대체활동이다. 자료와 단원은 resourceId/versionId/unitId로 고정하고 앱은 ID로 연결한다. 단원에서 담으면 중복을 알리고 해당 교안으로 이동할 선택지를 제공한다. 저장·수정·복제·삭제(확인)·인쇄를 구현하라.
활동 순서는 위/아래 버튼으로도 변경 가능하게 한다. 분 단위 양의 정수, 전체 시간과 합계 차이, 필수 제목/목표를 검증하라. 40분 fixture는 5+10+15+10분이다. 실제 학생 이름 필드를 만들지 마라. mock 저장임을 표시하고 ‘클라우드에 안전 저장됨’이라는 문구를 쓰지 마라.
인쇄 CSS는 메뉴/편집 버튼을 숨기고 제목·활동·시간·출처/판본·데모 워터마크를 남긴다. 권리상 인쇄 불가한 본문/이미지는 출력하지 않고 제한 안내와 메타데이터만 남긴다. 보류/새버전 자료는 경고하고 사용자 선택 없이 버전을 바꾸지 마라. 저장하지 않은 변경 후 이동/새로고침 안내를 제공한다.
검증: 악기별 1개 교안 생성→저장→새로고침→복제→출력 미리보기, 시간 불일치, 저장 실패, 오래된 revision, 반복 클릭 중복, 취소 후 상태 유지 테스트.
```

### P08. 관리자 자료와 앱 관리

화면에서 확인: 관리자가 앱 후보 37개와 검수 전 지식 항목 19개를 별도로 관리하고 잘못된 URL은 저장되지 않습니다.

```text
[P08: 관리자 자료와 앱 관리]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

/admin/resources와 /admin/apps를 구현하라. 자료에는 제목/악기체계/종류/단원/level/목표/주제/출처/권리/앱 연결 편집을 제공한다. 승인 상태를 임의 드롭다운으로 고치지 않고 다음 단계의 상태 전이 명령을 사용한다. 필수 누락 항목과 공개 불가 이유를 나열하라.
37 앱 후보를 제목/악기/체계/scope/점검상태로 검색하고 URL/단원/난이도/활성화/점검일/증거를 편집하게 한다. URL을 저장하기 전에 URL 정책과 중복을 검사하며, 자동 서버 fetch 기반 링크 검사기는 구현하지 마라(SSRF 등 별도 설계 필요). 지워야 할 필요가 없으면 보관/비활성으로 처리한다.
24 modulePlan의 기획 상태와 19 legacy 매핑을 보여 주되 ‘완성 모듈 24’로 쓰지 마라. 관리자에서도 실제 교재 본문 미확인 상태는 유지한다. 데모 역할 스위치는 인증이 아니며 새로고침/직접 URL로 접근 가능하다는 설명을 눈에 띄게 둔다.
검증: 잘못된 URL/중복/level 범위/체계 불일치/필수 누락을 거부하고 저장 취소 시 원값 보존. 편집이 카드와 필터에 일관되게 반영되는지 확인하라.
```

### P09. 전문가 검수와 오류·판본 흐름

화면에서 확인: 초안에서 수정·재검수를 거쳐 승인 시연하고 권리 미확인 때문에 공개가 막히는 이유까지 볼 수 있습니다.

```text
[P09: 전문가 검수와 오류·판본 흐름]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

review-machine을 단일 도메인 로직으로 구현하라. draft→in_review→changes_requested→re_review→approved/rejected를 지원하고 승인과 published를 분리한다. 검토 의견에 버전/단원/블록 위치, 범주, 심각도, 근거, 제안, 수정 결과와 재확인을 담는다. 중대 오류가 남거나 권리가 불명확하면 공개 차단 이유를 표시한다.
승인된 버전 수정은 새 draft를 만들고 이전 승인 스냅샷과 교안 참조를 보존한다. 이벤트는 append-only 형태로 관리하되 mock은 감사 보안을 보장하지 않는다고 명시한다. 승인 시연은 합성 fixture에서만 실행되며 실자료 approvedAt/전문가명/증거를 AI가 생성하지 마라. 가상 검수자 A 등 시연용 이름을 사용한다.
교사 오류 신고는 제목/내용/범주/자료버전/위치로 구성하고 이메일·학생정보를 요구하지 마라. 안전 또는 핵심 음악 오류는 on_hold, 일반 오류는 검토 대기 시연으로 분기한다. 반려·dismissed에는 이유가 필요하고 위험한 무시 경로를 차단한다. 전문가 표시명 공개 동의와 음악 검수/권리 검토의 분리를 보인다.
검증: 허용/금지 전이 전부, 중대 오류 차단, 권리 차단, 승인후 개정 무효화, 구판 교안 유지, 안전 신고 보류, duplicate command와 revision 충돌을 테스트한다.
```

### P10. 통합 접근성과 회귀 테스트

화면에서 확인: 핵심 흐름 테스트와 화면별 점검 결과가 있고 실패·미실행이 숨겨져 있지 않습니다.

```text
[P10: 통합 접근성과 회귀 테스트]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

R01~R14 전체에 대해 Vitest/컴포넌트 테스트/Playwright를 구성·실행하라. Next.js 서버 컴포넌트 등 단위 테스트가 어려운 부분은 브라우저 E2E로 검증한다. 외부 앱 실제 네트워크에 의존하지 않고 URL과 이동 계약만 검사한다. 브라우저 테스트는 가능하면 production build/start로도 확인한다.
검색 과제 10개, 4악기 교안, 필터 URL 복원, 뷰어 뒤로가기, bookmark persistence, 저장 장애, 오류 신고/검수/공개 차단, 권리 인쇄 차단, 직접 URL 접근, 잘못된 데이터, XSS 문자열, 음원 자동재생 없음, 카메라/마이크 호출 없음, synthetic 통계 분리를 테스트하라. selector는 role/label을 우선하고 스크린샷은 보조 증거로 사용한다.
360/768/1440/1920px에서 가로 넘침·메뉴·dialog·인쇄를 확인하고 키보드만으로 주요 흐름을 수행하라. 명암/label/heading/aria-live/focus trap/escape/호출 버튼으로 focus 복귀를 점검한다. 자동 접근성 검사만으로 완전 준수를 선언하지 마라.
검증 결과를 docs/TEST_REPORT.md에 실제 명령·버전·시간·성공/실패/미실행·재현법으로 남기고 회귀 문제를 수정하라. 테스트 skip으로 통과시키거나 build 성공만으로 전체 완료 선언 금지.
```

### P11. 최종 데모와 인수 문서

화면에서 확인: 5분 데모가 끊기지 않고 다른 사람이 README만 보고 실행할 수 있으며 구현과 미검증 범위가 구분됩니다.

```text
[P11: 최종 데모와 인수 문서]
프로젝트는 ‘레슨 디자이너 클래식 악기 교육 전자도서관’ 한국어 프로토타입이다. 대상은 바이올린·첼로·플루트·표준 Bb 클라리넷이다. PROMPT_PACK.md와 docs/SPEC.md, DATA_CONTRACT.md, STATUS.md를 먼저 읽고 없으면 이 단계에 필요한 최소 계약을 작성한다. 기존 코드/작업 변경을 보존하고 불필요한 재작성·프레임워크 이전은 하지 않는다. 신규이면 Next.js App Router/TypeScript/Tailwind, mock repository 우선이며 버전은 공식 문서와 lockfile로 확인한다. 실제 계정·외부 DB·배포·push·결제·카메라·마이크·학생 개인정보·외부 AI 호출은 하지 않는다. 원자료 19개는 미검수이고 24모듈은 별도 목표이다. 합성 데모의 승인 시연과 실제 검수 승인을 분리하고 실적·정확도·권리를 지어내지 않는다. 외부 앱은 링크 연동만 하며 실행 성공/정확성/진도 동기화를 가정하지 않는다. 이 단계 범위만 구현하고 변경 파일, 검사 명령과 결과(성공/실패/미실행), 화면 확인법, 남은 문제를 보고하라. docs/STATUS.md를 갱신하되 비밀이나 실제 개인정보를 기록하지 마라.

로컬 프로토타입을 최종 점검하고 README에 설치/실행/테스트/초기화/저장 한계를 초보자 순서로 정리하라. DEMO_SCRIPT.md에는 5분 시연: 악기→검색→단원→교안→외부 앱→출력→오류 신고→검수 화면을 작성한다. HANDOFF.md에는 실제 구현/자리표시자/미검증/후속 결정 목록을 분리한다.
모든 버튼이 실제 행동/명시적 준비중 중 하나인지 확인하라. 카메라 교정·공통 로그인·진도 동기화·AI 답변·유료화는 이번 결과에 없다고 정확히 기록한다. 37앱 정상 실행·19자료 승인·24모듈 완성·학습효과가 입증되었다는 표현을 삭제하라. docs/STATUS.md를 최종 갱신하라.
최종 lint/typecheck/unit/component/e2e/build를 현재 마지막 코드 기준으로 재실행하라. 네트워크·브라우저·환경 문제로 못한 검사는 사유를 남기고 수동 확인법을 제시한다. 명시적 요청 없이 commit/push/PR/배포/외부 계정 생성은 하지 마라.
최종 응답은 로컬 실행 방법, 완료 기능, 테스트 결과, 남은 제한, 다음 결정 다섯 항목으로 끝내라.
```

## 8. 검색 과제·자동 테스트·수동 확인

### 고정 검색 과제 10개
아래는 합성 fixture의 제목/주제어를 명시적으로 만들어 테스트하는 작업입니다. 실제 교재 내용의 정확성 평가는 아닙니다. 검색 성공 목표 9/10은 제품 사용성 목표이며 자동 테스트를 1개 실패시켜도 된다는 뜻이 아닙니다. 결정적 자동 테스트는 모두 통과해야 합니다.

| ID | 입력/상황 | 기대 결과 |
|---|---|---|
| Q01 | 바이올린 선택 | 바이올린 합성 자료만 표시 |
| Q02 | 첼로 + level 1 | 두 조건 모두 맞는 자료 |
| Q03 | 검색 ‘플룻’ | 플루트 별칭 자료 검색 |
| Q04 | 검색 ‘  FLUTE  ’ | 영문 별칭 정규화 |
| Q05 | 클라리넷 + 악보 종류 | 합성 악보 자리표시자, Bb체계 |
| Q06 | 주제어 ‘수업 준비’ | 해당 주제어 있는 자료 |
| Q07 | 악기+종류+수준 조합 | AND로 좁아지는 결과수 |
| Q08 | 존재하지 않는 단어 | 0건과 초기화 버튼 |
| Q09 | 필터 후 상세→뒤로가기 | 검색어/필터/정렬 복원 |
| Q10 | 실제자료 공개보기 | 승인 실자료 없으면 0건; 초안 유출 없음 |

### 검증 매트릭스
| 테스트 ID | 요구사항 | 최소 검사 |
|---|---|---|
| D01 | R01/R14 | 4악기, 19/24/37, ID/참조 무결성, legacy 승인 0 |
| D02 | R04/R11 | 상태 전이 및 승인/권리/중대 오류 공개 차단 |
| D03 | R08/R10 | https allowlist 정책, fragment 보존, 악기체계 불일치 거부 |
| D04 | R07/R09 | JSON 손상/저장 실패/초기화 취소/revision 충돌 |
| U01 | R02 | Q01~Q10 및 no-result/URL query |
| U02 | R05/R06 | 판본/권리/검수 범위/alt/재생 제어 |
| U03 | R09 | 시간 합계, 필수값, 중복 추가, 저장 실패 |
| E01 | R01~R09 | 4악기 각각 검색→단원→북마크→교안→출력 |
| E02 | R10/R11 | 검토→수정→재검수→승인 시연→권리 차단→공개 시연 |
| E03 | R04/R11 | 안전 신고→보류→저장 교안 경고→새버전 명시 적용 |
| E04 | R12 | getUserMedia/외부 AI/analytics 호출 없음 |
| A01 | R13 | Tab/Shift+Tab/Enter/Escape, focus 복귀, 200% 확대 |
| A02 | R13 | 360/768/1440/1920px와 인쇄, 명암·aria 점검 |

### 자동 테스트 예시를 요청하는 구체적 프롬프트
```text
레슨 디자이너 프로토타입의 도메인 함수를 테스트하라. 현재 인터페이스를 먼저 읽고 실제 타입에 맞춰 구현하라. 테스트를 통과시키기 위해 공개 판정 조건을 느슨하게 만들지 마라.
1. legacy_unreviewed + reviewState approved라고 위조한 입력도 public 목록에서 제외한다.
2. reviewed_real이어도 rights unknown이면 공개 불가이다.
3. approved v1 개정 시 v2 draft, v1 불변, 교안은 v1을 유지한다.
4. critical 지적이 open/fixed인 상태에서는 공개되지 않고 verified 뒤 필요한 승인 절차를 거친다.
5. 클라리미니 앱을 Bb 보엠식 단원에 저장하면 validation_error이다.
6. javascript:, data:, file:, //example.com URL은 거부하고 확인된 https URL의 #instrument=Bb는 유지한다.
7. localStorage JSON 손상/QuotaExceededError에서도 화면이 죽지 않고 저장 실패를 알린다.
8. synthetic_demo 승인 이벤트는 실자료 승인 집계에 포함되지 않는다.
9. 교안 5+10+15+10분은 40분이며 5+10+10+10분은 5분 부족 경고이다.
10. 검색·필터 상태가 URL에서 동일하게 복원된다.
각 테스트의 fixture/기대값/실행 결과를 보고하고 미실행은 통과로 쓰지 마라. 계정·배포·외부 데이터 전송은 하지 마라.
```

### 최종 완료 체크리스트
- [ ] 원본 Drive 문서는 수정하지 않았고 새 프로젝트 데이터만 생성했다.
- [ ] 합성 데모/미검수 원자료/실제 승인 자료를 표시와 조회에서 분리했다.
- [ ] 4악기에서 교사의 핵심 수업준비 흐름이 완료된다.
- [ ] 24모듈 목표를 완료 실적으로 계산하지 않는다.
- [ ] 검색/상세/뷰어/북마크/교안/앱/검수의 0건·오류·권리제한 상태가 있다.
- [ ] 실학생·카메라·마이크·민감 데이터 수집이 없다.
- [ ] 외부 앱 링크의 실행/음악적 정확성/개인정보 점검은 별도 상태이다.
- [ ] 승인된 판본 변경 시 재검수하고 기존 교안의 참조를 보존한다.
- [ ] 출력물에도 출처·판본·데모·권리 제한이 반영된다.
- [ ] 키보드·텍스트 확대·모바일·인쇄를 실제 확인했다.
- [ ] lint/typecheck/tests/e2e/build 결과와 미실행 사유가 남아 있다.
- [ ] 배포·SSO·학생 진도·카메라 정확도·AI 무환각을 완료했다고 말하지 않는다.

## 9. 버그 수정·재개·검수 요청 프롬프트

### B01. 화면/기능 오류를 고칠 때
```text
레슨 디자이너 전자도서관의 아래 문제만 최소 변경으로 수정하라. PROMPT_PACK.md와 docs/STATUS.md, 관련 코드/테스트를 먼저 읽고 기존 기능을 보존하라. 원인 없이 전체 프로젝트/라이브러리를 교체하지 마라. 승인·권리·데모 구분, 개인정보 금지, 배포 금지는 유지한다.
증상: [여기에 관찰한 화면/오류를 붙여넣기]
재현 순서: [클릭 순서, 주소, 기기 크기]
기대 동작: [원하는 결과]
오류 로그: [비밀번호/토큰/개인정보를 지운 로그]
실제 저장소를 조사해 재현→실패 테스트→최소 수정→영향 범위 회귀 테스트 순서로 진행하라. 재현할 수 없다면 확인한 사실과 필요한 최소 정보를 구분하라. 원인, 바뀐 파일, 검사 결과, 남은 한계를 보고하라. 미실행 검사를 성공이라고 쓰지 마라.
```

### B02. 중간에 끊긴 작업을 이어갈 때
```text
레슨 디자이너 클래식 악기 교육 전자도서관 개발을 이어가라. PROMPT_PACK.md, docs/SPEC.md, DATA_CONTRACT.md, STATUS.md, TEST_REPORT.md, package.json/lockfile과 실제 코드를 확인하라. 문서 체크표만 믿지 말고 마지막 완료 단계의 실제 동작을 빠르게 확인하라.
기존 수정사항을 보존하고 새 프로젝트를 다시 만들지 마라. 끝나지 않은 가장 이른 P단계부터 진행한다. Next.js 여부를 추정하지 말고 현재 스택을 유지하라. mock 우선, 실제 계정/학생정보/카메라/마이크/외부 AI/배포 없음, 19개 원자료 미검수와 24개 목표 분리, 합성 승인 시연 표시를 유지하라.
먼저 ‘확인한 완료 단계/불확실한 단계/이번에 이어갈 단계’를 짧게 보고하고 구현을 계속하라. 핵심 결정을 찾을 수 없으면 관련 기능만 보류하고 질문하라. 완료 후 실제 테스트 결과와 STATUS를 갱신하라.
```

### B03. 전문가 검수용 목록을 만들 때
```text
이 작업은 음악 내용의 승인을 내리는 일이 아니라 검수자가 확인할 목록을 만드는 일이다. 원본 교재·데이터셋에 접근 가능한 범위만 읽고, 불일치/출처 미확인/기보음-실음/악기체계/안전 안내/권리 증빙 누락을 위치별 표로 정리하라. 자료 ID, 버전, 단원/페이지, 확인할 질문, 근거 위치, 심각도 제안을 포함하라.
확신이 없는 운지·호흡·자세를 임의로 교정하거나 실제 전문가 이름·검수일·승인 증거를 만들지 마라. 바이올린과 첼로 활 잡기, 플루트 직접 누르는 키와 닫히는 패드, Bb 클라리넷 기보음과 실음, 클라리미니 구분을 별도 확인 항목으로 둔다. 원문을 대조하지 못한 항목은 ‘원문 대조 전’으로 표시하라. 결과는 검수 요청 초안이며 메일 발송·실자료 공개·승인 상태 변경은 하지 마라.
```

### B04. 외부 앱의 연결 상태를 점검할 때
```text
부록 URL 중 사용자가 선택한 앱만 읽기 전용으로 점검하라. 대상: [선택한 URL]. 이는 사이트 가입/로그인/권한 허용/카메라·마이크 실행/학생정보 입력/설정 변경 승인이 아니다. 그런 단계가 필요하면 해당 항목을 ‘추가 승인 필요’로 보고하라.
관찰 가능한 페이지 열림, 모바일 레이아웃, 악기체계 표기, 핵심 UI 존재, 새 탭 열기와 원래 단원 복귀, 권한 요청/외부 전송 안내 존재를 기록하라. HTTP 응답이나 첫 화면만 보고 기능·음악 정확성을 승인하지 마라. checkedAt, 관찰 브라우저/크기, 확인 범위, 제한, URL을 남겨라. 보안 경고·접근 거부를 우회하지 마라. 앱 데이터 수정이나 관리자 상태 저장은 사용자가 요청한 경우에만 수행하라.
```

## 10. 선택 후속 단계와 상용화 경계

### F01. 근거 기반 자료 안내 UI(선택, mock 전용)
```text
현재 전자도서관에 선택 기능 ‘자료에서 찾아보기’를 추가하라. 생성형 AI/API를 붙이지 않고, 공개 판정을 통과한 승인 버전 또는 명확히 분리된 합성 데모만 검색하여 출처 카드와 짧은 인용을 보여준다. 승인 자료가 없으면 ‘현재 답변에 사용할 승인 자료가 없습니다’라고 말한다. S3의 미검수 verifiedContent를 답변 근거로 승격하지 마라.
자료 범위 밖의 고음·고급 주법·의료성 질문에는 설명을 생성하지 말고 자료 부재와 담당 교사 확인을 안내한다. 출처가 없는 페이지 번호/책 제목을 만들지 마라. 텍스트 정확도 100%/환각 0%라는 문구를 쓰지 마라. 질문 로그는 저장하거나 외부 전송하지 않는다. 해당 콘텐츠 버전이 보류되면 결과에서도 제외한다. 기준 출처를 클릭하면 그 판본의 단원으로 이동한다. 교차 악기 혼동, 근거 없음, 승인 취소에 대한 테스트를 추가하라.
```

### F02. 실제 백엔드로 전환하기 전 설계만 받기
```text
레슨 디자이너 mock 프로토타입의 실서비스 전환 설계서를 작성하라. 지금은 외부 계정 생성·DB 실행·키 발급·OAuth·RLS 변경·배포를 하지 마라. 현재 repository 인터페이스를 유지하면서 실제 인증, 교사/검수자/편집책임자 권한, 서버 측 접근제어, 버전 불변성, 감사 이벤트, 비공개 파일 저장, 권리별 다운로드를 설계하라.
선택 후보는 Supabase/Postgres이며 현재 공식 문서를 확인해 mock와 실제 adapter 경계, 최소 테이블, 마이그레이션 초안, RLS 및 서버측 권한 테스트, 백업·복구·보관/삭제 정책, 비용·운영 책임을 제안한다. service-role/secret 키는 클라이언트 번들/NEXT_PUBLIC 변수에 넣지 않는다. publishable 키도 권한 보장을 대신하지 않으며 RLS가 필요하다. 실제 연결·권한 확대는 구체적 변경 내용과 승인 단계를 별도로 제시하라. 기존 스택과 더 적합한 방식이 있으면 근거를 비교하고 자동 이전하지 마라.
학생별 정보나 카메라 분석은 별도 동의·안전·정확도 검증 과제로 남긴다. 앱 링크 통합과 공통 로그인·진도 API 통합은 별도 작업으로 견적/위험을 분리한다. 실서비스 준비 완료라고 선언하지 마라.
```

### 단계 경계표
| 항목 | 이번 프로토타입 | 실서비스 후속 조건 |
|---|---|---|
| 저장 | 브라우저 mock | 서버 인증·권한·백업·충돌 처리 |
| 역할 | 화면 전환 시연 | 서버 권한·RLS·분리된 책임 |
| 콘텐츠 | 합성 데모와 미검수 메타데이터 | 전문가 검수·권리 증거·판본 승인 |
| 웹앱 | 외부 링크/복귀 | 앱별 계약/API/SSO/전송 데이터 검토 |
| 진도 | 읽기 위치·교안 저장 | 실제 학습 진도 정의·동의·신뢰 가능한 이벤트 |
| AI | 선택적 검색 카드 | 승인 근거만 검색, 평가셋, 보류 정책·비용 검증 |
| 카메라 | 사용하지 않음 | 별도 사용 목적·동의·안전·정확도 검증 |
| 배포 | 로컬 실행 | 사용자 배포 요청·공개 범위·보안/권리 검토 |

## 11. 원자료 인벤토리와 공식 기술 문서

### A. 19개 기존 항목: 원문 본문이 아닌 메타데이터 시드
아래 목록은 S3에서 읽은 ID/단원/페이지/수준입니다. 원본 교재의 실물 대조와 전문가 검수가 끝났다는 의미가 아닙니다. 본문·운지 데이터는 이 파일에 복제하지 않았습니다. 모든 항목의 기본 상태는 초안, 권리 미확인, 승인 증빙 없음입니다.

- `violin-unit01-posture-left-hand` | violin | level 1 | 1단원. 기본 자세 — 몸의 균형과 왼손·손목 | 3–8 | 질문 2개

- `violin-unit01-bow-hold-contact` | violin | level 1 | 1단원. 기본 자세 — 오른손 활 잡기와 활의 접촉점 | 9–15 | 질문 2개

- `violin-unit02-open-strings-bowing` | violin | level 1 | 2단원. 개방현과 첫소리 — 4현 구조·내림활/올림활·현 바꾸기 | 16–27 | 질문 2개

- `violin-unit03-first-finger` | violin | level 2 | 3단원. 왼손 첫 운지 — 1번 손가락(D현 미 E4, A현 시 B4) | 28–38 | 질문 2개

- `violin-unit04-high2-and-3` | violin | level 2 | 4단원. 높은 2번과 3번 손가락 — 온음·반음 간격(파♯·솔, 도♯·레) | 39–54 | 질문 2개

- `violin-unit05-06-d-major-two-string-walk` | violin | level 3 | 5–6단원. D장조 한 옥타브와 현 이동 & 첫 연습곡 〈두 줄 산책〉 | 55–78 | 질문 2개

- `violin-unit07-10-slur-rest-eighth-notes` | violin | level 3 | 7–10단원. 활 분배와 두 음 슬러 · 쉼표 · 8분음표 · 〈작은 산책〉 종합 | 79–116 | 질문 2개

- `cello-unit01-sitting-endpin-balance` | cello | level 1 | 1단원. 앉는 자세와 악기 균형 — 의자·엔드핀·3분 준비 | 3–8 (부록 27–30) | 질문 2개

- `cello-unit02-left-hand-and-bow-grip` | cello | level 1 | 2단원. 왼손과 활 잡기 — 바이올린 활 잡기와의 핵심 차이 | 9–14 (부록 31–32) | 질문 2개

- `cello-unit03-open-strings-rhythm` | cello | level 2 | 3단원. 개방현과 기초 리듬 — C·G·D·A 4현과 활 접촉 구간 | 15–20 (부록 33–35) | 질문 2개

- `cello-unit04-first-position-0134` | cello | level 3 | 4단원. 첫 포지션과 첫 연습곡 〈첫 걸음〉 — 0·1·3·4 운지 원리 | 21–26 (부록 36–38) | 질문 2개

- `flute-unit01-posture-assembly-care` | flute | level 1 | 1단원. 기본 자세와 조립·관리 — 3부분 구조와 3점 지지 | 3–14 (부록 49–53) | 질문 2개

- `flute-unit02-headjoint-embouchure-breathing` | flute | level 1 | 2단원. 헤드조인트와 첫소리 — 입술 바람길과 어지러움 예방 | 15–24 (부록 53–56) | 질문 2개

- `flute-unit03-b4-a4-g4-fingerings` | flute | level 2 | 3단원. 시·라·솔 기초 운지 — B4·A4·G4 직접 누르는 키와 오선 읽기 | 25–36 (부록 52, 55) | 질문 2개

- `flute-unit04-rhythm-little-breeze` | flute | level 3 | 4단원. 첫 리듬과 〈작은 바람〉 — 4/4박자 리듬 시간축과 8마디 창작곡 | 37–48 (부록 55–56) | 질문 2개

- `clarinet-unit01-assembly-bridge-key-posture` | clarinet | level 1 | 1단원. 악기 조립과 몸의 균형 — 연결 키(브리지 키) 보호와 오른엄지 받침 | 3–8 (부록 27–28) | 질문 2개

- `clarinet-unit02-reed-embouchure-first-sound-g4` | clarinet | level 1 | 2단원. 리드와 입 모양, 첫 소리 — 앙부슈어와 개방 G4(삑 소리 대처) | 9–14 (부록 28–30) | 질문 2개

- `clarinet-unit03-five-notes-c4-to-g4` | clarinet | level 2 | 3단원. 다섯 음과 손가락의 움직임 — 기보 G4·F4·E4·D4·C4 운지와 이조 | 15–20 (부록 27, 29, 31) | 질문 2개

- `clarinet-unit04-rhythm-etudes-10min-routine` | clarinet | level 3 | 4단원. 리듬과 첫 연습곡 — 〈두 박의 인사〉·〈다섯 음 산책〉·10분 연습 루틴 | 21–26 | 질문 2개

### B. 19→24 연결표를 만드는 규칙
각 악기의 6개 기획 슬롯과 기존 ID를 연결하되 ‘제안 매핑’으로 표시합니다. 예를 들어 바이올린 자세 항목 2개는 기본 자세 슬롯의 후보, 개방현 항목은 첫 소리 슬롯의 후보입니다. ‘악기 이해·관리’나 ‘한 회차 수업 적용’에 대응하는 내용이 없으면 빈 배열을 유지하고 새 원고 필요로 표시합니다. 전문가가 확정한 교육 순서라고 쓰지 않습니다. 모듈과 항목의 다대다 매핑은 어느 한쪽의 콘텐츠 완성이나 승인을 자동으로 바꾸지 않습니다.

### C. 37개 앱 후보 URL 원본 목록
S2에서 읽은 주소를 그대로 옮겼습니다. 아래 모든 주소의 초기 상태는 `unchecked`입니다. 이 프롬프트팩 작성 시 실제 페이지의 기능·모바일 동작·음악 정확성·개인정보 처리를 검증하지 않았습니다. 이름/설명이 모호한 앱은 URL에서 기능을 추측하지 말고 관리자 제목을 ‘앱 후보 01’처럼 중립적으로 시작하세요.

1. https://drum-beat-pi.vercel.app/

2. https://nanta-play.vercel.app/

3. https://guitar-chord-viewer.vercel.app/

4. https://ukulele-chord-viewer.vercel.app/

5. https://miniharp-app.vercel.app/

6. https://saxophone-edu.vercel.app/

7. https://ocarina-master.vercel.app/

8. https://panflute-edu.vercel.app/

9. https://kalimba-play.vercel.app/

10. https://tonguedrum-play.vercel.app/

11. https://violin-edu.vercel.app

12. https://cello-edu.vercel.app/

13. https://flute-edu.vercel.app/

14. https://metronome-app-flax.vercel.app/

15. https://web-app-animation-test.vercel.app/

16. https://clarii-fingering-correction.vercel.app/

17. https://sax-fingering-coach.vercel.app/

18. https://flute-fingering-coach.vercel.app/

19. https://ukulele-chord-fingering-correction.vercel.app/

20. https://guitar-chord-fingering-correction.vercel.app/

21. https://ocarina-fingering-coach.vercel.app/

22. https://trumpet-fingering-edu.vercel.app/

23. https://clarinet-fingering-edu.vercel.app/#instrument=Bb

24. https://gayageum-fingering-edu.vercel.app/

25. https://flute-fingering-edu.vercel.app/

26. https://clarimini-fingering-edu.vercel.app/

27. https://saxhands-webapp.vercel.app/

28. https://recorder-fingering-edu.vercel.app/

29. https://musescore-copy.vercel.app/

30. https://kimyounggaur.github.io/A_Score/

31. https://kimyounggaur.github.io/DAW-master-/

32. https://kimyounggaur.github.io/Vocal_Recording/

33. https://kimyounggaur.github.io/Guitar-Muti-Effector/

34. https://kimyounggaur.github.io/Guitar-Pedalboard/

35. https://kimyounggaur.github.io/synthesizer/

36. https://accompany-designer2nd.vercel.app/

37. https://kimyounggaur.github.io/Piano_Roll-FL_Studio-/

### D. MVP 앱 연결 후보 분류
| 후보 | 원자료상 용도 | 초기 처리 |
|---|---|---|
| violin-edu | 바이올린 운지 자료 | 바이올린 후보, 점검 전 |
| cello-edu | 첼로 자료 | 첼로 후보, 점검 전 |
| flute-edu / flute-fingering-edu | 플루트 기초/운지 | 플루트 후보, 점검 전 |
| clarinet-fingering-edu/#instrument=Bb | 표준 Bb 보엠식 운지 | 클라리넷 후보, 체계 확인 필요 |
| metronome-app-flax / musescore-copy | 공통 수업 도구 | 공통 후보, 점검 전 |
| flute-fingering-coach | 카메라형 코치 설명 | 별도 권한·안전 점검 전 비활성 |
| clarii-fingering-correction / clarimini-fingering-edu | 클라리미니 | 표준 클라리넷 연결에서 제외 |
| sax-fingering-coach | 이름과 설명 불일치 | 악기체계 미확인, 비활성 |
| 나머지 | 타악기/기타 도구 | 관리자 후보 목록 보관 |

### E. 구현 시 확인할 공식 문서
다음 자료는 2026-10-14에 확인했습니다. 정확한 설치 버전과 요구 환경은 구현 시점에 다시 확인하고 프로젝트 lockfile에 고정하세요. 이 문서에 제안한 폴더/도메인/디자인은 프로젝트를 위한 설계안입니다.

- [Next.js 설치와 프로젝트 시작](https://nextjs.org/docs/app/getting-started/installation): App Router/TypeScript 시작과 실행 명령 확인. 기존 저장소에서는 기존 버전·구조 우선.
- [Next.js Playwright 안내](https://nextjs.org/docs/app/guides/testing/playwright): 브라우저 E2E 구성 근거.
- [Vitest 시작 문서](https://vitest.dev/guide/): 도메인·동기/비동기 함수 테스트 구성 근거.
- [W3C WCAG 2.2 빠른 참조](https://www.w3.org/WAI/WCAG22/quickref/): 명암·키보드·확대·레이블 등 검토 기준. 몇 개 자동 검사 통과가 전체 접근성 준수 인증은 아님.

---

이 문서의 최종 목표는 ‘많은 기능이 있어 보이는 화면’이 아니라 ‘검수·권리·판본을 숨기지 않고 교사가 한 회차 수업을 준비할 수 있는 작동하는 로컬 시연’입니다.



## 부록: 책장형 홈 공통 설계 전문

# 클래식·국악 교육 전자도서관 책장형 홈 설계계획서

버전 1.0 · 2026-10-14 · 구현 전 설계 및 두 프롬프트팩 공통 삽입 계약

## 1. 확정 요구와 제안의 구분
사용자 요구: 클래식·국악 전자도서관의 메인 화면을 책 진열대 배경으로 구성하고 PDF 교재를 책 모양으로 가지런히 배치합니다. 책을 누르면 교재를 열람합니다. 설계계획서를 먼저 만들고 두 바이브코딩 프롬프트에 삽입합니다.
설계 제안: 책장/목록 보기 전환, 가변 열 수, 필터·읽던 페이지·연습 연결을 함께 제공합니다. 다음 규격은 구현을 위한 제안이며 사용자 확정값으로 포장하지 않습니다.

## 2. 홈 화면 구조
1. 상단: 서비스 이름, 클래식/국악 정체성, 시연/권리 안내, 검색창.
2. 탐색 바: 악기·자료군, 악기형(국악), 난이도/수준 미확인, 자료종류, 기보법(국악), 초기화, 정렬.
3. 이어 읽기: 현재 접근 가능한 마지막 교재와 판본, 마지막 페이지. 기록 없음/자료 보류/파일 교체 상태 처리.
4. 책장: 따뜻한 종이색·과하지 않은 나무색 선반 배경, 정렬된 책 표지 카드. 실제 책장 사진·외부 텍스처 다운로드 없이 CSS로 구현 가능.
5. 보조 보기: 동일 데이터의 접근성 높은 목록 보기. 책장과 목록 전환으로 검색·필터 상태가 사라지지 않음.
6. 하단: 결과수, 미확인/준비 중 안내, 출처·권리·검수 설명.

## 3. 책 표지 카드 계약
표지, 제목, 악기/자료군, 수준(미확인 허용), 판본, 검수/권리 상태, 파일 종류, 이어읽기, 북마크를 표시합니다. 장식용 책등에는 동일 내용을 중복 낭독시키지 않습니다.
- 표지는 실제 제공되고 열람권이 확인된 이미지 또는 새로 만든 타이포그래피 표지입니다. 이미지의 존재·권리를 추정하지 않습니다.
- 원본이 PPTX이면 PPTX 원자료로 표시합니다. 국악 PPTX 14개를 PDF 14권이라고 부르지 않습니다.
- PDF가 실제로 준비되기 전에는 ‘PDF 준비 중’ 또는 구조화 단원 보기로 연결합니다. 가짜 PDF 다운로드나 빈 새 탭은 금지합니다.
- 공개 접근권 없는 실제 교재는 public 책장에 노출하지 않습니다. 관리자에서 메타데이터만 볼 수 있고 실제 기밀 내용은 정적 번들에 넣지 않습니다.
- 합성 데모 책은 표지·상세·출력 모두 시연용이라고 표시합니다. 표지를 만들었다고 교재가 완성된 것이 아닙니다.
- 카드의 주 링크는 하나의 명확한 책 열기 동작입니다. 북마크 버튼과 중첩 링크 충돌을 피합니다.

## 4. 클릭 후 열람과 PDF
목록의 필터/스크롤을 유지한 채 자료 상세 또는 뷰어로 이동합니다. 데스크톱은 목차+본문+자료정보, 모바일은 접을 수 있는 목차를 권장합니다.
PDF 자산은 id, resourceVersionId, format, fileRef, pageCount, checksum, rights, availability를 가집니다. pageCount는 실제 검사값, fileRef는 검증된 자산 참조입니다. 원본 PPTX→PDF 변환은 별도 처리하고 페이지별 누락/글꼴/기호/악보 레이아웃을 시각검사해야 합니다. 변환 완료 전 링크를 활성화하지 않습니다.
PDF 뷰어 후보는 구현 시 현재 공식 문서와 유지관리 상태를 확인합니다. 화면에서 URL만 iframe으로 덮는 것을 완성 뷰어로 간주하지 않습니다. 확대/축소, 페이지 입력, 이전/다음, 목차/단원 연결, 로딩/오류, 키보드와 페이지 텍스트 또는 대체 설명이 필요합니다. 브라우저 내장 PDF만 사용한 경우 모바일·접근성·읽기위치의 실제 지원 범위를 보고합니다.
책 열기/이어읽기 저장키는 projectId/resourceId/versionId/assetId를 포함합니다. 페이지 범위를 검사하고 파일이 교체되거나 보류되면 자동으로 다른 판본의 같은 숫자로 이동하지 않습니다. 비교/새판본 안내 후 사용자 선택으로 전환합니다.
출력과 다운로드는 열람권과 별도입니다. rights.allowPrint/allowDownload=false이면 해당 버튼 및 실제 명령을 차단합니다.

## 5. 영상·연습 자료 연결
현재 단원의 appId/mediaId만 연결하고 검증된 실제 URL·권리·내용·악기형 적합성이 있는 경우 활성화합니다. 없음/미점검은 준비 중. 영상 자동재생, 카메라/마이크 권한, 학생 개인 정보 전달은 하지 않습니다. 외부 이동 후 돌아오면 책·판본·페이지·필터가 유지되어야 합니다.

## 6. 반응형·접근성
- 320/360px: 1~2열 가변. 2열에서 제목·버튼이 잘리면 1열을 사용합니다. 모바일 2~3열 고정은 요구하지 않습니다.
- 768px: 3~4열 제안, 1440px 이상: 가용폭 기반 5~7열 제안. 최소 카드폭과 200% 확대 우선.
- CSS grid minmax와 wrapping을 사용하고 고정 책장 이미지 위 절대 좌표 배치를 피합니다.
- 최소 44px 목표 터치영역, 충분한 텍스트 명암, 키보드 focus, aria-label, 장식 aria-hidden, reduced-motion.
- 책을 클릭할 때 과도한 3D 회전·자동 스크롤을 하지 않습니다. 애니메이션은 선택적 장식.
- 가로 넘침·자막/대체 설명·읽기 순서·대화상자 focus 복귀를 점검합니다.

## 7. 데이터 확장안
```typescript
interface BookPresentation {
  resourceId: string; resourceVersionId: string;
  coverAssetId: string | null; coverOrigin: 'provided'|'generated_typography'|'none';
  shelfOrder: number | null; displayTitle: string;
}
interface ReadingAsset {
  id: string; resourceVersionId: string; format: 'pdf'|'structured'|'pptx_source';
  fileRef: string | null; pageCount: number | null; checksum: string | null;
  availability: 'missing'|'processing'|'available'|'failed'|'on_hold';
  rights: {allowView:boolean; allowPrint:boolean; allowDownload:boolean};
}
interface BookPosition {
  projectId: 'classical-library'|'gugak-library'; resourceId:string;
  resourceVersionId:string; assetId:string; pageNumber:number|null;
  unitId:string|null; updatedAt:string;
}
```
변환 작업 상태와 공개 상태는 독립입니다. PDF 변환 성공이 음악 승인·권리 허락을 대신하지 않습니다. 모르는 pageCount/fileRef는 null입니다.

## 8. 구현 단계와 완료 기준
- P00: BOOKSHELF_SPEC.md 및 기존 요구사항 대응표. PDF 보유/미보유와 원본 형식 조사.
- P01: 책장 홈+목록 대안+필터+표지 상태를 구현. 시연 배너 유지.
- P02: BookPresentation/ReadingAsset/BookPosition 스키마 및 실제 자산/중립 데모 분리.
- P03: 프로젝트별 저장키·판본별 위치·손상 복구.
- P04: 검색/필터/정렬을 책장과 목록에서 동일하게 적용.
- P05: 실제 PDF 또는 구조화 뷰어, 페이지·단원·판본·권리 표시, 준비 중 분기.
- P06: 검증된 영상/앱만 연결, 복귀 위치 보존.
- P07: 교안 담기와 권리별 인쇄.
- P08/P09: 표지/자산/변환/권리/검수 편집과 공개 차단.
- P10: 아래 테스트 실행, 화면 수동검사.
- P11: 5분 데모를 ‘책장→책 열기→읽던 페이지→교안→연습→복귀→출력’으로 보강.

## 9. 수락 테스트
1. 실제 PDF 없는 국악 원자료를 PDF 완료 책으로 표시하지 않는다.
2. 합성 책장과 승인 실제 책장 통계가 다르다.
3. 클릭이 올바른 resource/version/asset을 연다.
4. 페이지 3 저장 후 새로고침·외부앱 복귀 시 같은 판본 3쪽, 페이지 범위 오류는 안전 처리.
5. 구판 보류·새판본 교체는 경고하고 자동 위치 이식하지 않는다.
6. 검색 필터/정렬/목록 전환/뒤로가기가 상태를 유지한다.
7. 권리 없는 자산은 열기·출력·다운로드 명령 모두 차단.
8. 320/360/768/1440/1920px·200% 확대에 잘림 없음; 키보드로 책 선택/북마크/복귀 가능.
9. 표지 실패/없음은 타이포그래피 대체, 권리 미확인 이미지 자동 수집 없음.
10. 영상/앱 없음은 비활성, 자동재생·권한요청 없음.
11. 클래식/국악 저장 키·파일·책 목록이 서로 섞이지 않는다.
12. 실제 PDF를 사용했다면 각 페이지 변환·폰트·악보·기호 시각검사 결과를 남긴다. 미실행은 미완료.

## 10. 인수 경계
이 계획은 책장형 홈의 설계입니다. 실제 PDF 변환·자산 생성·앱 구현·배포는 구현 작업의 결과와 검사 증거가 있어야 완료라 할 수 있습니다. 기존 프롬프트의 개인정보·권리·승인·mock 경계를 그대로 유지합니다.


### 개정 이력
2026-10-14 v1.1: 원본 v1.0 본문·시드·앱 인벤토리를 보존하고 사용자 요청 책장형 홈 설계 및 P00–P11 적용 계약을 추가했습니다. 원본 Drive 파일은 변경하지 않았습니다. 이번 개정은 실제 앱 구현이나 PDF 보유 검증 보고서가 아닙니다.
