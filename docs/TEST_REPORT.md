# v1.1 검사 보고서

실행일: 2026-10-15 (Asia/Seoul). 실제 로컬 코드와 production 서버 기준이며 음악 내용 승인·보안/접근성 인증을 뜻하지 않는다.

아래는 초기 v1.1 검증 기록이다. 후속 클래식 UI·움직임 변경의 검증 결과는 [CLASSICAL_THEME](CLASSICAL_THEME.md)에 별도로 기록한다.

## 환경과 명령

Windows PowerShell, Node v24.14.0, pnpm11.25.0. 기존 lockfile의 Next16.3.4/React19.2.6/TypeScript5.9.3/Zod3.25.76 유지. `pnpm install --frozen-lockfile` 통과. Sites 설치 helper가 Windows에서 시작되지 않아 기존 pnpm 경로로 설치했다.

| 검사 | 결과 | 범위 |
| --- | --- | --- |
| `pnpm lint` | 통과 | 오류·경고0, 새 UI/도메인/경로와 기존 소스 |
| `pnpm typecheck` | 통과 | 프로젝트 전체 TypeScript |
| `pnpm test` | 29/29 통과 | 원본19 ID/37 URL, 24목표, 검색/참조/공개/검수/권리/저장/충돌/불변성 |
| `pnpm build` | 통과 | Next 운영 빌드·타입·라우트 생성 |
| `pnpm test:e2e` | 15/15 통과 | 4악기 핵심 흐름·검색/404·미저장 이동·관리자/연습실·저장 장애·안전 신고·인쇄 권리·반응형/확대 |
| 최종 대화상자 이름 집중 회귀 | 2/2 통과 | 접근성 이름/필수 입력 속성 보강 후 최종 빌드에서 `--suite=core-violin`, `--suite=safety-report` 재실행 |

## 도메인 회귀

- 공개 조회/직접 ID와 명령의 승인·권리 증거·필수 메타데이터·판본 일치·중대 지적 차단. 합성과 실제 승인 분리.
- 승인된 단원/교육 메타데이터 수정 차단, 새 ID·초안·원본과 교안 참조 보존. fixed와 verified, 허용 전이·역할·중복command·revision 충돌 구분.
- 손상 JSON 원본 보존, quota 오류·임시 메모리 안내, 두 탭 충돌·초기화 취소. project/resource/version/asset/unit 읽기위치, 구조화 단원을 PDF 쪽수로 기록하지 않음.
- HTTPS 호스트/자격증명·체계 불일치·클라리미니·스크립트URL·미디어경로·가짜PDF·권리 확대 거부.
- 40분(5+10+15+10)/잘못된 합계·분수 검증, 실제 수정시각 정렬, 신고 단원/블록 소유권.

## 브라우저와 화면 증거

Playwright CLI0.1.22/Chrome. 새로운 브라우저 context의 합성 fixture를 사용한다. 외부 요청을 차단·기록하고 기기 권한 호출을 감시한다.

종합 결과는 15/15 성공, 실패·skip0이다. 모든 묶음에서 외부 요청·카메라/마이크/화면공유/위치 권한 호출0을 확인했다. Chromium 버전은155.0.8059.40이다.

- 자동 결과: `output/playwright/prototype-e2e-report.json`. 개별 suite 로그·실패/성공 스크린샷도 같은 폴더.
- 검수 수동 QA: `output/playwright/workspace-review-qa.md`.
- 최종 집중 검사: `prototype-e2e-report-core-violin.json`, `prototype-e2e-report-safety-report.json`. 종합15/15 보고서를 보존한다.
- 추가 관리자 QA: 원자료19행/악기7·4·4·4/판본 비교7행/현재 판본 의견/표지 제목 새로고침/장식 표시 방식 반영을 확인했고 브라우저 오류0이었다.
- 화면: `final-bookshelf-desktop.png`, `final-bookshelf-mobile.png`, 악기별 교안·화면별 해상도·확대 이미지.
- 검수 QA: 검토→중대 지적→승인 차단→수정요청→새판본→fixed→verified→재검토→동의된 합성 표시명→승인→별도 합성 공개. 별도 자료의 권리 미확인 공개 차단/권리 갱신 후 공개도 확인.
- 모바일 메뉴의 Tab/Escape/호출 버튼 focus 복귀는 실제 브라우저에서 확인했다.
- 미저장 교안의 뒤로가기 취소/확인·새로고침 beforeunload 취소·내부 메뉴의 단일 확인창은 수정한 production 빌드에서 별도 회귀를 통과했다.
- 기본 본문 대비10.80:1, 주 버튼9.07:1, 작은 라벨5.37:1을 수식으로 계산했다. 표지 글자는 악기별4.54/5.18/4.89/4.80:1이다. 전체 WCAG 준수 인증은 하지 않았다.

## 발견 후 수정한 문제

1. dev와 build의 `.next` 충돌: 두 서버를 동시에 사용하지 않고 최종 검사는 production에서 진행.
2. 교안 담기 중복: 대상 선택·동일참조 검사·in-flight 차단.
3. 인쇄 권한: 버튼·명령뿐 아니라 CSS에서도 제한 본문 제외.
4. 승인 메타데이터 우회: repository 가드·새 초안 요구.
5. form label/미저장 Back: explicit label과 취소 시 URL·편집 유지. Next가 popstate 전에 편집 화면을 해제하는 순서를 재현했고, 지원 브라우저의 Navigation API traverse 단계에서 먼저 확인·취소한다. popstate·beforeunload 보조 경로도 유지한다.
6. 없는 URL의 streamed200: global loading을 뷰 fallback으로 옮겨 초기 notFound를 기다림.
7. 텍스트200%+페이지 CSS zoom200%를 동시에 적용할 때 가로 넘침: 실제 가용 폭 container query로 3→2→1열 재배치.

## 미실행과 제외

외부 앱 실제 실행·음악/모바일/개인정보 검수, 교재 원문·PDF 전 페이지/글꼴/기호 검사는 미실행이다. 물리 프린터·모든 OS/브라우저/보조공학·native 브라우저 UI zoom 조합도 미실행이다. 확대 자동검사는 뷰어 텍스트200%와 CSS page zoom200% 스트레스 검사다.

실계정·외부DB·RLS·SSO·학생진도·카메라정확도·외부AI·배포는 범위 제외. 구형 `test:legacy`는 이전public14교재/38앱 계약이므로 이번 수락 검사로 실행하지 않았다. 이전 보고서는 `docs/legacy/`에 보존했다.
