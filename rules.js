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
    '에이전트 AI': 'AI 에이전트', 'agentic AI': 'AI 에이전트', '에이전틱 AI': 'AI 에이전트', '에이아이 에이전트': 'AI 에이전트',
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

  // ── 2-1. 주제 묶음: 비슷한 키워드를 주제로 모음 ─────────────────────
  // 키워드의 90%가 한 번만 나와서(1,349개 중 1,220개) 키워드 하나로는 늘고 줄었는지 판단하기 어려움
  // → 키워드 안 낱말로 주제를 붙임 · 위에서부터 먼저 맞는 주제 하나 · 띄어쓰기 · 대소문자 무시
  // 한 자료에 키워드가 여럿이면 여러 주제에 들어갈 수 있음 · 어느 주제에도 안 맞으면 '주제 밖 키워드'로 화면에 보임
  view: 'topic',     // 처음 보이는 단위: 'topic' 주제 · 'keyword' 키워드
  topics: [
    { name: 'AI 에이전트', pattern: /에이전트|agent|오케스트레이션/ },
    { name: '생성형 AI · LLM', pattern: /생성형|생성ai|llm|언어모델|gpt|rag|검색증강|증강검색|파운데이션|foundation|챗봇|chatbot|멀티모달|비전언어|할루시네이션/ },
    { name: '피지컬 AI · 로봇', pattern: /피지컬|physical|로봇|로보|robot|휴머노이드|물리지능|자율주행|드론|협업제어|충돌회피|동작|모빌리티/ },
    { name: '디지털 트윈', pattern: /트윈|twin|시뮬레이션|메타버스|가상공간/ },
    { name: '제조 AX · 스마트공장', pattern: /제조|공정|스마트공장|스마트팩토리|팩토리|factory|예지보전|예방정비|유지보수|상태감시|설비|진단|품질|금형|사출|용접|가공|단조|연마|머신비전|불량|생산|자동화|plc/ },
    { name: '데이터 · 플랫폼 · 인프라', pattern: /데이터|플랫폼|클라우드|온톨로지|그래프|iot|사물인터넷|엣지|온디바이스|센서|사스|saas|소프트웨어|노코드|경량화|반도체|erp|보안|랜섬웨어/ },
    { name: '에너지 · 환경', pattern: /에너지|탄소|친환경|태양광|풍력|전력|원자로|원전|이차전지|배터리|수소|환경|리튬|분뇨/ },
    { name: '거버넌스 · 윤리 · 제도', pattern: /거버넌스|governance|정책|규제|윤리|공정성|설명가능|explainable|개인정보|신뢰|제도|법|책임|안전관리|혁신체제|ris|생태계/ },
    { name: '교육 · 인력 · 일하는 방식', pattern: /교육|에듀|리터러시|역량|hrd|인력|일자리|노동|조직|협업|인간-?ai|휴먼|human|직무|업무|암묵지|지식/ },
    { name: '디지털 전환(DX)', pattern: /디지털전환|dx|디지털화|디지털트랜스/ },
    { name: '분야별 AX (공공 · 의료 · 농업 등)', pattern: /공공|행정|의료|헬스|병원|농업|스마트팜|농작업|축산|국방|금융|회계|패션|의류|물류|유통|해양|건설|국토|관광|여행|스포츠|문화|콘텐츠|커머스|키오스크/ },
    { name: 'AI 일반 (인공지능 · 머신러닝)', pattern: /인공지능|^ai$|ai원격|머신러닝|딥러닝|신경망|강화학습|비전ai|예측|학습/ }
  ],

  // ── 3. 추세 판정: 자료가 있는 모든 연도를 씀 ───────────────────────
  // 최근(마지막 연도) vs 그 이전 모든 연도를 합친 것 · 표에는 연도마다 건수와 비중을 함께 보여 줌
  // 2026년 자료가 이전보다 훨씬 많아서 건수로 비교하면 모두 '상승'이 됨
  // → 그 구간 자료 중 그 키워드가 차지하는 비중(%)으로 판정 (basis: 'share')
  // 2019~2021년은 해마다 1건뿐이라 연도별 기울기는 흔들림 → 이전 연도는 합쳐서 비교
  trend: {
    window: 1,           // 최근 구간: 마지막 1년
    previous: 'all',     // 이전 구간: 'all' 그 이전 모든 연도 · 숫자면 그 해 수만큼
    basis: 'share',      // 'share' 비중 · 'count' 건수
    rise: 0.5,           // 비중 +50% 이상이고
    fall: -0.5,          // 비중 −50% 이하이고
    minPointChange: 1,   // 비중 차이가 1%p 이상일 때만 상승 · 하락 (1~2건짜리 작은 키워드가 쉽게 흔들리지 않게)
    minCount: 3,         // 전체 합이 3건 미만이면 → 판정 보류 · 이전 구간 0건이면 → 신규
    singleSeparate: true // 딱 한 번 나온 것은 판정 보류와 따로 '한 번만 나옴'으로 분류
  },

  topN: 15
};
