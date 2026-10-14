# 레슨 디자이너 · 음악 전자도서관

첨부된 「모두의 창업 2기(2차 라운드) 클래식 악기 교육 전자도서관 개발 계획서」를 기반으로 만든 실제 교재 기반 개발판입니다.

## 실행 구성

- React 19 + Next App Router 호환 Vinext, TypeScript, CSS/Tailwind 빌드
- Cloudflare Worker 서버 + Sites 인증 + D1 개인 상태/수업 저장
- 실제 PPTX 14권에서 변환한 631쪽 자체 포함 SVG·PDF·검색 텍스트
- 계획서에 적힌 고유 외부 실습 웹앱 38개 전체 보존
- StPageFlip 책장 엔진, 단면/양면, 페이지·책갈피·원문 검색
- 교사 브리핑·원문 발췌 검색: 제공된 4악기·19항목을 사용하며, 생성형 답변을 만들지 않음

계획서의 Next.js 14 고정 버전 대신 호스팅 환경이 제공하는 Next 호환 런타임을 사용했습니다. 개발 목적과 기능 구조는 유지하며 원본 교재·웹앱 출처를 보존했습니다.

## 개발

`pnpm install` 후 `pnpm dev`. 실제 배포/관리형 환경에서는 Sites 스킬의 설치·미리보기·패키징 도구를 사용합니다. D1 binding은 `DB`입니다. 변경된 스키마는 `pnpm db:generate`로 추가 마이그레이션을 생성합니다.

```sh
node node_modules/typescript/bin/tsc --noEmit
node --experimental-strip-types --experimental-transform-types --test tests/knowledge.test.ts lib/server/validation.test.mjs lib/state-sync.test.mjs
python3 lib/server/storage.test.py
```

## 핵심 파일

- `components/LibraryApp.tsx`: 서가/검색/앱/검수/기록 화면
- `components/BookReader.tsx`: 교재 뷰어
- `components/MultiAnglePlayer.tsx`: 실제 URL 기반 영상·카메라 비교
- `components/TeachingPanel.tsx`: 근거 기반 보조교사
- `components/Classroom.tsx`: 수업·학생 미션 기록
- `lib/catalog.ts`, `public/data/webapp_registry.json`: 앱 및 교재 레지스트리
- `public/data/textbooks.json`: 실제 교재 페이지·목차·출처
- `public/data/knowledge.json`: 출처 보존 학습 근거
- `app/api/`: 인증을 요구하는 계정/수업 API
- `db/schema.ts`, `drizzle/`: 영속 저장 스키마/마이그레이션

## 실제 자료가 더 필요한 부분

교재는 전문 교사 검수 전 초안입니다. 실제 감수 증빙·실연 영상·ISBN·현장 실증 결과는 소프트웨어로 만들어 완료 처리하지 않습니다. 원본 문서의 '할루시네이션 0%'는 제품에서 보장하지 않으며, 현재는 추측 답변을 막는 원문 발췌 방식입니다. 상세 구현 범위 및 추가 연동은 `docs/implementation-status.md`, 데이터 출처는 `docs/SOURCE_AUDIT.md`를 참고하세요.

새 사이트는 소유자 비공개 상태입니다. 수업 참여 코드는 사이트 접근 권한을 대신하지 않습니다. 기존 외부 앱은 자체 임베드/카메라 정책을 가지며 현재 소스 저장소에서 일괄 수정하지 않았습니다.
