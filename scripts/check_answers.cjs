const fs = require('fs');
const path = require('path');

const DIR = 'D:/coder/boys-game/src/data/v3/bank/math';

function safeEval(expr) {
  const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\[/g, '(').replace(/\]/g, ')');
  if (!/^[0-9+\-*/()\s]+$/.test(sanitized)) return null;
  try {
    return Function('"use strict"; return (' + sanitized + ')')();
  } catch {
    return null;
  }
}

function extractExpr(question) {
  const m = question.match(/计算[:：]\s*([^=（）]+?)\s*[=（]/);
  return m ? m[1].trim() : null;
}

let errors = [];

for (let level = 6; level <= 10; level++) {
  const file = path.join(DIR, `L${String(level).padStart(3, '0')}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
  for (const q of data.questions) {
    if (!q.question.includes('计算')) continue;
    const expr = extractExpr(q.question);
    if (!expr) continue;
    const val = safeEval(expr);
    if (val === null) continue;
    const expected = String(Math.round(val));
    let actual;
    if (q.type === 'choice') {
      actual = q.options[q.answer];
    } else {
      actual = q.answer;
    }
    if (actual !== expected) {
      errors.push(`L${String(level).padStart(3, '0')} ${q.id}: ${expr} = ${expected}, but answer is ${actual}`);
    }
  }
}

if (errors.length) {
  console.log('Errors found:');
  for (const e of errors) console.log(e);
  process.exit(1);
} else {
  console.log('All arithmetic answers in levels 6-10 verified correct.');
}
