# 도메인·저장 계약

정확한 실행 타입·Zod 스키마·명령 시그니처는 `lib/prototype/`가 기준이다. 이 문서는 첨부 v1.1의 의미와 보존 규칙을 설명한다. 테스트 실행 증거는 별도 `TEST_REPORT.md`에 기록한다.

## 엔터티와 불변 조건

| 엔터티 | 의미/필수 연결 | 기본 상태/조건 |
|---|---|---|
| LegacyEntry | 원자료 19개 ID·악기·level·단원·페이지 범위 | 본문 없음, draft·권리 unknown·승인 null |
| ModulePlan | 4악기×6슬롯=24 편집 목표, legacy ID 다대다 | proposed, 빈 매핑 허용, 완성 실적 아님 |
| Resource | 제목·악기/체계·종류·수준·목표/주제·출처·version 포인터 | datasetKind와 publicationState 분리 |
| ResourceVersion | 특정 resource의 판본·권리·검수·단원·개정/승인 증거 | 승인본은 불변, 개정은 새 draft |
| Unit | 특정 version의 order·제목·구조화 블록·app ID | 다른 판본/자료 단원 참조 거부 |
| AppLink | 첨부 37 URL·출처·체계·scope·점검/호환·권한 상태 | unchecked, 모르는 권한/체계는 unknown/null |
| ReviewIssue | 자료/version/unit/block 위치·범주·심각도·근거·수정/확인 | fixed와 verified 분리, dismiss 사유 필수 |
| ReviewEvent | 전이 전후·행위자/역할·이유·시각·revision | 새 이벤트 추가, 기존 이벤트 수정 금지 |
| LessonPlan | 목표·악기·수준·시간·준비물·활동·가상여부·revision | 자료/version/unit 고정, 40분=5+10+15+10 |
| Bookmark | resource/version/unit | 조회 시 현재 접근 가능성 재검사 |
| BookPresentation | resource/version·타이포그래피 또는 확인 표지·정렬 | 표지 제작≠교재 완성 |
| ReadingAsset | version·pdf/structured/pptx_source·ref·실측 pageCount/checksum·권리 | 모르는 값 null, 변환/공개 상태 독립 |
| BookPosition | project/resource/version/asset·page 또는 unit·updatedAt | 다른 판본/자산 위치 자동 승계 금지 |

식별자는 안정적인 문자열, 시간은 ISO 8601이다. 학습 수준은 1–3만 사용한다. 클라리넷은 표준 Bb 보엠식과 clarimini/clarii를 섞지 않는다. 실제 학생·학교·성적·얼굴·음성 데이터 모델은 없다.

`Resource.updatedAt`은 실제 자료 변경 시각이다. 초기 seed는 고정 시각을 사용하고, 메타데이터 수정·새 판본·공개·보류 명령은 현재 시각으로 갱신한다. ‘최근 수정순’은 이 시각으로 정렬하며 자료별 편집 횟수인 revision을 날짜 대신 사용하지 않는다. 이전 schemaVersion 1 데이터와 호환되도록 이 필드는 선택적이며, 날짜 없는 자료는 날짜 있는 자료 뒤에서 제목순으로 정렬한다.

## 시드 검증

19 legacy는 바이올린 7+첼로 4+플루트 4+클라리넷 4다. 각 2질문은 원자료 통계(총 38)이며 교육적 정확성 검증이 아니다. 24 계획은 6슬롯(악기 이해·관리/기본 자세/첫 소리·개방현/기초 운지와 기보/기본 리듬·짧은 연습/한 회차 수업 적용)으로 만든다. 19항목을 24개로 복제하지 않는다.

초기 책장 합성 자료는 악기별 2개·자료별 단원 2개(총 8자료/16단원), 교안은 악기별 1개(총 4)다. 별도 관리자 예외 흐름 fixture 4자료/8단원은 처음 책장 통계에서 제외한다. 관리자가 승인/권리 조건을 충족시켜 합성 서고 공개 시연을 명시적으로 실행하면 책장 수량은 증가할 수 있으며 실제 승인 집계는 계속 0이다. 합성 본문은 UI/수업준비 구조 예시이며 실제 운지·호흡·자세 지시가 아니다. 전문가명/서명/실제 승인일/교육성과를 생성하지 않는다. 원본 레지스트리의 38앱 대신 첨부 문서의 정확한 37 URL을 보존한다.

## 공개·권리 명령

`public` 조회는 `reviewed_real`, 해당 버전 approved, 승인자/일시/범위/증거, cleared 권리와 열람 허용, 필수 출처/체계/수준/단원, 미해결 critical/major 없음, published 상태와 같은 publishedVersionId를 모두 요구한다. UI를 통하지 않는 직접 ID 조회에도 적용한다.

`demo` 조회는 합성만 반환한다. legacy에 approved 문자열을 주입해도 공개하지 않는다. 데모 승인 수량과 실제 승인 수량은 합산하지 않는다. allowView/allowPrint/allowDownload/allowRedistribute는 독립이며 UI와 실행 명령에 모두 반영한다. 권리 미확인 파일을 단순 URL로 우회 제공하지 않는다.

## 검수 전이

```text
draft → in_review → changes_requested → re_review
                    ↑                   │
                    └───────────────────┘
in_review/re_review → approved 또는 rejected
approved/rejected → 새 판본 draft (기존 판본 보존)
```

검토 요청은 출처/검토범위/역할 배정, 수정 요청은 위치/심각도/근거, 재제출은 수정내역/응답을 요구한다. 반려·dismiss는 사유가 필요하다. 미해결 중대 지적·안전/핵심 음악 이슈의 임의 무시를 차단한다. 승인 시연은 합성 데이터에서만 수행한다. 승인과 공개는 별도다.

## Promise repository와 오류

필수 기능은 자료 목록/직접조회/단원, 앱 목록/편집, 교안 저장/복제/삭제, 북마크, 위치 기록, 검수 전이, 오류 신고, 메타데이터 편집이다. 모두 Promise로 반환하고 UI는 명령 결과를 처리한다.

오류는 `not_found`, `validation_error`, `storage_unavailable`, `conflict`, `not_allowed`로 구분한다. 중복 명령과 예상 revision을 검증한다. URL은 허용된 https만, javascript/data/file/프로토콜 상대주소와 비허용 호스트를 거부하며 `#instrument=Bb`는 보존한다. 단원-앱 악기체계와 FK/중복 ID를 검증한다.

## 저장 envelope

저장 객체는 schemaVersion·revision·데이터와 프로젝트 namespace를 갖는다. browser 전용 어댑터에서만 localStorage에 접근한다. SSR·복원 전 seed 덮어쓰기 금지. 손상/이전 버전/QuotaExceededError/차단 시 메모리 모드와 사용자 안내를 제공하며 실패 결과를 저장 성공으로 표시하지 않는다. 초기화는 확인 후 실행한다. 읽기 위치에 실학생 진도/학습효과 의미를 부여하지 않는다.
