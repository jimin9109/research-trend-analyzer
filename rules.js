// rules.js — 처리 기준 파일 · 판단 기준은 전부 여기에 두고 js/는 읽어서 적용만 함
// 기준을 바꾸면 결과가 바뀌므로 바꿀 때마다 커밋 메시지에 이유를 적기
window.RULES = {
  // 입력 CSV에서 꼭 있어야 하는 열과 선택 열
  columns: {
    required: ['year', 'title'],
    keywords: 'keywords',          // 비어 있으면 제목에서 낱말을 뽑음
    group: 'field',                // 막대를 나눠 칠할 열 (연구 · 기술 · 정책)
    link: 'url'
  },

  // keywords 칸을 나누는 기호 (세미콜론 · 쉼표)
  keywordSeparator: /[;,]/,

  // 키워드에서 뺄 낱말 (제목에서 뽑을 때도 적용)
  stopwords: [
    '연구', '분석', '효과', '영향', '방안', '활용', '대한', '위한', '관한', '통한', '기반',
    'a', 'an', 'and', 'the', 'of', 'in', 'on', 'for', 'to', 'with', 'by', 'from', 'its', 'into', 'via',
    'using', 'based', 'among', 'between', 'study', 'review', 'analysis', 'analyzing', 'results'
  ],

  // 같은 뜻을 하나로 모음 (왼쪽 → 오른쪽) · 오른쪽 이름이 화면에 나옴
  synonyms: {
    '환자 경험': '환자경험',
    '환자경험 평가': '환자경험평가',
    'patient experience': '환자경험',
    'prem': 'PREM',
    'prems': 'PREM',
    'patient-reported experience measures': 'PREM',
    'nlp': '자연어처리',
    'natural language processing': '자연어처리',
    'llm': '대형언어모델',
    'large language model': '대형언어모델',
    '환자중심': '환자중심성',
    'patient-centred care': '환자중심성',
    'patient-centered care': '환자중심성'
  },

  // 제목에서 낱말을 뽑을 때 최소 글자 수
  minTitleWordLength: 2,

  // 추세 판정 (기획안): 마지막 연도 기준 최근 N년 합 vs 이전 N년 합
  trend: {
    window: 3,        // N
    rise: 0.5,        // +50% 이상 → 상승
    fall: -0.5,       // −50% 이하 → 하락 · 그 사이 → 유지
    minCount: 3       // 두 구간 합이 이보다 작으면 → 판정 보류 · 이전 구간이 0건이면 → 신규
  },

  // 상위 키워드 막대에 보일 개수
  topN: 10
};
