// js/filter.js — 거르기: rules.js의 filter 규칙으로 분석할 자료만 남김
// 결과: { kept, dropped: [{ rec, reason }], keptBy: { 규칙 이름: 건수 }, droppedBy: { 이유: 건수 } }
// rules.filter가 없으면 모두 남김
(function () {
  function textOf(rec, cols) {
    return (cols || []).map(c => rec[c] || '').join('\n');
  }

  function apply(records, rules) {
    const f = rules.filter;
    if (!f) return { kept: records.slice(), dropped: [], keptBy: {}, droppedBy: {} };
    const kept = [], dropped = [], keptBy = {}, droppedBy = {};
    const tally = (m, k) => { m[k] = (m[k] || 0) + 1; };

    records.forEach(rec => {
      const strong = textOf(rec, f.strong);
      const long = textOf(rec, f.long);
      const usesProgram = f.program && (!f.program.source || rec[rules.columns.group] === f.program.source);
      const program = usesProgram ? textOf(rec, f.program.columns) : '';
      const all = [strong, long, program].join('\n');

      const ex = (f.exclude || []).find(r => r.pattern.test(all));
      if (ex) {
        dropped.push({ rec, reason: ex.name });
        tally(droppedBy, ex.name);
        return;
      }
      const where = { all, strong, long, program };
      const inc = (f.include || []).find(r => r.pattern.test(where[r.where] || '') && (!r.andStrong || r.andStrong.test(strong)));
      if (inc) {
        rec.keptBy = inc.name;
        kept.push(rec);
        tally(keptBy, inc.name);
      } else {
        dropped.push({ rec, reason: '포함 규칙에 해당 없음' });
        tally(droppedBy, '포함 규칙에 해당 없음');
      }
    });
    return { kept, dropped, keptBy, droppedBy };
  }

  window.Filter = { apply };
})();
