// js/keywords.js — 키워드 정리(불용어 · 동의어) · 연도별 빈도 · 추세 판정
// 기준은 전부 rules.js에서 읽음 · 결과 모양은 js/charts.js 맨 위 설명과 같음
(function () {
  function normalizer(rules) {
    const stop = new Set(rules.stopwords.map(s => s.toLowerCase()));
    const syn = {};
    Object.entries(rules.synonyms || {}).forEach(([from, to]) => { syn[from.toLowerCase()] = to; });
    return word => {
      const w = word.trim().replace(/\s+/g, ' ');
      if (!w) return null;
      const key = w.toLowerCase();
      const out = syn[key] || w;
      return stop.has(out.toLowerCase()) ? null : out;
    };
  }

  // keywords 칸이 있으면 그 값을, 비어 있으면 제목 낱말을 씀 · 한 자료 안의 같은 키워드는 한 번만 셈
  function keywordsOf(rec, rules, norm) {
    const raw = rec[rules.columns.keywords];
    let words;
    let fromTitle = false;
    if (raw) {
      words = raw.split(rules.keywordSeparator);
    } else {
      fromTitle = true;
      words = rec.title.split(/[^0-9A-Za-z가-힣\-]+/).filter(w => w.length >= rules.minTitleWordLength);
    }
    const seen = new Set();
    const out = [];
    words.map(norm).filter(Boolean).forEach(k => {
      const key = k.toLowerCase();
      if (!seen.has(key)) { seen.add(key); out.push(k); }
    });
    return { keywords: out, fromTitle };
  }

  // 판정 순서: 판정 보류(두 구간 합 < minCount) → 신규(이전 구간 0) → 상승 · 하락 · 유지
  function judge(previous, recent, t) {
    const growth = previous ? (recent - previous) / previous : null;
    let trend;
    if (previous + recent < t.minCount) trend = '판정 보류';
    else if (previous === 0) trend = '신규';
    else if (growth >= t.rise) trend = '상승';
    else if (growth <= t.fall) trend = '하락';
    else trend = '유지';
    return { growth, trend };
  }

  function analyze(records, rules, skipped) {
    const norm = normalizer(rules);
    const groupCol = rules.columns.group;
    const t = rules.trend;
    const summary = { total: records.length, bySource: {}, byYear: {}, skipped: (skipped || []).map(s => s.line), fromTitle: 0 };
    const map = new Map();

    records.forEach(rec => {
      const { keywords, fromTitle } = keywordsOf(rec, rules, norm);
      rec.cleanKeywords = keywords;
      if (fromTitle) summary.fromTitle++;
      const y = String(rec.year);
      const g = (groupCol && rec[groupCol]) || '';
      summary.byYear[y] = (summary.byYear[y] || 0) + 1;
      if (g) summary.bySource[g] = (summary.bySource[g] || 0) + 1;
      keywords.forEach(k => {
        const key = k.toLowerCase();
        const e = map.get(key) || { keyword: k, counts: {}, bySource: {}, total: 0, lines: [] };
        e.total++;
        e.counts[y] = (e.counts[y] || 0) + 1;
        if (g) e.bySource[g] = (e.bySource[g] || 0) + 1;
        e.lines.push(rec.line);
        map.set(key, e);
      });
    });

    const years = records.map(r => r.year);
    const last = years.length ? Math.max(...years) : 0;
    const recentYears = [], previousYears = [];
    for (let i = 0; i < t.window; i++) {
      recentYears.push(String(last - i));
      previousYears.push(String(last - t.window - i));
    }
    summary.lastYear = last;
    summary.recentYears = recentYears.slice().reverse();
    summary.previousYears = previousYears.slice().reverse();

    const sumOf = (e, ys) => ys.reduce((s, y) => s + (e.counts[y] || 0), 0);
    const results = [...map.values()].map(e => {
      const recent = sumOf(e, recentYears);
      const previous = sumOf(e, previousYears);
      return Object.assign(e, { recent, previous }, judge(previous, recent, t));
    });
    return { results, summary };
  }

  window.Keywords = { analyze, judge };
})();
