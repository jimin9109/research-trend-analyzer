// js/import.js — CSV 읽기 · 점검 · 정리된 자료 내보내기
// 읽은 자료: { records: [{ line, year, title, ...원래 열 }], skipped: [{ line, reason }], columns }
// 기준(필수 열 이름)은 rules.js에서 읽음
(function () {
  // RFC 4180 CSV: 따옴표 안의 쉼표 · 줄바꿈 · "" 처리 · 각 행이 시작한 줄 번호를 함께 돌려줌
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', quoted = false, line = 1, rowLine = 1;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (quoted) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') quoted = false;
        else { if (c === '\n') line++; field += c; }
      } else if (c === '"') quoted = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field);
        rows.push({ line: rowLine, cells: row });
        row = []; field = ''; line++; rowLine = line;
      } else field += c;
    }
    if (field !== '' || row.length) {
      row.push(field);
      rows.push({ line: rowLine, cells: row });
    }
    return rows;
  }

  function read(text, rules) {
    const required = rules.columns.required;
    // 엑셀 "CSV UTF-8"이 붙이는 BOM 지우기
    const rows = parseCSV(String(text || '').replace(/^﻿/, ''));
    const headerRow = rows.find(r => r.cells.some(c => c.trim() !== ''));
    if (!headerRow) return { records: [], skipped: [], columns: [], error: '입력이 비어 있습니다.' };

    const columns = headerRow.cells.map(h => h.trim().toLowerCase());
    const missing = required.filter(c => !columns.includes(c));
    if (missing.length) {
      return { records: [], skipped: [], columns, error: `첫 줄에 ${missing.join(', ')} 열이 없습니다. 첫 줄 예: ${required.join(',')}` };
    }

    const records = [], skipped = [];
    rows.filter(r => r.line > headerRow.line).forEach(r => {
      if (r.cells.every(c => c.trim() === '')) {
        skipped.push({ line: r.line, reason: '빈 줄' });
        return;
      }
      const rec = { line: r.line };
      columns.forEach((c, i) => { rec[c] = (r.cells[i] || '').trim(); });
      const year = rec.year.match(/^\d{4}$/) ? Number(rec.year) : NaN;
      if (!Number.isFinite(year)) {
        skipped.push({ line: r.line, reason: rec.year ? `연도 형식 오류("${rec.year}")` : '연도 없음' });
        return;
      }
      if (!rec.title) {
        skipped.push({ line: r.line, reason: '제목 없음' });
        return;
      }
      rec.year = year;
      records.push(rec);
    });
    return { records, skipped, columns };
  }

  function cell(v) {
    const s = v == null ? '' : String(v);
    return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
  }

  // 정리된 자료를 원래 열 순서 그대로 CSV로 · 키워드는 정리된 값(동의어 통일 · 불용어 제외)으로 바꿔 씀
  // 이 파일을 다시 넣어도 같은 결과가 나와야 함 (기획안 왕복 기준)
  function toCSV(records, columns, keywordColumn) {
    const cols = columns.includes(keywordColumn) ? columns : columns.concat(keywordColumn);
    const lines = [cols.map(cell).join(',')];
    records.forEach(r => {
      lines.push(cols.map(c => c === keywordColumn ? (r.cleanKeywords || []).join(';') : r[c]).map(cell).join(','));
    });
    return lines.join('\r\n') + '\r\n';
  }

  window.Importer = { parseCSV, read, toCSV };
})();
