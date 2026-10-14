# 데이터 계약

| 데이터 | 역할 | 답변 사용 | 상태 |
| --- | --- | --- | --- |
| `public/data/textbooks.json` | 14권 페이지·목차·원문 연결 | 페이지 탐색·검색만 | 교재 초안 |
| `public/data/knowledge.json` | 4악기 19개 미검수 원자료 발췌 | 결정적 검색만 | `unreviewed_source` |
| `public/data/target_catalog.json` | P00–P11 목표 24개 | 사용 금지 | `implementation_target_only` |
| `public/data/webapp_registry.json` | 38개 앱 메타데이터 | UI 카탈로그만 | 외부 실행 미검증 |

`knowledge.json`의 각 항목은 `instrument`, `chapter`, `pageRange`, `verifiedContent`, `fingeringSpec`, `cautionNotes`, `sourceFileUrl`, `sampleQuestions`를 가진다. `verifiedContent`라는 필드명은 기존 원본 호환성을 위한 이름일 뿐 감수 완료를 뜻하지 않는다.

`target_catalog.json`은 반드시 24개 항목을 유지한다. 각 항목은 `id`, `phase`, `title`, `status`를 가지며 `answerEligibility: false`여야 한다.

어떤 화면도 24개 목표를 19개 원자료로 합산하거나, 목표를 보조교사 답변의 근거로 사용해서는 안 된다.
