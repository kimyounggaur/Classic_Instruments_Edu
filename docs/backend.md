# 개발판 백엔드 범위

> 이전 구현의 보존 기록입니다. 현재 v1.1 프로토타입은 `lib/prototype`의 브라우저 저장 repository를 사용합니다. 최신 구조와 실제 실행 결과는 [ARCHITECTURE](ARCHITECTURE.md), [TEST_REPORT](TEST_REPORT.md)를 따릅니다.

현재 작업공간은 기존 React/Vinext·TypeScript·D1 의존성과 스키마를 보존하지만, 이번 개발판은 mock-first 검토용이다. 운영 배포나 D1 바인딩을 사용하지 않는다.

## 비활성화한 기능

- ChatGPT 또는 다른 실계정의 헤더 읽기와 로그인 흐름
- 학생 이름, 참여 코드, 연락처, 학습 기록, 검수 이력의 서버 저장
- 교실 생성·참여·제출 API
- 브라우저 상태의 API 동기화와 계정별 캐시

## 현재 API 응답

| 경로 | 동작 |
| --- | --- |
| `GET /api/me` | `authenticated: false`인 mock-only 상태를 반환한다. |
| `GET /api/state` | 빈 상태와 mock-only 안내를 반환한다. |
| `PUT /api/state` | `405`로 거절한다. |
| `GET /api/classroom` | 빈 수업 목록과 합성 시연 안내를 반환한다. |
| `POST /api/classroom` | `405`로 거절한다. |

화면의 즐겨찾기·책갈피·연습 기록·검수 의견은 React 메모리에서만 유지되며, 새로고침하면 초기화된다. 수업 현황은 `합성 학습자 A–C` 카드로만 표현한다.

`db/`와 기존 검증 도구는 향후 별도 승인된 운영 전환을 위한 호환 자산으로 남아 있지만, 이 개발판의 코드 경로에서는 호출되지 않는다.
