# 테스트 보고서

실행일: 2026-10-14

| 검사 | 결과 | 실제 확인 내용 |
| --- | --- | --- |
| `pnpm typecheck` | 통과 | TypeScript 무출력 검사 통과 |
| `pnpm test` | 통과 | 30개 테스트 통과: 14권·631쪽, 38개 카탈로그 URL, 19개 원자료 검색, 24개 목표 분리, mock-only 경계, mock API 응답 |
| `python3 lib/server/storage.test.py` | 통과 | 기존 D1 스키마·CAS·격리 검증 통과. 개발판 런타임에서는 호출하지 않음 |
| `pnpm lint` | 통과 | 오류·경고 없이 통과 |
| `pnpm build` | 통과 | Vinext 프로덕션 번들 생성 통과 |
| `git diff --check` | 통과 | 공백 오류 없음 |
| 활성 런타임 소스 검색 | 통과 | `getUserMedia`, `mediaDevices`, iframe, 계정 헤더·D1 API 호출, 외부 AI 호출 없음 |

로컬 미리보기 서버는 이 작업 환경의 `uv_interface_addresses` 시스템 오류로 시작하지 못했다. 이는 `pnpm build` 이후 Wrangler/Vite가 네트워크 인터페이스 목록을 읽는 단계에서 발생했으며, 번들·타입·단위 테스트는 통과했다. 오류 보고는 전송하지 않았다.

이 결과는 구현과 데이터 경계의 검증이다. 전문가 감수, 실제 학생 수업, 실연 영상, 운영 배포의 검증이나 승인을 뜻하지 않는다. Git commit/push와 배포는 수행하지 않았다.
