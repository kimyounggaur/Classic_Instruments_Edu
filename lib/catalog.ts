/** Catalogue transcribed from the supplied 2026-10-14 development-plan draft.
 * Source textbooks are not represented as expert-reviewed; the webapps have not
 * been independently certified here. See docs/catalog-audit.md.
 */
export type InstrumentFamily = 'strings' | 'woodwinds' | 'brass';
export type AppCategory = InstrumentFamily | 'folk' | 'studio';
export type AppType = 'trainer' | 'coach' | 'tool' | 'studio';
export interface Instrument {
  id: string;
  name: string;
  en: string;
  family: InstrumentFamily;
  color: string;
  sourceUrl: string;
  units: number;
  keywords: string[];
  reviewFocus: string[];
  description: string;
}
export interface WebApp {
  id: string;
  name: string;
  instrument: string;
  category: AppCategory;
  appType: AppType;
  url: string;
  description: string;
}
export interface CatalogCategory { id: 'all' | AppCategory; name: string; en: string }

export const instruments: Instrument[] = [
  {
    "id": "violin",
    "name": "바이올린",
    "en": "Violin",
    "family": "strings",
    "color": "#4a7467",
    "sourceUrl": "https://drive.google.com/file/d/1VfsSWDs5EH8W-D5rlrE98jtRcRUTnxjh/view?usp=drivesdk",
    "units": 10,
    "keywords": [
      "활 잡기",
      "보잉",
      "D장조",
      "슬러",
      "높은 2번"
    ],
    "reviewFocus": [
      "턱받침·어깨받침 조절 및 왼손 엄지·손목 각도",
      "오른손 활 잡기와 D장조 운지 간격",
      "슬러·8분음표 보잉 분배"
    ],
    "description": "활 잡기와 기초 운지에서 슬러까지, 10단원으로 구성된 입문 교재 초안"
  },
  {
    "id": "viola",
    "name": "비올라",
    "en": "Viola",
    "family": "strings",
    "color": "#4a7467",
    "sourceUrl": "https://drive.google.com/file/d/1ICYr_vTIKQJCoQwPZCjds4Df4Bh_Am9o/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "가온음자리표",
      "알토 음자리표",
      "활 무게",
      "1포지션"
    ],
    "reviewFocus": [
      "악기 무게를 고려한 왼팔 지지와 활 무게 전달",
      "가온음자리표 독보와 C–G–D–A 4현 운지 간격"
    ],
    "description": "가온음자리표와 악기 지지, 기초 운지를 다루는 4단원 교재 초안"
  },
  {
    "id": "cello",
    "name": "첼로",
    "en": "Cello",
    "family": "strings",
    "color": "#4a7467",
    "sourceUrl": "https://drive.google.com/file/d/1jl3etgteEy4DTiQseBNIiBVOJi-Xsilp/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "엔드핀",
      "보우 그립",
      "1포지션",
      "0–1–3–4"
    ],
    "reviewFocus": [
      "의자 높이·엔드핀 길이·3점 접촉 균형",
      "첼로 보우 그립과 닫힌 1포지션 운지"
    ],
    "description": "엔드핀과 자세, 활 잡기와 1포지션을 다루는 4단원 교재 초안"
  },
  {
    "id": "bass",
    "name": "콘트라베이스",
    "en": "Double Bass",
    "family": "strings",
    "color": "#4a7467",
    "sourceUrl": "https://drive.google.com/file/d/1Xm6lfT0zAyYb_VhszsjO7O1wVs18DZLz/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "더블베이스",
      "프렌치 보우",
      "저먼 보우",
      "엔드핀"
    ],
    "reviewFocus": [
      "입식·좌식 자세와 엔드핀 높이에 따른 체중 지지",
      "프렌치·저먼 보우 구분 및 기초 운지 체계"
    ],
    "description": "악기 지지와 두 가지 활 잡기, 기초 운지를 다루는 교재 초안"
  },
  {
    "id": "flute",
    "name": "플루트",
    "en": "Flute",
    "family": "woodwinds",
    "color": "#698489",
    "sourceUrl": "https://drive.google.com/file/d/12u5_96qf9-tADN8Y_iBnVYpgQ4sh4nwm/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "플룻",
      "앙부슈어",
      "헤드조인트",
      "시 라 솔",
      "호흡"
    ],
    "reviewFocus": [
      "취구 덮기·바람길 각도와 호흡 가이드",
      "시·라·솔 운지표 및 오른엄지 위치"
    ],
    "description": "소리 내기와 호흡, 시·라·솔 기초 운지를 다루는 교재 초안"
  },
  {
    "id": "oboe",
    "name": "오보에",
    "en": "Oboe",
    "family": "woodwinds",
    "color": "#698489",
    "sourceUrl": "https://drive.google.com/file/d/1NKnSAUTVlwjp2trxu5OXWlQOaYst0czl/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "더블리드",
      "하프홀",
      "옥타브 키",
      "앙부슈어"
    ],
    "reviewFocus": [
      "더블리드 취급 안전과 양 입술 쿠션 앙부슈어",
      "하프홀·옥타브 키 구조와 호흡법"
    ],
    "description": "더블리드 준비와 앙부슈어, 기초 운지를 다루는 교재 초안"
  },
  {
    "id": "clarinet",
    "name": "클라리넷",
    "en": "Clarinet",
    "family": "woodwinds",
    "color": "#698489",
    "sourceUrl": "https://drive.google.com/file/d/1K_iYxewxLax78tnXp7UDUNjmhjGAN9nL/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "브리지 키",
      "리드",
      "리가처",
      "레지스터 키",
      "이조악기"
    ],
    "reviewFocus": [
      "브리지 키를 보호하는 조립 절차와 리드·리가처 정렬",
      "B♭ 기보음·실음 표기 및 입문 운지의 레지스터 키 주의"
    ],
    "description": "조립부터 리드 정렬, 입문 운지까지 연결하는 교재 초안"
  },
  {
    "id": "bassoon",
    "name": "바순",
    "en": "Bassoon",
    "family": "woodwinds",
    "color": "#698489",
    "sourceUrl": "https://drive.google.com/file/d/1elqsVlayDTG3f50rzeNLLNS9b7QjEFjR/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "보칼",
      "시트 스트랩",
      "위스퍼 키",
      "엄지 키"
    ],
    "reviewFocus": [
      "관체 조립 순서와 스트랩 하중 분산",
      "엄지 키·위스퍼 키 운지 도식의 기계적 정확성"
    ],
    "description": "관체 조립과 스트랩, 엄지 키를 다루는 교재 초안"
  },
  {
    "id": "saxophone",
    "name": "색소폰",
    "en": "Saxophone",
    "family": "woodwinds",
    "color": "#698489",
    "sourceUrl": "https://drive.google.com/file/d/15xAD2C4tQ72m6Dy5cdtqrLWGMsYD9ZJm/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "알토 색소폰",
      "넥 스트랩",
      "옥타브 키",
      "시 라 솔"
    ],
    "reviewFocus": [
      "넥 조립 시 옥타브 레버 보호와 스트랩 높이",
      "입문 기보음과 옥타브 키 전환 운지"
    ],
    "description": "넥 조립과 스트랩, 기초 운지 전환을 다루는 교재 초안"
  },
  {
    "id": "trumpet",
    "name": "트럼펫",
    "en": "Trumpet",
    "family": "brass",
    "color": "#c58d49",
    "sourceUrl": "https://drive.google.com/file/d/1g9EtCcPb4qRRMmkQuX_l39_ol8ZEazM_/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "밸브",
      "피스톤",
      "버징",
      "배음"
    ],
    "reviewFocus": [
      "왼손 악기 지지와 오른손 피스톤 밸브 자세",
      "마우스피스 버징과 개방 운지의 배음 원리"
    ],
    "description": "악기 지지와 버징, 3밸브 운지를 다루는 교재 초안"
  },
  {
    "id": "horn",
    "name": "호른",
    "en": "Horn",
    "family": "brass",
    "color": "#c58d49",
    "sourceUrl": "https://drive.google.com/file/d/1b7yZnzzJ8n4K5GybEOiuHh57EBAogkcV/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "로터리",
      "썸 밸브",
      "더블호른",
      "벨"
    ],
    "reviewFocus": [
      "왼손 로터리 레버 조작과 오른손 벨 내부 위치",
      "F/B♭ 더블호른 조옮김과 시작 음역"
    ],
    "description": "로터리 레버와 벨 안의 손 위치를 다루는 교재 초안"
  },
  {
    "id": "trombone",
    "name": "트롬본",
    "en": "Trombone",
    "family": "brass",
    "color": "#c58d49",
    "sourceUrl": "https://drive.google.com/file/d/1nGgsAGLFPOg0c48fSKE8iXLUaTiT3Ycm/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "슬라이드",
      "포지션",
      "슬라이드 잠금",
      "레가토"
    ],
    "reviewFocus": [
      "슬라이드 잠금 안전 수칙과 오른손 그립",
      "제1~7포지션의 시각적 기준과 레가토 텅잉"
    ],
    "description": "슬라이드 안전과 포지션, 레가토를 다루는 교재 초안"
  },
  {
    "id": "euphonium",
    "name": "유포늄",
    "en": "Euphonium",
    "family": "brass",
    "color": "#c58d49",
    "sourceUrl": "https://drive.google.com/file/d/1VDoiqsJO1c7PHjIjfgZfuJxd1B5_5sP3/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "유포니움",
      "밸브",
      "낮은음자리표",
      "호흡"
    ],
    "reviewFocus": [
      "좌식 악기 지지 자세와 3밸브·4밸브 모델 구분",
      "낮은음자리표 실음 기준 밸브 조합과 호흡량"
    ],
    "description": "좌식 자세와 밸브 모델, 기초 음역을 다루는 교재 초안"
  },
  {
    "id": "tuba",
    "name": "튜바",
    "en": "Tuba",
    "family": "brass",
    "color": "#c58d49",
    "sourceUrl": "https://drive.google.com/file/d/1qDsIUzqRcwB0QxbiorbkD_7j0YvNJia_/view?usp=drivesdk",
    "units": 4,
    "keywords": [
      "거치대",
      "저음역",
      "BB♭",
      "밸브"
    ],
    "reviewFocus": [
      "거치대·허벅지 거치 안전과 마우스피스 각도",
      "BB♭/C 튜바 저음역 호흡과 밸브 운지 도식"
    ],
    "description": "안전한 거치와 마우스피스 각도, 저음역을 다루는 교재 초안"
  }
];

export const webapps: WebApp[] = [
  {
    "id": "violin-trainer",
    "name": "Fiddle Tap · 바이올린 운지법 마스터",
    "instrument": "violin",
    "category": "strings",
    "appType": "trainer",
    "url": "https://violin-edu.vercel.app",
    "description": "바이올린 운지 학습 PWA"
  },
  {
    "id": "cello-trainer",
    "name": "첼로 배우기",
    "instrument": "cello",
    "category": "strings",
    "appType": "trainer",
    "url": "https://cello-edu.vercel.app/",
    "description": "첼로 기초 학습 웹앱"
  },
  {
    "id": "flute-learn",
    "name": "플룻 배우기",
    "instrument": "flute",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://flute-edu.vercel.app/",
    "description": "플루트 기초 학습"
  },
  {
    "id": "flute-fingering",
    "name": "플루트 운지법 배우기",
    "instrument": "flute",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://flute-fingering-edu.vercel.app/",
    "description": "플루트 운지 트레이너"
  },
  {
    "id": "flute-coach",
    "name": "플루트 운지 코치",
    "instrument": "flute",
    "category": "woodwinds",
    "appType": "coach",
    "url": "https://flute-fingering-coach.vercel.app/",
    "description": "웹캠을 이용하는 플루트 운지 코치"
  },
  {
    "id": "clarinet-trainer",
    "name": "클라리넷 운지 트레이너",
    "instrument": "clarinet",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://clarinet-fingering-edu.vercel.app/#instrument=Bb",
    "description": "B♭ 클라리넷 운지 트레이너"
  },
  {
    "id": "clarimini-trainer",
    "name": "클라리미니 운지 배우기",
    "instrument": "clarinet",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://clarimini-fingering-edu.vercel.app/",
    "description": "클라리미니 운지 학습"
  },
  {
    "id": "clarinet-coach",
    "name": "클라리 운지 코치",
    "instrument": "clarinet",
    "category": "woodwinds",
    "appType": "coach",
    "url": "https://clarii-fingering-correction.vercel.app/",
    "description": "웹캠을 이용하는 클라리 운지 코치"
  },
  {
    "id": "saxophone-learn",
    "name": "색소폰 배우기",
    "instrument": "saxophone",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://saxophone-edu.vercel.app/",
    "description": "색소폰 기초 학습"
  },
  {
    "id": "saxhands",
    "name": "SaxHands",
    "instrument": "saxophone",
    "category": "woodwinds",
    "appType": "trainer",
    "url": "https://saxhands-webapp.vercel.app/",
    "description": "색소폰 학습 웹앱"
  },
  {
    "id": "saxophone-coach",
    "name": "색소폰 운지 코치",
    "instrument": "saxophone",
    "category": "woodwinds",
    "appType": "coach",
    "url": "https://sax-fingering-coach.vercel.app/",
    "description": "웹캠을 이용하는 색소폰 운지 코치"
  },
  {
    "id": "trumpet-trainer",
    "name": "트럼펫 운지법 배우기",
    "instrument": "trumpet",
    "category": "brass",
    "appType": "trainer",
    "url": "https://trumpet-fingering-edu.vercel.app/",
    "description": "양손 밸브 애니메이션 운지 학습"
  },
  {
    "id": "guitar-chords",
    "name": "기타 코드뷰어",
    "instrument": "guitar",
    "category": "folk",
    "appType": "trainer",
    "url": "https://guitar-chord-viewer.vercel.app/",
    "description": "기타 코드 운지 보기"
  },
  {
    "id": "guitar-coach",
    "name": "기타 코드 운지 교정기",
    "instrument": "guitar",
    "category": "folk",
    "appType": "coach",
    "url": "https://guitar-chord-fingering-correction.vercel.app/",
    "description": "웹캠 기반 기타 코드 운지 교정"
  },
  {
    "id": "ukulele-chords",
    "name": "우쿨렐레 코드뷰어",
    "instrument": "ukulele",
    "category": "folk",
    "appType": "trainer",
    "url": "https://ukulele-chord-viewer.vercel.app/",
    "description": "우쿨렐레 코드 운지 보기"
  },
  {
    "id": "ukulele-coach",
    "name": "우쿨렐레 코드 운지 교정기",
    "instrument": "ukulele",
    "category": "folk",
    "appType": "coach",
    "url": "https://ukulele-chord-fingering-correction.vercel.app/",
    "description": "웹캠 기반 우쿨렐레 코드 운지 교정"
  },
  {
    "id": "miniharp",
    "name": "미니하프 연주하기",
    "instrument": "miniharp",
    "category": "folk",
    "appType": "trainer",
    "url": "https://miniharp-app.vercel.app/",
    "description": "미니하프 연주 실습"
  },
  {
    "id": "gayageum",
    "name": "가야금 운지법 배우기",
    "instrument": "gayageum",
    "category": "folk",
    "appType": "trainer",
    "url": "https://gayageum-fingering-edu.vercel.app/",
    "description": "가야금 운지 학습"
  },
  {
    "id": "recorder",
    "name": "리코더 운지법 배우기",
    "instrument": "recorder",
    "category": "folk",
    "appType": "trainer",
    "url": "https://recorder-fingering-edu.vercel.app/",
    "description": "리코더 운지 학습"
  },
  {
    "id": "ocarina",
    "name": "오카리나 배우기",
    "instrument": "ocarina",
    "category": "folk",
    "appType": "trainer",
    "url": "https://ocarina-master.vercel.app/",
    "description": "오카리나 기초 학습"
  },
  {
    "id": "ocarina-coach",
    "name": "오카리나 운지 코치",
    "instrument": "ocarina",
    "category": "folk",
    "appType": "coach",
    "url": "https://ocarina-fingering-coach.vercel.app/",
    "description": "웹캠 기반 오카리나 운지 코치"
  },
  {
    "id": "panflute",
    "name": "팬플룻 배우기",
    "instrument": "panflute",
    "category": "folk",
    "appType": "trainer",
    "url": "https://panflute-edu.vercel.app/",
    "description": "팬플루트 기초 학습"
  },
  {
    "id": "drums",
    "name": "드럼 연주",
    "instrument": "drums",
    "category": "folk",
    "appType": "trainer",
    "url": "https://drum-beat-pi.vercel.app/",
    "description": "드럼 연주 실습"
  },
  {
    "id": "nanta",
    "name": "난타북 웹앱",
    "instrument": "nanta",
    "category": "folk",
    "appType": "trainer",
    "url": "https://nanta-play.vercel.app/",
    "description": "난타북 연주 실습"
  },
  {
    "id": "kalimba",
    "name": "칼림바 연주하기",
    "instrument": "kalimba",
    "category": "folk",
    "appType": "trainer",
    "url": "https://kalimba-play.vercel.app/",
    "description": "칼림바 연주 실습"
  },
  {
    "id": "tonguedrum",
    "name": "스틸 텅드럼 연주하기",
    "instrument": "tonguedrum",
    "category": "folk",
    "appType": "trainer",
    "url": "https://tonguedrum-play.vercel.app/",
    "description": "스틸 텅드럼 연주 실습"
  },
  {
    "id": "metronome",
    "name": "메트로놈",
    "instrument": "common",
    "category": "studio",
    "appType": "tool",
    "url": "https://metronome-app-flax.vercel.app/",
    "description": "전 악기 공통 박자 연습 도구"
  },
  {
    "id": "scoreforge",
    "name": "ScoreForge · 웹 악보 에디터",
    "instrument": "common",
    "category": "studio",
    "appType": "tool",
    "url": "https://musescore-copy.vercel.app/",
    "description": "웹에서 악보를 제작하는 도구"
  },
  {
    "id": "scorestore",
    "name": "ScoreStore · 디지털 악보 마켓",
    "instrument": "common",
    "category": "studio",
    "appType": "tool",
    "url": "https://kimyounggaur.github.io/A_Score/",
    "description": "디지털 악보 마켓"
  },
  {
    "id": "synth-coach",
    "name": "신디사이저 코치",
    "instrument": "synthesizer",
    "category": "studio",
    "appType": "studio",
    "url": "https://synth-coach-br343uxsk-kimyounggaurs-projects.vercel.app/",
    "description": "신디사이저 학습 도구"
  },
  {
    "id": "synthesizer",
    "name": "Wave Vector Hybrid Synth",
    "instrument": "synthesizer",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/synthesizer/",
    "description": "신디사이저 웹앱"
  },
  {
    "id": "motion-lab",
    "name": "CSS & SVG Motion Lab",
    "instrument": "common",
    "category": "studio",
    "appType": "tool",
    "url": "https://web-app-animation-test.vercel.app/",
    "description": "CSS·SVG 모션 도구"
  },
  {
    "id": "flowdaw",
    "name": "FlowDAW",
    "instrument": "common",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/DAW-master-/",
    "description": "브라우저 DAW 창작 도구"
  },
  {
    "id": "browser-daw",
    "name": "Browser DAW MVP",
    "instrument": "common",
    "category": "studio",
    "appType": "studio",
    "url": "https://accompany-designer2nd.vercel.app/",
    "description": "브라우저 기반 DAW"
  },
  {
    "id": "piano-roll",
    "name": "롤랩 · Piano Roll",
    "instrument": "common",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/Piano_Roll-FL_Studio-/",
    "description": "피아노 롤 창작 도구"
  },
  {
    "id": "voice-track",
    "name": "Voice Track DAW",
    "instrument": "common",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/Vocal_Recording/",
    "description": "보컬 레코딩 DAW"
  },
  {
    "id": "pedalboard-lab",
    "name": "Web Pedalboard Lab",
    "instrument": "guitar",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/Guitar-Muti-Effector/",
    "description": "기타 이펙터 실습 도구"
  },
  {
    "id": "guitar-pedalboard",
    "name": "Guitar Pedal-Board",
    "instrument": "guitar",
    "category": "studio",
    "appType": "studio",
    "url": "https://kimyounggaur.github.io/Guitar-Pedalboard/",
    "description": "기타 페달보드 실습 도구"
  }
];

export const categories: CatalogCategory[] = [
  {
    "id": "all",
    "name": "전체",
    "en": "All"
  },
  {
    "id": "strings",
    "name": "현악기",
    "en": "Strings"
  },
  {
    "id": "woodwinds",
    "name": "목관악기",
    "en": "Woodwinds"
  },
  {
    "id": "brass",
    "name": "금관악기",
    "en": "Brass"
  },
  {
    "id": "folk",
    "name": "생활음악",
    "en": "School & Folk"
  },
  {
    "id": "studio",
    "name": "음악도구 · 스튜디오",
    "en": "Tools & Studio"
  }
];
