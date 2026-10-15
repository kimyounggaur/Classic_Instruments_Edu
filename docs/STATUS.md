# v1.1 구현 상태

기준일: 2026-10-15 (Asia/Seoul). 사용자가 첨부한 v1.1 설계 기준의 로컬 시연 앱이다.

후속 요청으로 GitHub→Vercel 자동 배포를 연결했다. `main`은 [production 시연 앱](https://classic-instruments-edu.vercel.app/)으로, 다른 브랜치는 preview로 배포된다. 클래식 음악원 테마와 선택 가능한 애니메이션의 구현·확인 범위는 [CLASSICAL_THEME](CLASSICAL_THEME.md)에 기록한다. 아래 표는 초기 v1.1 구현 이력이다.

| 단계 | 구현과 확인 |
| --- | --- |
| P00 | 기존 App Router/React/TypeScript와 lockfile 조사, 4악기 범위·자산 인벤토리·요구사항 대응표 |
| P01 | 책장형 홈·목록, 4악기 내비게이션, 프로토타입 배너·가상 역할·반응형 |
| P02 | Zod 스키마, 19 legacy/24 계획/37 후보, 공개 합성8자료·16단원과 관리자 합성4자료 분리 |
| P03 | Promise repository, 브라우저 저장·복구·장애·revision 충돌·초기화 확인 |
| P04 | Unicode/공백/별칭 검색, AND·OR 필터, URL 복원·책장/목록 전환·제목/최근/책장 순서 |
| P05 | 출처·권리·판본 상세, 구조화 뷰어·목차·텍스트200%·북마크·이어읽기·404 |
| P06 | 단원별 앱 후보, 점검·체계·HTTPS 정책, 미점검 비활성·새 탭 속성 |
| P07 | 교안 CRUD·복제·대상 교안 선택·중복 방지·활동 순서·40분 검증·판본 고정·권리별 출력 |
| P08 | 자료/권리/단원/표지/자산 메타데이터·앱37 관리·원자료19 목록·기획24 매핑 |
| P09 | 위치별 지적·fixed/verified·재검수·별도 승인/공개·불변 판본·이력·안전 신고 보류 |
| P10 | lint/typecheck/29 도메인 검사/15 브라우저 검사/production build 통과. 마지막 접근성 속성 보강 후 관련2흐름 재통과. 범위·한계는 TEST_REPORT 참조 |
| P11 | README·5분 데모·인수 문서·실제 검사 증거·보존 자산 해시 |

실행: `pnpm dev` 또는 Windows `start-library.cmd`, 주소 `http://127.0.0.1:3000`.
production은 개발 서버 종료 후 `pnpm build`→`pnpm start`. E2E는 서버가 실행 중일 때 별도 터미널에서 `pnpm test:e2e`.

실제 승인자료는 0개다. 기존14 PDF/631 SVG/14 WebP/4 JSON은 `retained-private/`에 보존했고 원래 공개 URL은 차단했다. 실제 PDF 연결/쪽수 검사, 음악 내용·권리 승인, 외부 앱 실행·정확성/개인정보 검수는 수행하지 않았다. 실제 인증·DB·SSO·학생 진도·기기 권한·외부 AI·배포는 설계의 로컬 MVP 범위에서 제외한다.

이전14악기/38앱 상태 기록은 `docs/legacy/`에 보존했다. 실제 명령과 제한은 [TEST_REPORT](TEST_REPORT.md)에 있다.
