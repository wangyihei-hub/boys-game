/**
 * V3 - 提取所有 topic 与 Boss 信息为统一的输入 JSON
 * 输入: outputs/chinese_100_levels.md / math_100_levels.md / english_100_levels.md
 *       outputs/chinese_boss_l*.json (语文 Boss 阅读 100 篇)
 * 输出: outputs/v3/inputs/{subject}_outline.json (topic + difficulty)
 *       outputs/v3/inputs/chinese_bosses.json (Boss 阅读，5 题/关)
 *       outputs/v3/inputs/math_bosses.json (从 math_100_levels.md 抽取大题)
 */
const fs = require('fs');
const path = require('path');

const OUT = 'C:\\Users\\40618\\.qoderwork\\workspace\\mqv3mkb2ar6ybkr0\\outputs';
const V3IN = path.join(OUT, 'v3', 'inputs');
fs.mkdirSync(V3IN, { recursive: true });

function diffOfLevel(n) {
  if (n <= 33) return 1;
  if (n <= 66) return 2;
  return 3;
}

// === 1. Chinese outline + bosses ===
function parseChineseOutline() {
  const md = fs.readFileSync(path.join(OUT, 'chinese_100_levels.md'), 'utf8');
  const out = [];
  // 总表行: | L001 | 4 | 多音字辨析 | 基础 | ...
  const re = /^\|\s*L(\d{3})\s*\|\s*([45])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let m;
  while ((m = re.exec(md))) {
    const level = parseInt(m[1], 10);
    const grade = parseInt(m[2], 10);
    const topic = m[3].trim();
    out.push({ level, grade, topic, difficulty: diffOfLevel(level) });
  }
  return out;
}

function loadChineseBosses() {
  // 5 个分文件，结构: { levels: [ {level, topic, title, passage, questions:[{q,options,answer}]} ] }
  const files = ['chinese_boss_l001_l020.json','chinese_boss_l021_l040.json','chinese_boss_l041_l060.json','chinese_boss_l061_l080.json','chinese_boss_l081_l100.json'];
  const bosses = {};
  for (const f of files) {
    const data = JSON.parse(fs.readFileSync(path.join(OUT, f), 'utf8'));
    const arr = data.levels || [];
    for (const lv of arr) {
      const key = 'L' + String(lv.level).padStart(3, '0');
      bosses[key] = lv;
    }
  }
  return bosses;
}

const chineseOutline = parseChineseOutline();
const chineseBosses = loadChineseBosses();
console.log(`chinese: outline=${chineseOutline.length}, bosses=${Object.keys(chineseBosses).length}`);
fs.writeFileSync(path.join(V3IN, 'chinese_outline.json'), JSON.stringify(chineseOutline, null, 2));
fs.writeFileSync(path.join(V3IN, 'chinese_bosses.json'), JSON.stringify(chineseBosses, null, 2));

// === 2. Math outline + bosses ===
function parseMathOutline() {
  const md = fs.readFileSync(path.join(OUT, 'math_100_levels.md'), 'utf8');
  const out = [];
  const re = /^\|\s*L(\d{3})\s*\|\s*([45])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let m;
  while ((m = re.exec(md))) {
    const level = parseInt(m[1], 10);
    const grade = parseInt(m[2], 10);
    const topic = m[3].trim();
    out.push({ level, grade, topic, difficulty: diffOfLevel(level) });
  }
  return out;
}

function extractMathBosses() {
  // 从 math_100_levels.md 提取每关 Boss 大题:
  // 块格式:
  // ## L001 · 主题
  // ### Boss关
  // **大题**：....
  // 1. ...（答案：X）
  // 2. ...（答案：Y）
  // 3. ...（答案：Z）
  const md = fs.readFileSync(path.join(OUT, 'math_100_levels.md'), 'utf8');
  const blocks = md.split(/\n(?=## L\d{3})/g);
  const bosses = {};
  for (const blk of blocks) {
    const mLv = blk.match(/^## L(\d{3})/);
    if (!mLv) continue;
    const key = 'L' + mLv[1];
    const bIdx = blk.indexOf('### Boss关');
    if (bIdx < 0) continue;
    const bossSec = blk.slice(bIdx);
    const mPrompt = bossSec.match(/\*\*大题\*\*：([^\n]+)/);
    const prompt = mPrompt ? mPrompt[1].trim() : '';
    const parts = [];
    const re = /^(\d+)\.\s+([^\n]*?)（答案：([^）]+)）/gm;
    let m;
    while ((m = re.exec(bossSec))) {
      parts.push({ num: parseInt(m[1], 10), question: m[2].trim(), answer: m[3].trim() });
    }
    bosses[key] = { prompt, parts };
  }
  return bosses;
}

const mathOutline = parseMathOutline();
const mathBosses = extractMathBosses();
console.log(`math: outline=${mathOutline.length}, bosses=${Object.keys(mathBosses).length}`);
fs.writeFileSync(path.join(V3IN, 'math_outline.json'), JSON.stringify(mathOutline, null, 2));
fs.writeFileSync(path.join(V3IN, 'math_bosses.json'), JSON.stringify(mathBosses, null, 2));

// === 3. English outline (no boss yet; we will generate fresh) ===
function parseEnglishOutline() {
  const md = fs.readFileSync(path.join(OUT, 'english_100_levels.md'), 'utf8');
  const out = [];
  const re = /^\|\s*L(\d{3})\s*\|\s*([45])\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|/gm;
  let m;
  while ((m = re.exec(md))) {
    const level = parseInt(m[1], 10);
    const grade = parseInt(m[2], 10);
    const topic = m[3].trim();
    out.push({ level, grade, topic, difficulty: diffOfLevel(level) });
  }
  return out;
}

const englishOutline = parseEnglishOutline();
console.log(`english: outline=${englishOutline.length}`);
fs.writeFileSync(path.join(V3IN, 'english_outline.json'), JSON.stringify(englishOutline, null, 2));

console.log('\nDone. Inputs ready at', V3IN);
