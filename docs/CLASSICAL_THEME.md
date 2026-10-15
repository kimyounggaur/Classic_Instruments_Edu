# 클래식 음악원 테마

2026-10-15 (Asia/Seoul). 레슨생이 편안하게 자료를 둘러볼 수 있도록 기존 서고의 화면 분위기와 움직임을 변경했다.

## 화면

- 아이보리 종이 배경에 낮은 대비의 장식 악보를 배치했다. 남색 내비게이션과 공연장 아치, 금색 선으로 그린 네 악기가 클래식 음악원의 분위기를 만든다.
- 첫 화면은 “오늘의 한 음이, 내일의 음악으로.”와 “나의 속도로, 클래식과 가까워지는 시간.”으로 안내한다. 자료 종류·검수·합성 시연 표시는 유지한다.
- 표지는 브라운·블루·플럼·올리브 계열로 구분한다. 교재 읽기·수업안·관리자 화면도 같은 종이색과 남색 버튼을 사용한다.
- 모바일에서는 공연장 장식을 문구 아래에 배치한다. 악기 그림과 악보는 교육용 운지·정확한 악보가 아닌 `aria-hidden` 장식이다.

## 참고와 적용

[CSS & SVG Motion Lab](https://web-app-animation-test.vercel.app/)의 실제 갤러리와 마이크로 인터랙션을 확인하고 다음 기법을 이 앱에 맞게 구현했다. 외부 런타임·영상·오디오·캔버스·3D 패키지를 가져오지 않는다.

| 기법 | 적용 위치 | 동작 |
| --- | --- | --- |
| SVG stroke drawing | 공연장 위 악보·악기 윤곽선 | `pathLength=1`, 2.4–2.8초 선 그리기 |
| Opacity / translate entrance | 네 악기 일러스트 | 1.8초, 악기별 최대 380ms 지연 |
| IntersectionObserver reveal | 자료 카드·바로가기 | 화면에 들어오면 한 번 표시, 560ms 전환 |
| Card lift / hover transition | 표지·수업안·연습실 | 정밀 포인터에서만 3–5px 들어 올림 |
| Toggle pop | 북마크 | 선택 후 360ms 피드백 |
| Modal / toast entrance | 대화상자·저장 알림 | 230–250ms 등장 |

자동 장식 애니메이션은 짧게 끝난다. 자료를 읽는 동안 지속적으로 반복되는 움직임은 없다. 레이아웃 위치를 매 프레임 계산하거나 전체 페이지를 변형하지 않는다.

## 움직임 설정

상단 버튼이 켜짐/꺼짐을 `aria-pressed`로 제공한다. `lesson-designer-library:motion:v1` 키에 설정을 저장하며, 교재·수업안 데이터 키와 분리한다. 브라우저 저장이 막혀도 현재 세션에서 켜기/끄기가 동작한다. 다른 탭의 설정 변경도 반영한다.

기기의 `prefers-reduced-motion: reduce`가 우선한다. OS 설정 변경을 실시간 반영하고, 애니메이션과 부드러운 스크롤을 모두 끈다. 이때 버튼은 기기 설정을 따른다는 접근성 이름을 제공한다.

IntersectionObserver가 없으면 콘텐츠를 바로 표시한다. 키보드 초점이 들어온 카드도 즉시 표시한다. 인쇄 시 배경·악기 장식을 제거하고 기존 출처·권리 제한 출력을 유지한다.

## 구현

- `components/prototype/classical-theme.css`: 화면 전용 테마·반응형·모션·인쇄 예외.
- `components/prototype/ClassicalMotion.tsx`: 설정 구독, 저장 실패 대체, 노출 observer, 장식 배경.
- `components/prototype/PrototypeApp.tsx`: 공연장 일러스트·학생 중심 첫 화면·움직임 버튼.
- `tests/prototype-e2e.mjs`: 기존 사용자 흐름과 `classical-motion` 검사.

## 검증 결과

2026-10-15, Windows/Node24/Chromium155/Playwright CLI0.1.22에서 확인했다.

| 검사 | 결과 |
| --- | --- |
| `pnpm lint` | 통과, 오류·경고 0 |
| `pnpm typecheck` | 통과 |
| `pnpm test` | 기존 도메인 29/29 통과 |
| `pnpm exec next build` | Vercel과 같은 Turbopack production 빌드·타입 검사 통과 |
| 개발 서버 브라우저 검사 | 16/16 통과 |
| production 서버 브라우저 검사 | 16/16 통과 |

기존 15개 사용자 흐름에 일반 동작 설정의 `classical-motion` 검사를 추가했다. 네 악기 열람·북마크·교안 저장/복제/출력, 검색/라우팅, 관리자·저장 장애 복구·안전 신고·권리 제한을 확인한다. 반응형 검사는 홈·리더·수업안·관리자에서 320/360/768/1440/1920px와 200% 텍스트/CSS 확대를 포함한다.

추가 검사는 실제 악보·악기 선 그리기 적용, 스크롤한 모든 카드 표시, 켜기/끄기·새로고침 유지, 기기의 동작 줄이기 실시간 변경, 저장 차단 상태의 반복 토글, 움직임을 끈 상태의 즉시 스크롤, 인쇄 장식 제외를 확인했다. 전체 묶음에서 외부 요청·기기 권한 호출·브라우저 오류는 0이다.

단색 조합의 계산상 대비는 본문 11.54:1, 보조 문구 4.92:1, 대표 화면 제목 11.93:1, 금색 버튼 8.02:1, 표지 제목은 악기별 5.17–7.93:1이다. 이 계산은 전체 접근성 인증을 뜻하지 않는다.

- 자동 보고서: `output/playwright/prototype-e2e-report.json`.
- production 최종 화면: `output/playwright/classical-final-desktop.png`, `classical-final-mobile.png`.
- 일반 동작·기기 설정·저장 장애 검사: `output/playwright/classical-motion.log`.

GitHub `main` 푸시를 기존 Vercel production 자동 배포로 연결한다. 배포 주소는 [classic-instruments-edu.vercel.app](https://classic-instruments-edu.vercel.app/)이다.
