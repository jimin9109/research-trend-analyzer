// rules.js — 처리 기준 파일 · 판단 기준은 전부 여기에 두고 js/는 읽어서 적용만 함
// 기준을 바꾸면 결과가 바뀌므로 바꿀 때마다 커밋 메시지에 이유를 적기
window.RULES = {
  title: 'AX(AI 전환) 연구 동향 분석기',
  subtitle: 'NTIS 과제 · KCI 논문 목록을 넣으면 기준 파일(rules.js)대로 AI 전환 자료를 골라 키워드 흐름을 보여 줍니다',
  sampleFile: 'data/ax-ntis-kci.csv',

  // 입력 CSV 열
  columns: {
    required: ['year', 'title'],
    keywords: 'keywords',          // 비어 있으면 제목에서 낱말을 뽑음
    group: 'source',               // 막대 색 · 비교 기준 (과제 · 논문)
    link: 'url'
  },

  // ── 1. 거르기: 검색어 'AX'에 섞여 들어온 다른 뜻의 자료를 뺌 ─────────────
  // 위에서부터 차례로 봄 · exclude에 걸리면 뺌 → include 중 하나에 걸리면 남김 → 아무것도 아니면 뺌
  filter: {
    strong: ['title', 'title_en', 'keywords', 'keywords_en'],   // 제목 · 키워드
    long: ['summary'],                                          // 요약 · 초록
    program: { columns: ['program'], source: '과제' },          // 사업명 (과제에만)
    exclude: [
      { name: '와이파이 규격(802.11ax)', pattern: /802\.11\s*-?\s*a[cx]|11ax|와이파이|wi-?fi|무선랜|WLAN/i },
      { name: '유전자 · 세포(H2AX)', pattern: /H2AX|DNA damage/i },
      { name: '수학식(AX=Y)', pattern: /A\s*X\s*=\s*Y|AlgL|interpolation/i },
      { name: '인지 · 음성 실험(AX-CPT · AX 판별)', pattern: /AX-CPT|AX\s*(변별|판별)/i },
      { name: '부품 · 미생물 · 별 · 성분 이름', pattern: /AX-?I{1,3}\b|AX-12|Ax0\d|AX Draconis|Arabinoxylan|AX2000|AFRAMAX/i },
      { name: '다른 뜻의 AX(Analyst Experience)', pattern: /Analyst Experience/i }
    ],
    include: [
      { name: 'AI 전환 직접 언급', where: 'all', pattern: /(AI|인공지능)\s*(대\s*)?전환|AI\s*transformation|AX\s*전환/i },
      { name: 'AX 사업 지원 과제', where: 'program', pattern: /(^|[^A-Za-z0-9-])AX(?![A-Za-z0-9=-])/ },
      { name: '제목 · 키워드에 AX', where: 'strong', pattern: /(^|[^A-Za-z0-9-])AX(?=\s?[가-힣])/ },
      { name: 'AX + 제목 · 키워드에 AI 맥락', where: 'all', pattern: /(^|[^A-Za-z0-9-])AX(?![A-Za-z0-9=-])/,
        andStrong: /(^|[^A-Za-z])(AI|DX|LLM)([^A-Za-z]|$)|인공지능|디지털|생성형|에이전트|지능형|자율/ }
    ]
  },

  // ── 2. 키워드 정리 ─────────────────────────────────────────────
  keywordSeparator: /[;,]/,
  ignoreSpaces: true,              // '디지털 트윈'과 '디지털트윈'을 같은 낱말로 봄

  // 키워드에서 뺄 낱말 · 검색어(모든 자료가 AI 전환이라 순위를 덮어 버림)와 너무 넓은 낱말
  stopwords: [
    'AX', 'AI 전환', 'AI전환', '인공지능 전환', 'AI 전환(AX)', '인공지능 전환(AX)', 'AX 전환', 'AI 대전환',
    'AI transformation', 'AX technology', 'AI Transformation(AX)', 'AX(AI Transformation)', 'AX(AI 전환)', 'AX(인공지능 전환)', 'AI 전환(AX: AI Transformation)', '.',
    '연구', '분석', '개발', '기술', '시스템', '플랫폼', '활용', '기반', '방안',
    'a', 'an', 'and', 'the', 'of', 'in', 'on', 'for', 'to', 'with', 'by', 'from', 'its', 'into', 'via',
    'using', 'based', 'among', 'between', 'study', 'review', 'analysis', 'analyzing', 'results'
  ],

  // 같은 뜻을 하나로 모음 (왼쪽 → 오른쪽) · 대소문자 · 띄어쓰기는 무시하고 비교
  synonyms: {
    'AI': '인공지능', 'artificial intelligence': '인공지능', '인공지능(AI)': '인공지능', 'AI(인공지능)': '인공지능', 'Artificial Intelligence(AI)': '인공지능',
    '생성형AI': '생성형 AI', '생성 AI': '생성형 AI', 'generative AI': '생성형 AI',
    'AI 에이전트': 'AI 에이전트', '인공지능 에이전트': 'AI 에이전트', 'AI agent': 'AI 에이전트', 'AI agents': 'AI 에이전트',
    '에이전트 AI': 'AI 에이전트', 'agentic AI': 'AI 에이전트', '에이전틱 AI': 'AI 에이전트',
    '멀티에이전트': '멀티 에이전트', 'multi-agent': '멀티 에이전트',
    '디지털트윈': '디지털 트윈', 'digital twin': '디지털 트윈',
    '피지컬AI': '피지컬 AI', 'physical AI': '피지컬 AI',
    '대형언어모델': 'LLM', '대규모 언어모델': 'LLM', '거대언어모델': 'LLM', 'large language model': 'LLM',
    '디지털 전환': '디지털 전환(DX)', 'digital transformation': '디지털 전환(DX)', 'DX': '디지털 전환(DX)', '디지털 전환(DX)': '디지털 전환(DX)', 'DX(디지털 전환)': '디지털 전환(DX)', '디지털 트랜스포메이션': '디지털 전환(DX)',
    '예지 보전': '예지보전', 'predictive maintenance': '예지보전',
    '스마트 팩토리': '스마트공장', '스마트팩토리': '스마트공장', 'smart factory': '스마트공장',
    '기계학습': '머신러닝', 'machine learning': '머신러닝', 'deep learning': '딥러닝',
    '사물인터넷': 'IoT', 'big data': '빅데이터'
  },

  minTitleWordLength: 2,

  // ── 3. 추세 판정: 2025 → 2026 ──────────────────────────────────
  // 2026년 자료가 2025년보다 훨씬 많아서 건수로 비교하면 모두 '상승'이 됨
  // → 그해 자료 중 그 키워드가 차지하는 비중(%)으로 비교 (basis: 'share')
  trend: {
    window: 1,        // 최근 1년(마지막 연도) vs 그 전 1년
    basis: 'share',   // 'share' 비중 · 'count' 건수
    rise: 0.5,        // 비중 +50% 이상 → 상승
    fall: -0.5,       // 비중 −50% 이하 → 하락 · 그 사이 → 유지
    minCount: 5       // 두 해 합이 5건 미만이면 → 판정 보류 · 그 전 해 0건이면 → 신규
  },

  topN: 15
};
