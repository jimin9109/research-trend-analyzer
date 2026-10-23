// js/keywords.js — 키워드 정리(불용어 · 동의어) · 연도별 빈도 · 추세 판정 · 그룹(과제 · 논문)별 비중
// 기준은 전부 rules.js에서 읽음 · 결과 모양은 js/charts.js 맨 위 설명과 같음
(function () {
  // 대소문자와 (ignoreSpaces면) 띄어쓰기를 무시한 비교용 열쇠
  function keyer(rules) {
    return w => {
      const k = w.toLowerCase();
      return rules.ignoreSpaces ? k.replace(/\s+/g, '') : k;
    };
  }

  function normalizer(rules) {
    const key = keyer(rules);
    const stop = new Set(rules.stopwords.map(key));
    const syn = {};
    Object.entries(rules.synonyms || {}).forEach(([from, to]) => { syn[key(from)] = to; });
    return word => {
      const w = word.trim().replace(/\s+/g, ' ');
      if (!w) return null;
      const out = syn[key(w)] || w;
      return stop.has(key(out)) || stop.has(key(w)) ? null : out;
    };
  }

  // keywords 칸이 있으면 그 값을, 비어 있으면 제목 낱말을 씀 · 한 자료 안의 같은 키워드는 한 번만 셈
  function keywordsOf(rec, rules, norm, key) {
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
      const id = key(k);
      if (!seen.has(id)) { seen.add(id); out.push(k); }
    });
    return { keywords: out, fromTitle };
  }

  // 판정 순서: 판정 보류(합계 < minCount) → 신규(이전 구간 0) → 상승 · 하락 · 유지
  // basis가 'share'면 건수 대신 그 구간 전체 자료 중 비중으로 증가율을 셈
  // minPointChange가 있으면 비중 차이(%p)도 그만큼 나야 상승 · 하락
  function judge(previous, recent, t, prevTotal, recentTotal, total) {
    const prevShare = prevTotal ? previous / prevTotal : null;
    const recentShare = recentTotal ? recent / recentTotal : null;
    const share = t.basis === 'share' && prevTotal && recentTotal;
    const before = share ? prevShare : previous;
    const after = share ? recentShare : recent;
    const growth = before ? (after - before) / before : null;
    const pointChange = prevShare != null && recentShare != null ? (recentShare - prevShare) * 100 : null;
    const bigEnough = sign => !t.minPointChange || (pointChange != null && sign * pointChange >= t.minPointChange);
    let trend;
    if ((total != null ? total : previous + recent) < t.minCount) trend = '판정 보류';
    else if (previous === 0) trend = '신규';
    else if (growth >= t.rise && bigEnough(1)) trend = '상승';
    else if (growth <= t.fall && bigEnough(-1)) trend = '하락';
    else trend = '유지';
    return { growth, trend, prevShare, recentShare, pointChange };
  }

  function analyze(records, rules, skipped) {
    const norm = normalizer(rules);
    const key = keyer(rules);
    const groupCol = rules.columns.group;
    const t = rules.trend;
    const summary = {
      total: records.length, bySource: {}, byYear: {},
      skipped: (skipped || []).map(s => s.line), fromTitle: 0, basis: t.basis || 'count'
    };
    const map = new Map();

    records.forEach(rec => {
      const { keywords, fromTitle } = keywordsOf(rec, rules, norm, key);
      rec.cleanKeywords = keywords;
      if (fromTitle) summary.fromTitle++;
      const y = String(rec.year);
      const g = (groupCol && rec[groupCol]) || '';
      summary.byYear[y] = (summary.byYear[y] || 0) + 1;
      if (g) summary.bySource[g] = (summary.bySource[g] || 0) + 1;
      keywords.forEach(k => {
        const id = key(k);
        const e = map.get(id) || { keyword: k, counts: {}, bySource: {}, total: 0, lines: [] };
        e.total++;
        e.counts[y] = (e.counts[y] || 0) + 1;
        if (g) e.bySource[g] = (e.bySource[g] || 0) + 1;
        e.lines.push(rec.line);
        map.set(id, e);
      });
    });

    const years = records.map(r => r.year);
    const last = years.length ? Math.max(...years) : 0;
    const recentYears = [], previousYears = [];
    for (let i = 0; i < t.window; i++) recentYears.push(String(last - i));
    if (t.previous === 'all') {
      // 최근 구간 앞의 자료가 있는 모든 연도
      Object.keys(summary.byYear).filter(y => +y <= last - t.window).forEach(y => previousYears.push(y));
    } else {
      const n = t.previous || t.window;
      for (let i = 0; i < n; i++) previousYears.push(String(last - t.window - i));
    }
    previousYears.sort().reverse();
    summary.years = Object.keys(summary.byYear).sort();
    summary.lastYear = last;
    summary.recentYears = recentYears.slice().reverse();
    summary.previousYears = previousYears.slice().reverse();
    const sumYears = (counts, ys) => ys.reduce((s, y) => s + (counts[y] || 0), 0);
    summary.previousTotal = sumYears(summary.byYear, previousYears);
    summary.recentTotal = sumYears(summary.byYear, recentYears);

    const groups = Object.keys(summary.bySource);
    const results = [...map.values()].map(e => {
      const recent = sumYears(e.counts, recentYears);
      const previous = sumYears(e.counts, previousYears);
      // 그룹마다 그 그룹 자료 중 이 키워드가 붙은 비중 (과제 vs 논문 비교용)
      const shareBySource = {};
      groups.forEach(g => { shareBySource[g] = (e.bySource[g] || 0) / summary.bySource[g]; });
      return Object.assign(e, { recent, previous, shareBySource },
        judge(previous, recent, t, summary.previousTotal, summary.recentTotal, e.total));
    });
    return { results, summary };
  }

  window.Keywords = { analyze, judge };
})();
