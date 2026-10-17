// demo/fake-results.js — B 화면 시험용 가짜 결과 (A의 keywords.js가 완성되면 쓰지 않음)
// 기획안 "A가 B에게 넘길 결과 한 건" 모양 · 숫자는 손 검산할 수 있게 지어낸 값
// 판정 규칙(기획안): 최근 3년(2022~2024) vs 이전 3년(2019~2021) · +50% 이상 상승 · −50% 이하 하락
//                    · 6년 합 3건 미만 판정 보류 · 이전 3년 0건이면 신규
window.FAKE_SUMMARY = {
  total: 60,
  bySource: { '과제': 22, '논문': 38 },
  byYear: { 2019: 8, 2020: 9, 2021: 9, 2022: 10, 2023: 11, 2024: 13 },
  skipped: [4, 17]
};

window.FAKE_RESULTS = [
  { keyword: '환자경험평가', counts: { 2019: 2, 2020: 3, 2021: 3, 2022: 4, 2023: 5, 2024: 4 }, bySource: { '과제': 9, '논문': 12 }, total: 21, previous: 8, recent: 13, growth: 0.625, trend: '상승' },
  { keyword: '환자중심성', counts: { 2019: 1, 2020: 2, 2021: 1, 2022: 3, 2023: 2, 2024: 4 }, bySource: { '과제': 5, '논문': 8 }, total: 13, previous: 4, recent: 9, growth: 1.25, trend: '상승' },
  { keyword: '자연어처리', counts: { 2019: 0, 2020: 0, 2021: 1, 2022: 1, 2023: 2, 2024: 3 }, bySource: { '과제': 3, '논문': 4 }, total: 7, previous: 1, recent: 6, growth: 5, trend: '상승' },
  { keyword: 'PREM', counts: { 2019: 0, 2020: 0, 2021: 0, 2022: 1, 2023: 3, 2024: 4 }, bySource: { '과제': 1, '논문': 7 }, total: 8, previous: 0, recent: 8, growth: null, trend: '신규' },
  { keyword: '환자만족도', counts: { 2019: 5, 2020: 4, 2021: 3, 2022: 2, 2023: 1, 2024: 1 }, bySource: { '과제': 6, '논문': 10 }, total: 16, previous: 12, recent: 4, growth: -0.6667, trend: '하락' },
  { keyword: '설문도구', counts: { 2019: 2, 2020: 3, 2021: 2, 2022: 1, 2023: 1, 2024: 0 }, bySource: { '과제': 2, '논문': 7 }, total: 9, previous: 7, recent: 2, growth: -0.7143, trend: '하락' },
  { keyword: '의사소통', counts: { 2019: 3, 2020: 2, 2021: 3, 2022: 3, 2023: 2, 2024: 3 }, bySource: { '과제': 4, '논문': 12 }, total: 16, previous: 8, recent: 8, growth: 0, trend: '유지' },
  { keyword: '환자안전', counts: { 2019: 3, 2020: 3, 2021: 2, 2022: 2, 2023: 3, 2024: 3 }, bySource: { '과제': 7, '논문': 9 }, total: 16, previous: 8, recent: 8, growth: 0, trend: '유지' },
  { keyword: '의료질', counts: { 2019: 2, 2020: 2, 2021: 2, 2022: 3, 2023: 2, 2024: 2 }, bySource: { '과제': 5, '논문': 8 }, total: 13, previous: 6, recent: 7, growth: 0.1667, trend: '유지' },
  { keyword: '실시간피드백', counts: { 2023: 1, 2024: 1 }, bySource: { '과제': 1, '논문': 1 }, total: 2, previous: 0, recent: 2, growth: null, trend: '판정 보류' },
  { keyword: '공유의사결정', counts: { 2020: 1, 2024: 1 }, bySource: { '논문': 2 }, total: 2, previous: 1, recent: 1, growth: 0, trend: '판정 보류' },
  { keyword: '대형언어모델', counts: { 2024: 2 }, bySource: { '논문': 2 }, total: 2, previous: 0, recent: 2, growth: null, trend: '판정 보류' }
];
