const fs = require('fs');
const path = require('path');

const DIR = 'D:/coder/boys-game/src/data/v3/bank/math';

let allOk = true;
const summary = [];

for (let level = 1; level <= 10; level++) {
  const file = path.join(DIR, `L${String(level).padStart(3, '0')}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  const qs = data.questions;

  const issues = [];
  if (qs.length !== 30) issues.push(`questions length ${qs.length}`);
  if (data.level !== level) issues.push(`level mismatch ${data.level}`);
  if (data.subject !== 'math') issues.push(`subject ${data.subject}`);
  if (data.difficulty !== 1) issues.push(`difficulty ${data.difficulty}`);

  const choiceCount = qs.filter(q => q.type === 'choice').length;
  const fillCount = qs.filter(q => q.type === 'fillblank').length;
  if (choiceCount < 18) issues.push(`only ${choiceCount} choices`);
  if (fillCount > 12) issues.push(`${fillCount} fillblanks > 12`);

  const ids = new Set();
  for (const q of qs) {
    if (!q.id || !q.type || !q.question || q.answer === undefined || !q.explanation) {
      issues.push(`missing fields in ${q.id || '?'}`);
    }
    if (ids.has(q.id)) issues.push(`duplicate id ${q.id}`);
    ids.add(q.id);
    if (q.type === 'choice') {
      if (!Array.isArray(q.options) || q.options.length !== 4) issues.push(`${q.id} bad options`);
      if (q.answer < 0 || q.answer > 3) issues.push(`${q.id} bad answer index ${q.answer}`);
    } else if (q.type === 'fillblank') {
      if (typeof q.answer !== 'string') issues.push(`${q.id} fillblank answer not string`);
    } else {
      issues.push(`${q.id} unknown type ${q.type}`);
    }
  }

  if (issues.length) {
    console.log(`L${String(level).padStart(3, '0')} FAIL: ${issues.join('; ')}`);
    allOk = false;
  } else {
    console.log(`L${String(level).padStart(3, '0')} OK: ${qs.length} questions (${choiceCount} choice, ${fillCount} fillblank)`);
  }
  summary.push({ level, count: qs.length, choiceCount, fillCount, ok: issues.length === 0 });
}

console.log('\nSummary:');
for (const s of summary) {
  console.log(`L${String(s.level).padStart(3, '0')}: ${s.count}题 选择${s.choiceCount} 填空${s.fillCount} ${s.ok ? 'OK' : 'FAIL'}`);
}

if (!allOk) process.exit(1);
console.log('\nAll files verified successfully.');
