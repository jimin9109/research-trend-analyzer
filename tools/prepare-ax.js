// tools/prepare-ax.js — NTIS 과제 · KCI 논문 내려받은 파일을 도구 입력 CSV 하나로 합침
//
// 쓰는 법
//   1. NTIS · KCI에서 내려받은 .xls를 엑셀에서 "CSV UTF-8"로 저장 (NTIS는 첫 시트 '검색결과')
//   2. node tools/prepare-ax.js <NTIS.csv> <KCI.csv> data/ax-ntis-kci.csv
//
// 개인정보 · 기관 식별 열(연구책임자명 · 사업자등록번호 · 저자명 · 소속기관 등)은 옮기지 않음
// 거르기(AI 전환 자료만 남기기)는 여기서 하지 않고 rules.js의 filter로 도구 안에서 함 → 뺀 이유가 화면에 보임
const fs = require('fs');

function parse(t) {
  t = t.replace(/^﻿/, '');
  const out = []; let row = [], f = '', q = false;
  for (let i = 0; i < t.length; i++) {
    const c = t[i];
    if (q) { if (c === '"' && t[i + 1] === '"') { f += '"'; i++; } else if (c === '"') q = false; else f += c; }
    else if (c === '"') q = true;
    else if (c === ',') { row.push(f); f = ''; }
    else if (c === '\n' || c === '\r') { if (c === '\r' && t[i + 1] === '\n') i++; row.push(f); out.push(row); row = []; f = ''; }
    else f += c;
  }
  if (f || row.length) { row.push(f); out.push(row); }
  return out.filter(r => r.some(c => c.trim()));
}

// 머리줄을 찾아 객체로 · NTIS는 첫 줄이 '검색결과' 제목줄
function table(rows, mustHave) {
  const h = rows.findIndex(r => r.map(s => s.trim()).includes(mustHave));
  if (h < 0) throw new Error(`머리줄에서 '${mustHave}' 열을 찾지 못했습니다`);
  const head = rows[h].map(s => s.trim());
  return rows.slice(h + 1).map(r => Object.fromEntries(head.map((k, i) => [k, (r[i] || '').trim()])));
}

const flat = s => (s || '').replace(/\s+/g, ' ').trim();
const won = s => (s || '').replace(/[^0-9]/g, '');

const [ntisPath, kciPath, outPath] = process.argv.slice(2);
if (!outPath) {
  console.error('node tools/prepare-ax.js <NTIS.csv> <KCI.csv> <출력.csv>');
  process.exit(1);
}

const ntis = table(parse(fs.readFileSync(ntisPath, 'utf8')), '과제명(국문)').map(r => ({
  id: 'N' + r['과제고유번호'] + '-' + r['기준년도'],
  source: '과제',
  year: r['기준년도'],
  title: flat(r['과제명(국문)']),
  title_en: flat(r['과제명(영문)']),
  keywords: flat(r['한글키워드']),
  keywords_en: flat(r['영문키워드']),
  program: flat(r['사업명'] + ' / ' + r['내역사업명']),
  category: flat(r['부처명']),
  summary: flat([r['연구목표요약'], r['연구내용요약'], r['기대효과요약']].join(' ')),
  funding: won(r['정부투자연구비'])
}));

const kci = table(parse(fs.readFileSync(kciPath, 'utf8')), '논문명').map((r, i) => ({
  id: 'K' + String(i + 1).padStart(4, '0'),
  source: '논문',
  year: r['발행연도'],
  title: flat(r['논문명']),
  title_en: '',
  keywords: flat(r['저자키워드']),
  keywords_en: '',
  program: flat(r['학술지명']),
  category: flat(r['주제분야']),
  summary: flat(r['초록']),
  funding: ''
}));

const cols = ['id', 'source', 'year', 'title', 'title_en', 'keywords', 'keywords_en', 'program', 'category', 'summary', 'funding'];
const cell = v => { const s = String(v == null ? '' : v); return /[",\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
const lines = [cols.join(',')].concat(ntis.concat(kci).map(r => cols.map(c => cell(r[c])).join(',')));
fs.writeFileSync(outPath, '﻿' + lines.join('\r\n') + '\r\n', 'utf8');
console.log(`과제 ${ntis.length} · 논문 ${kci.length} → ${outPath}`);
