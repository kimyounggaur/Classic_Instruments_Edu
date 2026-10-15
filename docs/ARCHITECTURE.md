# 로컬 프로토타입 구조

2026-10-15, 첨부 v1.1 적용. 기존 Next App Router·React·TypeScript 구조를 유지하고 새 프로토타입을 `components/prototype`, `lib/prototype` 경계에 구현한다. 기존 대형 앱·서버·자산 코드는 보존하되 현재 진입점에서 사용하지 않는다.

## 데이터 흐름

```text
App Router 경로
  → 공통 prototype shell / 도서관·뷰어·교안·관리자 UI
    → Promise repository 계약
      → 검증된 seed + 브라우저 저장 어댑터
        → 이 브라우저의 localStorage / 실패 시 메모리
```

클라이언트가 seed 배열 또는 localStorage를 직접 변경하지 않는다. 공개 조건·검수 전이·URL 정책·검색·교안 검증은 도메인 함수에 모은다. repository는 UI 경로와 무관하게 데이터 접근/명령을 검증한다.

## 계층과 책임

| 위치 | 책임 |
|---|---|
| `app/` | 경로·한국어 문서·메타데이터·오류/404 연결 |
| `components/prototype/` | 책장/목록·뷰어·검색·북마크·교안·관리자·저장 알림 |
| `lib/prototype/` | TypeScript/Zod 계약·시드·공개/권리/검수/URL/검색·repository·저장 |
| `tests/` | 도메인·컴포넌트·브라우저 수락 검사 |
| `docs/` | 설계·출처·권리·데모·실행 증거·인수 경계 |
| `public/` | 권리 확인된 자체 UI 자산만. 실제 교재 파일 배포 금지 |
| `retained-private/` | 구형 원문 자산의 로컬 보존, 앱에서 import/serve하지 않음 |

교재는 `legacy_unreviewed`, `synthetic_demo`, `reviewed_real` 세 집합으로 분리한다. `public` 조회는 실제 승인 조건을 만족한 버전만 반환하며 기본 데모는 합성 집합을 별도 판정한다. 관리자 역할 전환은 UI 시연일 뿐 실제 권한 경계가 아니다.

## 브라우저 저장

SSR에서 `window`에 접근하지 않는다. 초기 seed/복원 전/복원 완료를 구분하고 복원 전에 seed를 저장하지 않는다. schemaVersion·revision과 앱 namespace를 검사한다. 손상 JSON·이전 스키마·저장 차단·용량 부족은 UI를 중단하지 않고 메모리 모드와 복구/초기화 선택을 제공한다. 실패를 성공 저장으로 표시하지 않는다. 초기화와 삭제에는 확인 절차가 있고 취소는 원값을 유지한다.

교안/검수 쓰기는 `expectedRevision`을 검사한다. 저장 직전에 localStorage revision을 대조해 다른 탭의 변경을 감지하고, 충돌 시 덮어쓰기 대신 새로고침/복사 방법을 안내한다. 변경 이력은 논리적으로 append-only지만 localStorage는 위변조 방지 감사 저장소가 아니다.

## 상태와 판본

검수 상태와 공개 상태, 권리 상태와 자산 변환 상태는 독립이다. 승인과 공개는 다른 명령이다. 승인본 개정은 새 draft version ID를 만들며 승인 증거를 승계하지 않는다. 기존 교안은 고정한 version/unit 참조를 유지한다. 안전·중대 신고는 보류와 사용 교안 경고로 연결한다.

책장 query는 URL에 두어 새로고침·뒤로가기·책장/목록 전환 때 복원한다. 읽기 위치는 project/resource/version/asset에 귀속되며 보류/교체 시 다른 판본으로 자동 이식하지 않는다.

## 외부 연결과 후속 교체 경계

앱은 allowlist https URL과 fragment 보존, 악기체계 검사를 거친 새 탭 링크다. 자동 링크 fetch 검사기·iframe·권한 허용·SSO·진도 동기화가 없다. 앱 후보의 열림 여부/음악 정확성/개인정보는 각각 별도 점검 증거다.

실서비스 전환은 repository 계약을 서버 어댑터로 바꾸는 후속 작업이다. 실제 인증·서버 권한·비공개 파일·감사·백업·동의·권리 정책을 새로 검증해야 한다. 남아 있는 구형 Worker/D1 코드의 존재를 현재 연결 완료로 해석하지 않는다.
