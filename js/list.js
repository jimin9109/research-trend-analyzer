// js/list.js — B 담당: 키워드 추세 목록(판정 탭 · 검색) · 판정 보류 목록 · CSV/마크다운 내보내기
// 받는 데이터 모양은 js/charts.js 맨 위 설명과 같음 · 판정(trend)은 A가 붙인 값을 그대로 씀
(function () {
  // 탭 순서 · 여기 없는 판정 이름이 오면 뒤에 붙임
  const TREND_ORDER = ['상승', '신규', '하락', '유지', '판정 보류'];
  const HELD = '판정 보류';

  function el(tag, cls, text) {
    const node = document.createElement(tag);
    if (cls) node.className = cls;
    if (text != null) node.textContent = text;
    return node;
  }

  function clear(node) {
    while (node.firstChild) node.removeChild(node.firstChild);
  }

  function trendsOf(results) {
    const found = [...new Set(results.map(r => r.trend).filter(Boolean))];
    return TREND_ORDER.filter(t => found.includes(t)).concat(found.filter(t => !TREND_ORDER.includes(t)));
  }

  // 1.25 → "+125%" · 이전 3년이 0건이라 계산할 수 없으면 "—"
  function pct(growth) {
    if (growth == null || !Number.isFinite(growth)) return '—';
    const v = Math.round(growth * 100);
    return (v > 0 ? '+' : '') + v + '%';
  }

  function byTotal(a, b) {
    return b.total - a.total || a.keyword.localeCompare(b.keyword, 'ko');
  }

  // 표 머리말: [이전 구간, 최근 구간, 증가율] · 요약에 판정 구간이 있으면 실제 연도로 (예: 이전 2021–2023 · 2025)
  function periodLabels(summary) {
    const p = (summary && summary.previousYears) || [];
    const r = (summary && summary.recentYears) || [];
    const span = ys => ys.length > 1 ? `${ys[0]}–${ys[ys.length - 1]}` : (ys[0] || '');
    return [
      p.length ? `이전 ${span(p)}` : '이전 3년',
      r.length ? `최근 ${span(r)}` : '최근 3년',
      summary && summary.basis === 'share' ? '비중 증가율' : '증가율'
    ];
  }

  function filterResults(results, trend, query) {
    const q = (query || '').trim().toLowerCase();
    return results
      .filter(r => trend === '전체' || r.trend === trend)
      .filter(r => !q || r.keyword.toLowerCase().includes(q))
      .sort(byTotal);
  }

  // 판정 탭 + 검색 칸 + 표 + 내보내기 버튼을 한 묶음으로 그림 · opts.onSelect(keyword): 행을 누르면 호출
  function renderTrendSection(container, results, summary, opts) {
    opts = opts || {};
    clear(container);
    const labels = periodLabels(summary);
    const sources = window.Charts.sourcesOf(results, summary);
    const years = window.Charts.yearsOf(results, summary);
    const state = { trend: '전체', query: '' };

    const head = el('div', 'list-head');
    const search = el('input', 'search');
    search.type = 'search';
    search.placeholder = '키워드 검색';
    const csvBtn = el('button', 'btn', 'CSV 내보내기');
    const mdBtn = el('button', 'btn', '마크다운 내보내기');
    head.append(search, csvBtn, mdBtn);

    const tabs = el('div', 'tabs');
    const count = el('p', 'list-count');
    const tableWrap = el('div', 'table-wrap');
    container.append(head, tabs, count, tableWrap);

    function drawTabs() {
      clear(tabs);
      ['전체'].concat(trendsOf(results)).forEach(t => {
        const n = t === '전체' ? results.length : results.filter(r => r.trend === t).length;
        const tab = el('button', 'tab' + (state.trend === t ? ' active' : ''));
        tab.append(document.createTextNode(t + ' '), el('strong', null, String(n)));
        tab.addEventListener('click', () => { state.trend = t; draw(); });
        tabs.append(tab);
      });
    }

    function draw() {
      drawTabs();
      const rows = filterResults(results, state.trend, state.query);
      count.textContent = `${rows.length}개 키워드`;
      clear(tableWrap);
      tableWrap.append(buildTable(rows, sources, labels, opts.onSelect));
    }

    search.addEventListener('input', () => { state.query = search.value; draw(); });
    csvBtn.addEventListener('click', () => {
      const rows = filterResults(results, state.trend, state.query);
      download('keyword-trends.csv', toCSV(rows, sources, years), 'text/csv');
    });
    mdBtn.addEventListener('click', () => {
      download('keyword-trends.md', toMarkdown(results, summary, sources, labels), 'text/markdown');
    });
    draw();
  }

  function buildTable(rows, sources, labels, onSelect) {
    const table = el('table', 'trend-table');
    const head = ['키워드', '합계'].concat(sources, labels, ['판정']);
    const thead = el('thead');
    const tr = el('tr');
    head.forEach(h => tr.append(el('th', null, h)));
    thead.append(tr);
    table.append(thead);

    const tbody = el('tbody');
    if (!rows.length) {
      const empty = el('tr');
      const td = el('td', 'empty', '조건에 맞는 키워드가 없습니다.');
      td.colSpan = head.length;
      empty.append(td);
      tbody.append(empty);
    }
    rows.forEach(r => {
      const row = el('tr');
      if (onSelect) {
        row.className = 'clickable';
        row.title = '누르면 추이와 해당 자료를 봅니다';
        row.addEventListener('click', () => onSelect(r.keyword));
      }
      row.append(el('td', 'kw', r.keyword), el('td', 'num', String(r.total)));
      sources.forEach(s => row.append(el('td', 'num', String((r.bySource || {})[s] || 0))));
      row.append(
        el('td', 'num', String(r.previous ?? '')),
        el('td', 'num', String(r.recent ?? '')),
        el('td', 'num', pct(r.growth))
      );
      const badge = el('span', 'badge trend-' + (r.trend || 'none').replace(/\s/g, ''), r.trend || '—');
      const td = el('td');
      td.append(badge);
      row.append(td);
      tbody.append(row);
    });
    table.append(tbody);
    return table;
  }

  // 판정 보류 키워드 · 불용어 · 동의어 사전(rules.js)을 보강할 후보
  function renderHeld(container, results) {
    clear(container);
    const held = results.filter(r => r.trend === HELD).sort(byTotal);
    container.append(el('p', 'held-count', `${held.length}개`));
    if (!held.length) {
      container.append(el('p', 'empty', '판정 보류 키워드가 없습니다.'));
      return;
    }
    const ul = el('ul', 'held-list');
    held.forEach(r => {
      const li = el('li');
      li.append(el('span', 'kw', r.keyword), el('span', 'num', `${r.total}건`));
      ul.append(li);
    });
    container.append(ul);
  }

  function csvCell(v) {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // 표에 보이는 키워드를 CSV로 · 연도별 개수 열 포함 · growth는 소수 그대로
  function toCSV(rows, sources, years) {
    const header = ['keyword', 'total'].concat(sources, years, ['previous', 'recent', 'growth', 'trend']);
    const lines = [header.map(csvCell).join(',')];
    rows.forEach(r => {
      lines.push([r.keyword, r.total]
        .concat(sources.map(s => (r.bySource || {})[s] || 0))
        .concat(years.map(y => (r.counts || {})[y] || 0))
        .concat([r.previous, r.recent, r.growth == null ? '' : r.growth, r.trend])
        .map(csvCell).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  function mdCell(v) {
    return String(v == null ? '' : v).replace(/\|/g, '\\|');
  }

  // 요약 + 판정별 표 · 판정 보류는 맨 끝에 키워드만
  function toMarkdown(results, summary, sources, labels) {
    labels = labels || periodLabels(summary);
    const out = ['# ' + ((window.RULES && window.RULES.title) || '키워드 동향'), ''];
    const parts = [`총 ${summary.total}건`].concat(Object.entries(summary.bySource || {}).map(([k, v]) => `${k} ${v}건`));
    out.push(`- ${parts.join(' · ')}`);
    if ((summary.skipped || []).length) out.push(`- 건너뛴 줄: ${summary.skipped.join(', ')}`);
    out.push('');

    trendsOf(results).filter(t => t !== HELD).forEach(t => {
      const rows = results.filter(r => r.trend === t).sort(byTotal);
      out.push(`## ${t} (${rows.length})`, '');
      const head = ['키워드', '합계'].concat(sources, labels);
      out.push('| ' + head.join(' | ') + ' |', '|' + head.map(() => '---').join('|') + '|');
      rows.forEach(r => {
        const cells = [r.keyword, r.total].concat(sources.map(s => (r.bySource || {})[s] || 0), [r.previous, r.recent, pct(r.growth)]);
        out.push('| ' + cells.map(mdCell).join(' | ') + ' |');
      });
      out.push('');
    });

    const held = results.filter(r => r.trend === HELD).sort(byTotal);
    if (held.length) {
      out.push(`## ${HELD} (${held.length})`, '', held.map(r => `${r.keyword}(${r.total})`).join(', '), '');
    }
    return out.join('\n');
  }

  // CSV는 엑셀에서 한글이 깨지지 않게 BOM을 붙임
  function download(filename, text, mime) {
    const bom = mime === 'text/csv' ? '﻿' : '';
    const blob = new Blob([bom + text], { type: mime + ';charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = filename;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }

  // 키워드가 붙은 자료 목록 · records는 import.js가 읽은 자료(cleanKeywords 포함)
  function renderRecords(container, records, keyword, opts) {
    opts = opts || {};
    clear(container);
    const key = (keyword || '').toLowerCase();
    const rows = records
      .filter(r => !key || (r.cleanKeywords || []).some(k => k.toLowerCase() === key))
      .sort((a, b) => b.year - a.year || a.line - b.line);
    container.append(el('p', 'list-count', keyword ? `'${keyword}' 자료 ${rows.length}건` : `전체 자료 ${rows.length}건`));
    const table = el('table', 'trend-table records');
    const tr = el('tr');
    ['연도', opts.groupLabel || '분야', '제목', '키워드'].forEach(h => tr.append(el('th', null, h)));
    const thead = el('thead');
    thead.append(tr);
    table.append(thead);
    const tbody = el('tbody');
    rows.forEach(r => {
      const row = el('tr');
      row.append(el('td', 'num', String(r.year)), el('td', null, r[opts.groupColumn] || ''));
      const titleTd = el('td', 'title');
      const url = r[opts.linkColumn];
      if (url && /^https?:\/\//.test(url)) {
        const a = el('a', null, r.title);
        a.href = url;
        a.target = '_blank';
        a.rel = 'noopener noreferrer';
        titleTd.append(a);
      } else titleTd.textContent = r.title;
      row.append(titleTd, el('td', 'kws', (r.cleanKeywords || []).join(' · ')));
      tbody.append(row);
    });
    table.append(tbody);
    const wrap = el('div', 'table-wrap');
    wrap.append(table);
    container.append(wrap);
  }

  // 두 그룹(예: 과제 · 논문)에서 비중 차이가 큰 키워드 · 그룹마다 자료 수가 달라 건수 대신 비중으로 비교
  // opts: { n, minCount, onSelect }
  function renderGap(container, results, summary, opts) {
    opts = opts || {};
    clear(container);
    const groups = Object.keys((summary && summary.bySource) || {});
    if (groups.length !== 2) {
      container.append(el('p', 'empty', '비교하려면 그룹이 두 개(예: 과제 · 논문)여야 합니다.'));
      return;
    }
    const [a, b] = groups;
    const n = opts.n || 8;
    const pool = results.filter(r => r.total >= (opts.minCount || 1))
      .map(r => ({ r, gap: (r.shareBySource[a] || 0) - (r.shareBySource[b] || 0) }));
    const pctOf = v => (Math.round(v * 1000) / 10).toFixed(1) + '%';
    const side = (title, rows) => {
      const box = el('div', 'gap-side');
      box.append(el('h3', null, title));
      if (!rows.length) { box.append(el('p', 'empty', '없음')); return box; }
      const ul = el('ul', 'gap-list');
      rows.forEach(({ r }) => {
        const li = el('li');
        if (opts.onSelect) { li.className = 'clickable'; li.addEventListener('click', () => opts.onSelect(r.keyword)); }
        li.append(el('span', 'kw', r.keyword),
          el('span', 'num', `${a} ${pctOf(r.shareBySource[a] || 0)} · ${b} ${pctOf(r.shareBySource[b] || 0)}`));
        ul.append(li);
      });
      box.append(ul);
      return box;
    };
    const wrap = el('div', 'gap-wrap');
    wrap.append(
      side(`${a}에서 더 많이`, pool.filter(x => x.gap > 0).sort((x, y) => y.gap - x.gap).slice(0, n)),
      side(`${b}에서 더 많이`, pool.filter(x => x.gap < 0).sort((x, y) => x.gap - y.gap).slice(0, n))
    );
    container.append(el('p', 'list-count', `${a} ${summary.bySource[a]}건 · ${b} ${summary.bySource[b]}건 중 그 키워드가 붙은 비율 · 합계 ${opts.minCount || 1}건 이상`), wrap);
  }

  window.List = { renderGap, renderTrendSection, renderHeld, renderRecords, toCSV, toMarkdown, pct, download };
})();
