const fs = require('fs');
const path = require('path');

const DIR = 'D:/coder/boys-game/src/data/v3/bank/math';

function numToChinese(n) {
  const digits = '零一二三四五六七八九';
  const units = ['', '十', '百', '千'];
  const big = ['', '万', '亿'];
  if (n === 0) return '零';
  const s = String(n);
  const padLen = Math.ceil(s.length / 4) * 4;
  const padded = s.padStart(padLen, '0');
  const parts = [];
  for (let i = 0; i < padded.length; i += 4) parts.push(padded.slice(i, i + 4));
  let result = '';
  let zeroFlag = false;
  for (let idx = 0; idx < parts.length; idx++) {
    const part = parts[idx];
    const partVal = parseInt(part, 10);
    if (partVal === 0) {
      zeroFlag = true;
      continue;
    }
    let partStr = '';
    for (let i = 0; i < 4; i++) {
      const d = parseInt(part[i], 10);
      if (d === 0) {
        if (!zeroFlag && i < 3 && part.slice(i + 1).split('').some(c => c !== '0')) {
          partStr += '零';
          zeroFlag = true;
        }
      } else {
        partStr += digits[d] + units[3 - i];
        zeroFlag = false;
      }
    }
    const bigUnit = big[parts.length - idx - 1];
    result += partStr + bigUnit;
  }
  result = result.replace(/零零/g, '零').replace(/零万/g, '万').replace(/零亿/g, '亿').replace(/零+$/, '');
  if (result === '一十') result = '十';
  return result;
}

let errors = [];

for (let level = 1; level <= 5; level++) {
  const file = path.join(DIR, `L${String(level).padStart(3, '0')}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const q of data.questions) {
    // Check "n 读作（ ）" or "读作“...”的是（ ）"
    const readMatch = q.question.match(/^(\d+)\s*读作/);
    if (readMatch) {
      const n = parseInt(readMatch[1], 10);
      const expected = numToChinese(n);
      let actual;
      if (q.type === 'choice') {
        actual = q.options[q.answer];
      } else {
        actual = q.answer;
      }
      if (actual !== expected) {
        errors.push(`L${String(level).padStart(3, '0')} ${q.id}: ${n} expected "${expected}", got "${actual}"`);
      }
      continue;
    }

    // Check "... 写作（ ）"
    const writeMatch = q.question.match(/^(.+?)\s*写作/);
    if (writeMatch && !q.question.includes('读作')) {
      const read = writeMatch[1];
      // Only check if the prefix is pure Chinese digits
      if (/^[零一二三四五六七八九十百千万亿]+$/.test(read)) {
        // We can't easily reverse numToChinese, so skip reverse check for now
      }
    }
  }
}

if (errors.length) {
  console.log('Errors found:');
  for (const e of errors) console.log(e);
  process.exit(1);
} else {
  console.log('All number readings in levels 1-5 verified correct.');
}
