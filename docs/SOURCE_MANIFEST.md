# 출처와 확인 범위

조사일: 2026-10-15(한국 시간). 이번 작업은 로컬 파일·첨부 마크다운·기존 기록을 조사했다. 아래 Drive 원문을 이번 작업에서 새로 열람·수정하거나 37 외부 사이트를 자동 실행하지 않았다.

## 기준 문서

| ID | 출처 | 이번에 확인한 범위 | 확인하지 않은 범위 |
|---|---|---|---|
| P | 사용자 첨부 v1.1 책장형홈 프롬프트팩 | 로컬 파일 전체의 요구사항·시드·37 URL·부록, `PROMPT_PACK.md`로 원문 복사 | 문서에 인용된 외부 원문과 실제 음악 내용 |
| S1 | [개발 계획서](https://docs.google.com/document/d/1yep7kBlfDuPpwnpgokrTfucpaJA99SHHVbyF2FHEVE8) | 첨부 P가 제시한 MVP 우선순위 | Drive 최신 본문·승인·실적·권리 |
| S2 | [교육 웹앱 목록](https://docs.google.com/document/d/1UsiGthhLzDkh68ghJswdUfyIThbTdv_kPCigqX06nIc) | P에 옮겨진 정확한 후보 URL 37개 | URL별 실행·모바일·정확성·개인정보·로그인 요구 |
| S3 | [기존 지식 데이터셋](https://docs.google.com/document/d/1ZjYQY8XUNEKJQGZPltYP9fEG6gRjz-1bbF_0uwxZbNM) | P의 ID/단원/페이지/수준 19개, 원자료 통계 38질문 | 실물 교재 대조·전문가 검수·재배포 권리 |
| S4 | [이전 통합 대시보드 설계](https://docs.google.com/document/d/1zJnzhYaGzo6JH4RmFjtc1Wcd9hIXS2ogWF1MDx3Sn-0) | P의 악기 전환·이어보기·교실 가독성 제안 | 카메라 교정·공통 진도·무환각·자동 배포 성립 여부 |

로컬 P의 SHA256: `F6ACE8F2A61511C291F2E4F597DE3CDEA4F68250506F5B2B9A9AFA36140E0C35`. 첨부 원본과 `PROMPT_PACK.md`는 같은 바이트로 보존했다.

사용자 직접 결정이 문서 속 실행 프롬프트보다 우선한다. 이번에는 중간 질문 없이 단계별 자체 점검을 이어간다. 자료의 실제 권리·음악 검수·외부 서비스 권한은 자체 승인으로 만들어내지 않는다.

## 수량의 의미

| 데이터 | 수량 | 의미 |
|---|---:|---|
| LegacyEntry | 19 | 미검수 원자료 메타데이터; 바이올린 7/첼로 4/플루트 4/클라리넷 4 |
| 원자료 질문 | 38 | 첨부 문서의 통계, 정확성 검증 수량 아님 |
| ModulePlan | 24 | 악기별 6개 기획 슬롯, 전부 제안 매핑 |
| AppLink | 37 | 첨부 목록 URL, 전부 초기 점검 전·비활성 |
| 책장 합성 자료/단원 | 8 / 16 | 새로 작성한 중립 시연 구조 |
| 관리자 합성 workflow fixture | 4 / 8단원 | 권리 미확인/검수중/수정요청/보류 예외 시연, 책장 통계 제외 |
| 합성 교안 | 4 | 악기별 40분 구조 예시 |
| 실제 승인 교재 | 0 | 전문가/권리 증빙 확인되지 않음 |

`verifiedContent`, `STRICT_ZERO_HALLUCINATION` 등 구형 필드/문구는 검수 증거나 보장으로 사용하지 않는다. 새 앱에는 19 원자료의 본문을 넣지 않으며, 원본 ID·페이지 범위는 ‘원자료 메타데이터 · 원문 대조 전’으로 다룬다.

## 기존 로컬 자산과 충돌 정리

이전 저장소에는 `public/textbooks`의 PDF 14개·SVG 631개·표지 WebP 14개, `public/data`의 JSON 4개가 있었다. 파일 존재/바이트/해시는 이번에 검사했다. 기존 `docs/SOURCE_AUDIT.md`의 변환·검사 기록은 과거 주장으로 보존하며 이번 작업이 다시 전 페이지를 검사했다는 뜻이 아니다.

구형 레지스트리는 38앱, 구형 target_catalog는 단계 목표 24개다. 이번 앱은 구형 38앱을 37후보로 표시하거나 구형 단계 목표를 4×6 모듈로 재해석하지 않고 첨부 기준으로 별도 시드를 만들었다. 원문·표지·페이지 자산·구형 데이터는 `retained-private/`에 로컬 보존하며 현재 앱에서 제공하지 않는다. 자세한 범위와 해시는 `ASSET_RIGHTS.md`, `RETAINED_ASSET_INVENTORY.csv`를 따른다.

## 기술 환경 기록

최초 조사 시 Node `v24.14.0`, pnpm `11.25.0`이 사용 가능했고 node_modules는 없었다. 저장소는 pnpm lockfile과 Next App Router/React/TypeScript 구조를 이미 갖고 있었다. lockfile을 유지하며 새 프레임워크로 이전하지 않았다. 기본 실행은 로컬 Next CLI, 기존 Vinext/Sites 스크립트는 별도 이름으로 보존한다.

package.json 선언: Next `16.3.4`, React/React DOM `19.2.6`, TypeScript `5.9.3`, Tailwind `4.2.1`, Zod `^3.25.76`; 정확한 설치 해석은 pnpm-lock.yaml을 따른다. 이 수치는 ‘최신’이라는 의미가 아니다. 실행·설치 성공 여부는 테스트 보고서를 따른다.

첨부의 [Next 설치 문서](https://nextjs.org/docs/app/getting-started/installation), [Next Playwright 안내](https://nextjs.org/docs/app/guides/testing/playwright), [Vitest 가이드](https://vitest.dev/guide/), [WCAG 2.2 빠른 참조](https://www.w3.org/WAI/WCAG22/quickref/)는 설계 참고 링크다. 링크를 기재한 사실을 현재 버전·전체 준수 검증으로 간주하지 않는다.
