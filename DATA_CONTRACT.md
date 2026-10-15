# 데이터 계약

현재 v1.1 프로토타입의 상세 계약은 [docs/DATA_CONTRACT.md](docs/DATA_CONTRACT.md), 실행 타입·검증은 `lib/prototype/`를 따른다.

| 데이터 | 현재 의미 |
|---|---|
| LegacyEntry 19개 | 본문 없는 미검수 메타데이터, draft·권리 unknown·승인 null |
| ModulePlan 24개 | 4악기×6슬롯 제안 계획, 콘텐츠 완성 실적 아님 |
| AppLink 37개 | 첨부 문서 원본 URL 후보, 초기 unchecked·비활성 |
| 합성 책장 8자료/16단원 | 새로 만든 중립 UI 구조 예시, 실제 교육 승인 아님 |
| 합성 관리자 fixture 4자료/8단원 | 검수·권리·보류 예외 시연, 기본 책장 제외 |
| 합성 LessonPlan 4개 | 악기별 40분 구조, 브라우저 저장 |
| 실제 승인자료 | 0개 |

이전 `public/data` 원문 JSON 4개와 교재 파일은 `retained-private/`에 로컬 보존하며 현재 앱에 포함하지 않는다. 과거 `verifiedContent` 필드명은 전문가 검수 근거가 아니다. 원자료·기획·데모·실제 승인을 합산하지 않는다.
