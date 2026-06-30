const fs = require('fs');
const path = require('path');

const OUT_DIR = 'D:/coder/boys-game/src/data/v3/bank/math';
fs.mkdirSync(OUT_DIR, { recursive: true });

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

function writeLevel(level, subject, topic, difficulty, questions) {
  const filePath = path.join(OUT_DIR, `L${String(level).padStart(3, '0')}.json`);
  const data = { level, subject, topic, difficulty, questions };
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
  console.log(`Wrote ${filePath} with ${questions.length} questions`);
}

function choice(qid, question, options, answer, explanation) {
  return { id: qid, type: 'choice', question, options, answer, explanation };
}

function fillblank(qid, question, answer, explanation) {
  return { id: qid, type: 'fillblank', question, answer, explanation };
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function distractors(correct, n = 3, generator, avoid = []) {
  const set = new Set(avoid);
  set.add(correct);
  const outs = [];
  let attempts = 0;
  while (outs.length < n && attempts < 100) {
    attempts++;
    let val;
    if (!generator) {
      const delta = (Math.random() < 0.5 ? -1 : 1) * Math.floor(Math.random() * Math.max(1, Math.floor(Math.abs(correct) / 10) || 1));
      val = correct + delta;
    } else {
      val = generator();
    }
    if (!set.has(val) && val !== correct) {
      outs.push(val);
      set.add(val);
    }
  }
  while (outs.length < n) {
    const val = correct + outs.length + 1;
    if (!set.has(val)) outs.push(val);
  }
  return outs;
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function safeEval(expr) {
  const sanitized = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\[/g, '(').replace(/\]/g, ')');
  const allowed = /^[0-9+\-*/()\s]+$/;
  if (!allowed.test(sanitized)) throw new Error('Unsafe expression: ' + expr);
  return Function('"use strict"; return (' + sanitized + ')')();
}

function genLevel1() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 5; i++) {
    const n = randInt(1000, 9999);
    const read = numToChinese(n);
    const opts = shuffle([read, ...distractors(n, 3, () => numToChinese(randInt(1000, 9999)))]);
    const ans = opts.indexOf(read);
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `${n} 读作（ ）`, opts, ans, `${n} 从高位读起，读作：${read}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const n = randInt(1000, 9999);
    const thousands = Math.floor(n / 1000);
    const hundreds = Math.floor((n % 1000) / 100);
    const tens = Math.floor((n % 100) / 10);
    const ones = n % 10;
    const comp = `${thousands}个千、${hundreds}个百、${tens}个十和${ones}个一`;
    qs.push(fillblank(`m-L001-Q${String(qn).padStart(2, '0')}`, `${n} 是由（ ）组成的。`, comp, `${n} = ${thousands}×1000 + ${hundreds}×100 + ${tens}×10 + ${ones}。`));
    qn++;
  }

  const unitsText = [['一（个）', '十', 10], ['十', '百', 10], ['百', '千', 10], ['千', '万', 10]];
  for (const [a, b, r] of unitsText) {
    const opts = shuffle([String(r), '100', '1000', '10000']);
    const ans = opts.indexOf(String(r));
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `10 个 ${a} 是（ ）；相邻两个计数单位 ${a} 和 ${b} 之间的进率是（ ）。`, opts, ans, `每相邻两个计数单位之间的进率都是 10。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const n = randInt(1000, 9999);
    const read = numToChinese(n);
    qs.push(fillblank(`m-L001-Q${String(qn).padStart(2, '0')}`, `${read} 写作（ ）。`, String(n), `从高位写起，${read} 写作 ${n}。`));
    qn++;
  }

  const digitsPos = ['个位', '十位', '百位', '千位', '万位'];
  for (const pos of ['十位', '百位', '千位']) {
    const idx = digitsPos.indexOf(pos);
    const correct = String(10 ** idx);
    const opts = shuffle([correct, String(10 ** (idx + 1)), String(10 ** (idx - 1)), String(10 ** idx * 2)]);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `${pos} 上的计数单位是（ ）。`, opts, ans, `${pos} 的计数单位是 ${correct}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let a = randInt(1000, 9999);
    let b = randInt(1000, 9999);
    while (b === a) b = randInt(1000, 9999);
    const correct = a > b ? '>' : '<';
    const opts = shuffle(['>', '<', '=', '无法比较']);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `比较大小：${a} （ ） ${b}`, opts, ans, `${a} ${a > b ? '大于' : '小于'} ${b}，所以填 ${correct}。`));
    qn++;
  }

  for (let i = 0; i < 2; i++) {
    const n = randInt(1000, 9999);
    const roundTo = Math.round(n / 100) * 100;
    const opts = shuffle([String(roundTo), String(Math.round(n / 1000) * 1000), String(roundTo + 10), String(roundTo - 10)]);
    const ans = opts.indexOf(String(roundTo));
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `${n} 最接近的整百数是（ ）。`, opts, ans, `看十位，${n} 四舍五入到百位约是 ${roundTo}。`));
    qn++;
  }

  while (qn <= 30) {
    const n = randInt(1000, 9999);
    const read = numToChinese(n);
    const opts = shuffle([String(n), ...distractors(n, 3, () => randInt(1000, 9999)).map(String)]);
    const ans = opts.indexOf(String(n));
    qs.push(choice(`m-L001-Q${String(qn).padStart(2, '0')}`, `下面的数中，读作“${read}”的是（ ）。`, opts, ans, `${read} 写作 ${n}。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel2() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 8; i++) {
    const n = randInt(10000, 99999999);
    const read = numToChinese(n);
    const opts = shuffle([read, ...distractors(n, 3, () => numToChinese(randInt(10000, 99999999)))]);
    const ans = opts.indexOf(read);
    qs.push(choice(`m-L002-Q${String(qn).padStart(2, '0')}`, `${n} 读作（ ）`, opts, ans, `${n} 分级读：万级和个级，读作 ${read}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const n = randInt(10000, 99999999);
    const read = numToChinese(n);
    qs.push(fillblank(`m-L002-Q${String(qn).padStart(2, '0')}`, `${read} 写作（ ）。`, String(n), `${read} 写作 ${n}。`));
    qn++;
  }

  for (const [pos, unit] of [['万位', '10000'], ['十万位', '100000'], ['百万位', '1000000'], ['千万位', '10000000']]) {
    const opts = shuffle([unit, String(parseInt(unit) * 10), String(parseInt(unit) / 10), String(parseInt(unit) * 100)]);
    const ans = opts.indexOf(unit);
    qs.push(choice(`m-L002-Q${String(qn).padStart(2, '0')}`, `${pos} 的计数单位是（ ）。`, opts, ans, `${pos} 的计数单位是 ${unit}。`));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const opts = shuffle(['10', '100', '1000', '10000']);
    const ans = opts.indexOf('10');
    qs.push(choice(`m-L002-Q${String(qn).padStart(2, '0')}`, `在整数数位顺序表中，每相邻两个计数单位之间的进率都是（ ）。`, opts, ans, '十进制计数法中相邻计数单位进率是 10。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const n = randInt(100000, 99999999);
    const wan = Math.floor(n / 10000);
    const ge = n % 10000;
    const comp = `${wan}个万和${ge}个一`;
    qs.push(fillblank(`m-L002-Q${String(qn).padStart(2, '0')}`, `${n} 是由（ ）组成的。`, comp, `${n} = ${wan}×10000 + ${ge}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let a = randInt(100000, 99999999);
    let b = randInt(100000, 99999999);
    while (b === a) b = randInt(100000, 99999999);
    const correct = a > b ? '>' : '<';
    const opts = shuffle(['>', '<', '=', '无法确定']);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L002-Q${String(qn).padStart(2, '0')}`, `比较大小：${a} （ ） ${b}`, opts, ans, `${a} ${a > b ? '大于' : '小于'} ${b}，填 ${correct}。`));
    qn++;
  }

  while (qn <= 30) {
    const n = randInt(100000, 99999999);
    const opts = shuffle([String(n), ...distractors(n, 3, () => randInt(100000, 99999999)).map(String)]);
    const ans = opts.indexOf(String(n));
    const read = numToChinese(n);
    qs.push(choice(`m-L002-Q${String(qn).padStart(2, '0')}`, `读作“${read}”的数是（ ）。`, opts, ans, `${read} 写作 ${n}。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel3() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 8; i++) {
    let n = randInt(10000, 99999999);
    if (Math.floor(n / 1000) % 10 === 0 || Math.floor(n / 1000) % 10 === 5) n += 1000;
    const approx = (Math.floor(n / 10000) + (Math.floor(n / 1000) % 10 >= 5 ? 1 : 0)) * 10000;
    const opts = shuffle([`${approx / 10000}万`, `${approx / 10000 + 1}万`, `${approx / 10000 - 1}万`, `${approx}万`]);
    const ans = opts.indexOf(`${approx / 10000}万`);
    qs.push(choice(`m-L003-Q${String(qn).padStart(2, '0')}`, `把 ${n} 四舍五入到万位约是（ ）。`, opts, ans, `看千位，${Math.floor(n / 1000) % 10} ${Math.floor(n / 1000) % 10 >= 5 ? '≥5' : '<5'}，所以约是 ${approx / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(10000, 99999999);
    if (Math.floor(n / 1000) % 10 === 0 || Math.floor(n / 1000) % 10 === 5) n += 1000;
    const approx = (Math.floor(n / 10000) + (Math.floor(n / 1000) % 10 >= 5 ? 1 : 0)) * 10000;
    qs.push(fillblank(`m-L003-Q${String(qn).padStart(2, '0')}`, `${n} ≈ （ ）万（四舍五入到万位）。`, `${approx / 10000}万`, `千位是 ${Math.floor(n / 1000) % 10}，四舍五入后约为 ${approx / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const nums = Array.from({ length: 4 }, () => randInt(100000, 99999999));
    const correct = nums.slice().sort((a, b) => b - a).join('>');
    const opts = [correct];
    while (opts.length < 4) {
      const shuffled = shuffle(nums).join('>');
      if (!opts.includes(shuffled)) opts.push(shuffled);
    }
    const shuffledOpts = shuffle(opts);
    const ans = shuffledOpts.indexOf(correct);
    qs.push(choice(`m-L003-Q${String(qn).padStart(2, '0')}`, `把 ${nums.join('，')} 按从大到小的顺序排列是（ ）。`, shuffledOpts, ans, `比较最高位，从大到小排列为：${correct}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let a = randInt(100000, 99999999);
    let b = randInt(100000, 99999999);
    while (b === a) b = randInt(100000, 99999999);
    const correct = a > b ? '>' : '<';
    const opts = shuffle(['>', '<', '=', '无法比较']);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L003-Q${String(qn).padStart(2, '0')}`, `比较大小：${a} （ ） ${b}`, opts, ans, `${a} ${a > b ? '大于' : '小于'} ${b}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(10000, 99999999);
    if (Math.floor(n / 1000) % 10 === 0 || Math.floor(n / 1000) % 10 === 5) n += 1000;
    const approx = (Math.floor(n / 10000) + (Math.floor(n / 1000) % 10 >= 5 ? 1 : 0)) * 10000;
    qs.push(fillblank(`m-L003-Q${String(qn).padStart(2, '0')}`, `一个数四舍五入到万位后约是 ${approx / 10000} 万，这个数最大可能是（ ）。`, String(approx - 1), `四舍五入到万位约 ${approx / 10000} 万的最大数是 ${approx - 1}（千位为 4，其余各位为 9）。`));
    qn++;
  }

  while (qn <= 30) {
    let n = randInt(10000, 99999999);
    if (Math.floor(n / 1000) % 10 === 0 || Math.floor(n / 1000) % 10 === 5) n += 1000;
    const approx = (Math.floor(n / 10000) + (Math.floor(n / 1000) % 10 >= 5 ? 1 : 0)) * 10000;
    const opts = shuffle([`${approx / 10000}万`, `${approx / 10000 + 1}万`, `${approx / 10000 - 1}万`, `${approx}万`]);
    const ans = opts.indexOf(`${approx / 10000}万`);
    qs.push(choice(`m-L003-Q${String(qn).padStart(2, '0')}`, `${n} 四舍五入到万位约是（ ）。`, opts, ans, `千位是 ${Math.floor(n / 1000) % 10}，约为 ${approx / 10000} 万。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel4() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 8; i++) {
    let n = randInt(10000, 99990000);
    n = Math.floor(n / 10000) * 10000;
    const opts = shuffle([`${n / 10000}万`, `${n}万`, `${n / 10000}个万`, `${n / 1000}万`]);
    const ans = opts.indexOf(`${n / 10000}万`);
    qs.push(choice(`m-L004-Q${String(qn).padStart(2, '0')}`, `把 ${n} 改写成用“万”作单位的数是（ ）。`, opts, ans, `去掉末尾 4 个 0，${n} = ${n / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(10000, 99990000);
    n = Math.floor(n / 10000) * 10000;
    qs.push(fillblank(`m-L004-Q${String(qn).padStart(2, '0')}`, `${n} = （ ）万`, String(n / 10000), `${n} 末尾有 4 个 0，等于 ${n / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(100000000, 999900000000);
    n = Math.floor(n / 100000000) * 100000000;
    const opts = shuffle([`${n / 100000000}亿`, `${n}亿`, `${n / 100000000}个亿`, `${n / 10000000}亿`]);
    const ans = opts.indexOf(`${n / 100000000}亿`);
    qs.push(choice(`m-L004-Q${String(qn).padStart(2, '0')}`, `把 ${n} 改写成用“亿”作单位的数是（ ）。`, opts, ans, `去掉末尾 8 个 0，${n} = ${n / 100000000} 亿。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(100000000, 999900000000);
    n = Math.floor(n / 100000000) * 100000000;
    qs.push(fillblank(`m-L004-Q${String(qn).padStart(2, '0')}`, `${n} = （ ）亿`, String(n / 100000000), `${n} 末尾有 8 个 0，等于 ${n / 100000000} 亿。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const n = randInt(10000, 99999999);
    const opts = shuffle([`${Math.round(n / 10000)}万`, `${Math.floor(n / 10000)}万`, `${Math.round(n / 1000)}万`, `${Math.floor(n / 1000)}万`]);
    const ans = opts.indexOf(`${Math.floor(n / 10000)}万`);
    qs.push(choice(`m-L004-Q${String(qn).padStart(2, '0')}`, `某城市人口约 ${n} 人，也可写作约（ ）万人。`, opts, ans, `改写成用万作单位：${n} 人 = ${Math.floor(n / 10000)} 万人。`));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const a = randInt(1, 9999);
    const b = randInt(1, 9999);
    const correct = a > b ? '>' : '<';
    const opts = shuffle(['>', '<', '=', '无法比较']);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L004-Q${String(qn).padStart(2, '0')}`, `比较：${a}万 （ ） ${b}万`, opts, ans, `${a} ${a > b ? '大于' : '小于'} ${b}，所以 ${a}万 ${correct} ${b}万。`));
    qn++;
  }

  while (qn <= 30) {
    let n = randInt(10000, 99990000);
    n = Math.floor(n / 10000) * 10000;
    const opts = shuffle([`${n / 10000}万`, `${n}万`, `${n / 1000}万`, `${n / 100000}万`]);
    const ans = opts.indexOf(`${n / 10000}万`);
    qs.push(choice(`m-L004-Q${String(qn).padStart(2, '0')}`, `${n} = （ ）`, opts, ans, `${n} = ${n / 10000} 万。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel5() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 5; i++) {
    const n = randInt(10000, 99999999);
    const read = numToChinese(n);
    const opts = shuffle([read, ...distractors(n, 3, () => numToChinese(randInt(10000, 99999999)))]);
    const ans = opts.indexOf(read);
    qs.push(choice(`m-L005-Q${String(qn).padStart(2, '0')}`, `${n} 读作（ ）`, opts, ans, `${n} 读作 ${read}。`));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const n = randInt(100000, 99999999);
    const wan = Math.floor(n / 10000);
    const ge = n % 10000;
    qs.push(fillblank(`m-L005-Q${String(qn).padStart(2, '0')}`, `${n} 是由（ ）个万和（ ）个一组成的。`, `${wan}、${ge}`, `${n} = ${wan}×10000 + ${ge}。`));
    qn++;
  }

  for (let i = 0; i < 5; i++) {
    let n = randInt(10000, 99999999);
    if (Math.floor(n / 1000) % 10 === 0 || Math.floor(n / 1000) % 10 === 5) n += 1000;
    const approx = (Math.floor(n / 10000) + (Math.floor(n / 1000) % 10 >= 5 ? 1 : 0)) * 10000;
    const opts = shuffle([`${approx / 10000}万`, `${approx / 10000 + 1}万`, `${approx / 10000 - 1}万`, `${approx}万`]);
    const ans = opts.indexOf(`${approx / 10000}万`);
    qs.push(choice(`m-L005-Q${String(qn).padStart(2, '0')}`, `${n} 四舍五入到万位约是（ ）。`, opts, ans, `千位是 ${Math.floor(n / 1000) % 10}，约为 ${approx / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let n = randInt(10000, 99990000);
    n = Math.floor(n / 10000) * 10000;
    qs.push(fillblank(`m-L005-Q${String(qn).padStart(2, '0')}`, `把 ${n} 改写成用“万”作单位的数是（ ）。`, `${n / 10000}万`, `${n} = ${n / 10000} 万。`));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    let a = randInt(100000, 99999999);
    let b = randInt(100000, 99999999);
    while (b === a) b = randInt(100000, 99999999);
    const correct = a > b ? '>' : '<';
    const opts = shuffle(['>', '<', '=', '无法比较']);
    const ans = opts.indexOf(correct);
    qs.push(choice(`m-L005-Q${String(qn).padStart(2, '0')}`, `比较大小：${a} （ ） ${b}`, opts, ans, `${a} ${a > b ? '大于' : '小于'} ${b}。`));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const nums = Array.from({ length: 4 }, () => randInt(100000, 99999999));
    const correct = nums.slice().sort((a, b) => b - a).join('>');
    const opts = [correct];
    while (opts.length < 4) {
      const shuffled = shuffle(nums).join('>');
      if (!opts.includes(shuffled)) opts.push(shuffled);
    }
    const shuffledOpts = shuffle(opts);
    const ans = shuffledOpts.indexOf(correct);
    qs.push(choice(`m-L005-Q${String(qn).padStart(2, '0')}`, `把 ${nums.join('，')} 从大到小排列是（ ）。`, shuffledOpts, ans, `从大到小排列为 ${correct}。`));
    qn++;
  }

  for (let i = 0; i < 2; i++) {
    const approxWan = randInt(100, 9999);
    qs.push(fillblank(`m-L005-Q${String(qn).padStart(2, '0')}`, `一个数四舍五入到万位约是 ${approxWan} 万，这个数最小是（ ）。`, String((approxWan - 1) * 10000 + 5000), `最小是 ${(approxWan - 1) * 10000 + 5000}（千位为 5，其余为 0）。`));
    qn++;
  }

  while (qn <= 30) {
    const n = randInt(10000, 99999999);
    const read = numToChinese(n);
    const opts = shuffle([read, ...distractors(n, 3, () => numToChinese(randInt(10000, 99999999)))]);
    const ans = opts.indexOf(read);
    qs.push(choice(`m-L005-Q${String(qn).padStart(2, '0')}`, `${n} 读作（ ）`, opts, ans, `${n} 读作 ${read}。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel6() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    const c = a + b;
    const opts = shuffle([`${c} - ${b}`, `${c} + ${b}`, `${c} - ${a}`, `${b} - ${a}`]);
    const ans = opts.indexOf(`${c} - ${b}`);
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `如果 ${a} + ${b} = ${c}，那么 ${a} = （ ）。`, opts, ans, `加数 = 和 - 另一个加数，所以 ${a} = ${c} - ${b}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(2, 9);
    const c = a * b;
    const opts = shuffle([`${c} ÷ ${b}`, `${c} × ${b}`, `${c} ÷ ${a}`, `${b} × ${a}`]);
    const ans = opts.indexOf(`${c} ÷ ${b}`);
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `如果 ${a} × ${b} = ${c}，那么 ${a} = （ ）。`, opts, ans, `因数 = 积 ÷ 另一个因数，所以 ${a} = ${c} ÷ ${b}。`));
    qn++;
  }

  const templates = [
    ['{a} + {b} - {c}', '只有加减，从左往右算。'],
    ['{a} - {b} + {c}', '只有加减，从左往右算。'],
    ['{a} × {b} ÷ {c}', '只有乘除，从左往右算。'],
    ['{a} ÷ {b} × {c}', '只有乘除，从左往右算。'],
  ];
  for (let i = 0; i < 6; i++) {
    const [templ, hint] = templates[Math.floor(Math.random() * templates.length)];
    let a = randInt(10, 999);
    let b = randInt(1, 99);
    let c = randInt(1, 99);
    if (templ === '{a} × {b} ÷ {c}') {
      while ((a * b) % c !== 0) { a = randInt(10, 999); b = randInt(1, 99); c = randInt(1, 99); }
    } else if (templ === '{a} ÷ {b} × {c}') {
      while (a % b !== 0) { a = randInt(10, 999); b = randInt(1, 99); c = randInt(1, 99); }
    }
    const expr = templ.replace('{a}', a).replace('{b}', b).replace('{c}', c);
    const val = safeEval(expr);
    const opts = shuffle([String(val), ...distractors(val, 3, () => val + randInt(-5, 5)).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, hint));
    qn++;
  }

  for (let i = 0; i < 6; i++) {
    const a = randInt(1, 99);
    const b = randInt(2, 9);
    const c = randInt(10, 99);
    const d = randInt(1, 9);
    const expr = `${a} + ${b} × ${c} - ${d}`;
    const val = a + b * c - d;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a + b * (c - d)).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '先算乘法，再算加减。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(2, 9);
    const c = randInt(10, 99);
    const expr = `${a} + ${b} × ${c}`;
    const val = a + b * c;
    qs.push(fillblank(`m-L006-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, String(val), `先算乘法 ${b}×${c}=${b * c}，再算加法 ${a}+${b * c}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const price = randInt(5, 50);
    const qty = randInt(3, 20);
    const extra = randInt(5, 50);
    const total = price * qty + extra;
    const opts = shuffle([String(total), ...distractors(total, 3, () => total + randInt(-10, 10)).map(String)]);
    const ans = opts.indexOf(String(total));
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `每支钢笔 ${price} 元，小明买了 ${qty} 支，又买了一本 ${extra} 元的笔记本，一共花了（ ）元。`, opts, ans, `先算钢笔总价 ${price}×${qty}=${price * qty}，再加笔记本 ${extra} 元，共 ${total} 元。`));
    qn++;
  }

  while (qn <= 30) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    const c = randInt(10, 999);
    const expr = `${a} + ${b} - ${c}`;
    const val = a + b - c;
    const opts = shuffle([String(val), ...distractors(val, 3, () => val + randInt(-10, 10)).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L006-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '只有加减，从左往右算。'));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel7() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 10; i++) {
    const a = randInt(10, 99);
    const b = randInt(1, 99);
    const c = randInt(2, 9);
    const d = randInt(1, 9);
    const expr = `(${a} + ${b}) × ${c} - ${d}`;
    const val = (a + b) * c - d;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a + b * c - d).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L007-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '有括号先算括号里面的，再算括号外面的。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    let a = randInt(10, 99);
    let b = randInt(10, 99);
    let c = randInt(2, 9);
    while ((a + b) % c !== 0) { a = randInt(10, 99); b = randInt(10, 99); c = randInt(2, 9); }
    const expr = `(${a} + ${b}) ÷ ${c}`;
    const val = (a + b) / c;
    qs.push(fillblank(`m-L007-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, String(val), `先算括号里 ${a}+${b}=${a + b}，再算除法 ${a + b}÷${c}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const c = randInt(1, 9);
    const opts = shuffle(['相等', '不相等', '无法比较', '左边大']);
    const ans = opts.indexOf('相等');
    qs.push(choice(`m-L007-Q${String(qn).padStart(2, '0')}`, `比较：${a} - ${b} - ${c} 与 ${a} - (${b} + ${c})（ ）。`, opts, ans, '一个数连续减去两个数，等于减去这两个数的和。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const expr = `${a} + ${b} × ${c}`;
    const parenExpr = `(${a} + ${b}) × ${c}`;
    const opts = shuffle([parenExpr, expr, `${a} + (${b} × ${c})`, `(${a} + ${b} × ${c})`]);
    const ans = opts.indexOf(parenExpr);
    qs.push(choice(`m-L007-Q${String(qn).padStart(2, '0')}`, `要使算式先算加法，再算乘法，应给 ${expr} 加上括号变成（ ）。`, opts, ans, `给 ${a}+${b} 加上括号即可：(${a}+${b})×${c}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const total = randInt(100, 500);
    const used1 = randInt(20, 80);
    const used2 = randInt(20, 80);
    const remain = total - used1 - used2;
    const opts = shuffle([String(remain), ...distractors(remain, 3, () => total - Math.floor((used1 + used2) / 2)).map(String)]);
    const ans = opts.indexOf(String(remain));
    qs.push(choice(`m-L007-Q${String(qn).padStart(2, '0')}`, `学校买来 ${total} 本故事书，一年级领走 ${used1} 本，二年级领走 ${used2} 本，还剩（ ）本。`, opts, ans, `列式：${total} - ${used1} - ${used2} = ${remain}（本）。`));
    qn++;
  }

  while (qn <= 30) {
    const a = randInt(10, 99);
    const b = randInt(10, 99);
    const c = randInt(2, 9);
    const expr = `(${a} - ${b}) × ${c}`;
    const val = (a - b) * c;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a - b * c).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L007-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '先算小括号里的减法，再算乘法。'));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel8() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 10; i++) {
    let a = randInt(1, 50);
    let b = randInt(1, 50);
    let c = randInt(2, 9);
    let d = randInt(1, 9);
    while (((a + b) * c) % d !== 0) { a = randInt(1, 50); b = randInt(1, 50); c = randInt(2, 9); d = randInt(1, 9); }
    const expr = `[(${a} + ${b}) × ${c}] ÷ ${d}`;
    const val = ((a + b) * c) / d;
    const opts = shuffle([String(val), ...distractors(val, 3, () => Math.floor((a + b) * (c / d))).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L008-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '有中括号和小括号时，先算小括号里的，再算中括号里的，最后算括号外面的。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    const d = randInt(1, 9);
    const expr = `[${a} + ${b} × (${c} + ${d})]`;
    const val = a + b * (c + d);
    qs.push(fillblank(`m-L008-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, String(val), `先算小括号 ${c}+${d}=${c + d}，再算乘法 ${b}×${c + d}=${b * (c + d)}，最后算加法 ${a}+${b * (c + d)}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(1, 9);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    const d = randInt(1, 9);
    const expr = `${a} + ${b} × [${c} - (${d} + 1)]`;
    const opts = shuffle(['小括号→中括号→乘法→加法', '加法→小括号→中括号→乘法', '乘法→小括号→中括号→加法', '小括号→加法→中括号→乘法']);
    const ans = opts.indexOf('小括号→中括号→乘法→加法');
    qs.push(choice(`m-L008-Q${String(qn).padStart(2, '0')}`, `算式 ${expr} 的运算顺序是（ ）。`, opts, ans, '有中括号和小括号时，先小括号，再中括号，然后乘除，最后加减。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(1, 9);
    const c = randInt(1, 9);
    const expr = `${a} + ${b} × (${c} + 2)`;
    const correct = a + b * (c + 2);
    const opts = shuffle([`先算 ${c}+2，再算 ${b}×(${c + 2})，最后加 ${a}`, `先算 ${a}+${b}`, `先算 ${b}×${c}`, '从左往右依次算']);
    const ans = opts.indexOf(`先算 ${c}+2，再算 ${b}×(${c + 2})，最后加 ${a}`);
    qs.push(choice(`m-L008-Q${String(qn).padStart(2, '0')}`, `下面哪个是正确的运算顺序？${expr}`, opts, ans, `有小括号先算小括号里的 ${c}+2，再算乘法，最后算加法，结果是 ${correct}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const pagesPerDay = randInt(15, 35);
    const days1 = randInt(3, 7);
    const days2 = randInt(3, 7);
    const total = pagesPerDay * (days1 + days2);
    const opts = shuffle([String(total), ...distractors(total, 3, () => pagesPerDay * days1 + days2).map(String)]);
    const ans = opts.indexOf(String(total));
    qs.push(choice(`m-L008-Q${String(qn).padStart(2, '0')}`, `小红每天看 ${pagesPerDay} 页书，前 ${days1} 天和后 ${days2} 天一共看了（ ）页。`, opts, ans, `列式：${pagesPerDay}×(${days1}+${days2}) = ${total}（页）。`));
    qn++;
  }

  while (qn <= 30) {
    let a = randInt(1, 50);
    let b = randInt(1, 50);
    let c = randInt(2, 9);
    let d = randInt(1, 9);
    while ((a * (b + c)) % d !== 0) { a = randInt(1, 50); b = randInt(1, 50); c = randInt(2, 9); d = randInt(1, 9); }
    const expr = `[${a} × (${b} + ${c})] ÷ ${d}`;
    const val = (a * (b + c)) / d;
    const opts = shuffle([String(val), ...distractors(val, 3, () => Math.floor(a * b + c / d)).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L008-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '先算小括号，再算中括号，最后算括号外的除法。'));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel9() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 3; i++) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    const opts = shuffle([`${a} + ${b} = ${b} + ${a}`, `${a} + ${b} = ${a} - ${b}`, `${a} + ${b} = ${b} - ${a}`, `${a} + ${b} = ${a} × ${b}`]);
    const ans = opts.indexOf(`${a} + ${b} = ${b} + ${a}`);
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `下面哪个式子运用了加法交换律？`, opts, ans, '加法交换律：两个加数交换位置，和不变。'));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    const c = randInt(10, 999);
    const opts = shuffle([`${a} + ${b} + ${c} = ${a} + (${b} + ${c})`, `${a} + ${b} + ${c} = ${a} × (${b} + ${c})`, `${a} + ${b} + ${c} = ${b} + (${a} - ${c})`, `${a} + ${b} + ${c} = ${c} + ${a} + ${b}`]);
    const ans = opts.indexOf(`${a} + ${b} + ${c} = ${a} + (${b} + ${c})`);
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `下面哪个式子运用了加法结合律？`, opts, ans, '加法结合律：先把前两个数相加，或先把后两个数相加，和不变。'));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const a = randInt(2, 99);
    const b = randInt(2, 99);
    const opts = shuffle([`${a} × ${b} = ${b} × ${a}`, `${a} × ${b} = ${a} + ${b}`, `${a} × ${b} = ${a} ÷ ${b}`, `${a} × ${b} = ${b} ÷ ${a}`]);
    const ans = opts.indexOf(`${a} × ${b} = ${b} × ${a}`);
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `下面哪个式子运用了乘法交换律？`, opts, ans, '乘法交换律：两个因数交换位置，积不变。'));
    qn++;
  }

  for (let i = 0; i < 3; i++) {
    const a = randInt(2, 99);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const opts = shuffle([`${a} × ${b} × ${c} = ${a} × (${b} × ${c})`, `${a} × ${b} × ${c} = (${a} + ${b}) × ${c}`, `${a} × ${b} × ${c} = ${a} + ${b} × ${c}`, `${a} × ${b} × ${c} = ${b} × (${a} + ${c})`]);
    const ans = opts.indexOf(`${a} × ${b} × ${c} = ${a} × (${b} × ${c})`);
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `下面哪个式子运用了乘法结合律？`, opts, ans, '乘法结合律：先把前两个数相乘，或先把后两个数相乘，积不变。'));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(1, 99);
    const comp = 100 - a;
    const b = randInt(100, 999);
    const expr = `${a} + ${b} + ${comp}`;
    const val = a + b + comp;
    const opts = shuffle([String(val), ...distractors(val, 3, () => (a + b) + comp + 1).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `简便计算：${expr} = （ ）。`, opts, ans, `利用加法结合律：${a}+${comp}=100，再加 ${b} 得 ${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(2, 9);
    const b = randInt(2, 9);
    const c = randInt(10, 99);
    const expr = `${a} × ${b} × ${c}`;
    const val = a * b * c;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a * (b + c)).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `简便计算：${expr} = （ ）。`, opts, ans, `先算 ${a}×${b}=${a * b}，再算 ${a * b}×${c}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    qs.push(fillblank(`m-L009-Q${String(qn).padStart(2, '0')}`, `根据加法交换律，${a} + ${b} = （ ） + ${a}。`, String(b), `加法交换律：${a}+${b}=${b}+${a}。`));
    qn++;
  }

  while (qn <= 30) {
    const a = randInt(10, 999);
    const b = randInt(10, 999);
    const c = randInt(10, 999);
    const expr = `${a} + ${b} + ${c}`;
    const val = a + b + c;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a + (b + c) + 1).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L009-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, '按从左往右顺序计算，也可利用加法结合律凑整。'));
    qn++;
  }

  return qs.slice(0, 30);
}

function genLevel10() {
  const qs = [];
  let qn = 1;

  for (let i = 0; i < 4; i++) {
    const a = randInt(2, 99);
    const b = randInt(2, 99);
    const c = randInt(2, 9);
    const opts = shuffle([
      `${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`,
      `${a} × (${b} + ${c}) = ${a} + ${b} × ${c}`,
      `${a} × (${b} + ${c}) = ${a} × ${b} + ${c}`,
      `${a} × (${b} + ${c}) = ${a} + ${b} + ${c}`
    ]);
    const ans = opts.indexOf(`${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`);
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `下面哪个式子运用了乘法分配律？`, opts, ans, '乘法分配律：a×(b+c)=a×b+a×c。'));
    qn++;
  }

  for (let i = 0; i < 6; i++) {
    const a = randInt(2, 99);
    const b = randInt(10, 99);
    const c = randInt(1, 9);
    const expr = `${a} × (${b} + ${c})`;
    const val = a * (b + c);
    const opts = shuffle([String(val), ...distractors(val, 3, () => a * b + c).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, `利用乘法分配律：${a}×${b}+${a}×${c}=${a * b}+${a * c}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(2, 99);
    const b = randInt(2, 99);
    const c = randInt(2, 9);
    const expr = `${a} × ${c} + ${b} × ${c}`;
    const val = (a + b) * c;
    const opts = shuffle([String(val), ...distractors(val, 3, () => (a + b) + c).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `简便计算：${expr} = （ ）。`, opts, ans, `逆用乘法分配律：(${a}+${b})×${c}=${a + b}×${c}=${val}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(2, 99);
    const b = randInt(10, 99);
    const c = randInt(1, 9);
    qs.push(fillblank(`m-L010-Q${String(qn).padStart(2, '0')}`, `${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × （ ）。`, String(c), `乘法分配律：${a}×(${b}+${c})=${a}×${b}+${a}×${c}。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const price1 = randInt(20, 80);
    const price2 = randInt(10, 60);
    const qty = randInt(3, 12);
    const total = (price1 + price2) * qty;
    const opts = shuffle([String(total), ...distractors(total, 3, () => price1 * qty + price2).map(String)]);
    const ans = opts.indexOf(String(total));
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `一个书包 ${price1} 元，一个文具盒 ${price2} 元，买 ${qty} 套这样的书包和文具盒一共要（ ）元。`, opts, ans, `可先算一套价格 ${price1}+${price2}=${price1 + price2} 元，再乘 ${qty} 套，共 ${total} 元。`));
    qn++;
  }

  for (let i = 0; i < 4; i++) {
    const a = randInt(10, 99);
    const b = randInt(2, 9);
    const c = randInt(10, 99);
    const expr = `${a} × ${b} + ${c} × ${b}`;
    const val = (a + c) * b;
    const opts = shuffle([String(val), ...distractors(val, 3, () => a * b + c).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `简便计算：${expr} = （ ）。`, opts, ans, `逆用乘法分配律：(${a}+${c})×${b}=${a + c}×${b}=${val}。`));
    qn++;
  }

  while (qn <= 30) {
    const a = randInt(2, 99);
    const b = randInt(10, 99);
    const c = randInt(1, 9);
    const expr = `${a} × (${b} - ${c})`;
    const val = a * (b - c);
    const opts = shuffle([String(val), ...distractors(val, 3, () => a * b - c).map(String)]);
    const ans = opts.indexOf(String(val));
    qs.push(choice(`m-L010-Q${String(qn).padStart(2, '0')}`, `计算：${expr} = （ ）。`, opts, ans, `利用乘法分配律：${a}×${b}-${a}×${c}=${a * b}-${a * c}=${val}。`));
    qn++;
  }

  return qs.slice(0, 30);
}

function main() {
  const levelsConfig = [
    [1, '大数的认识（一）', genLevel1],
    [2, '大数的认识（二）', genLevel2],
    [3, '大数的认识（三）', genLevel3],
    [4, '大数的认识（四）', genLevel4],
    [5, '大数的认识（五）', genLevel5],
    [6, '四则运算（一）', genLevel6],
    [7, '四则运算（二）', genLevel7],
    [8, '四则运算（三）', genLevel8],
    [9, '四则运算（四）', genLevel9],
    [10, '四则运算（五）', genLevel10],
  ];

  for (const [level, topic, genFn] of levelsConfig) {
    const questions = genFn();
    const choiceCount = questions.filter(q => q.type === 'choice').length;
    const fillCount = questions.filter(q => q.type === 'fillblank').length;
    if (questions.length !== 30) throw new Error(`Level ${level} has ${questions.length} questions`);
    if (choiceCount < 18) throw new Error(`Level ${level} only ${choiceCount} choices`);
    if (fillCount > 12) throw new Error(`Level ${level} has ${fillCount} fillblanks`);
    writeLevel(level, 'math', topic, 1, questions);
  }

  console.log('All levels generated successfully.');
}

main();
