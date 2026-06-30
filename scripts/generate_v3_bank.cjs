const fs = require('fs');
const path = require('path');

const ROOT = 'D:/coder/boys-game';
const BANK_DIR = path.join(ROOT, 'src/data/v3/bank');
const INPUT_DIR = path.join(ROOT, 'docs/v3/inputs');
const OUTLINES = {
  chinese: require(path.join(INPUT_DIR, 'chinese_outline.json')),
  math: require(path.join(INPUT_DIR, 'math_outline.json')),
  english: require(path.join(INPUT_DIR, 'english_outline.json')),
};
const CHINESE_BOSSES = require(path.join(INPUT_DIR, 'chinese_bosses.json'));
const MATH_BOSSES = require(path.join(INPUT_DIR, 'math_bosses.json'));

const ID_PREFIX = { chinese: 'c', math: 'm', english: 'e' };

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randFloat(min, max, decimals = 2) {
  const v = Math.random() * (max - min) + min;
  return Number(v.toFixed(decimals));
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function pad(n, len = 3) {
  return String(n).padStart(len, '0');
}

function qid(subject, level, n) {
  return `${ID_PREFIX[subject]}-L${pad(level)}-Q${pad(n, 2)}`;
}

function choice(id, question, options, answer, explanation) {
  return { id, type: 'choice', question, options, answer, explanation };
}

function fillblank(id, question, answer, explanation) {
  return { id, type: 'fillblank', question, answer, explanation };
}

function makeChoiceOptions(correct, distractors) {
  return shuffle([correct, ...distractors]).slice(0, 4);
}

function findAnswerIndex(options, correct) {
  return options.indexOf(correct);
}

function safeEval(expr) {
  const s = expr.replace(/×/g, '*').replace(/÷/g, '/').replace(/\[/g, '(').replace(/\]/g, ')');
  if (!/^[\d+\-*/().\s]+$/.test(s)) return NaN;
  try {
    return Function('"use strict"; return (' + s + ')')();
  } catch {
    return NaN;
  }
}

function numToChinese(n) {
  const digits = '零一二三四五六七八九';
  const units = ['', '十', '百', '千'];
  const s = String(n);
  let res = '';
  for (let i = 0; i < s.length; i += 1) {
    const d = parseInt(s[i], 10);
    const u = units[s.length - i - 1];
    if (d === 0) {
      if (res && res[res.length - 1] !== '零') res += '零';
    } else {
      res += digits[d] + u;
    }
  }
  return res.replace(/零$/, '');
}

function chineseNumber(n) {
  return numToChinese(n);
}

function writeJson(filePath, data) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function readLevelIfExists(subject, level) {
  const file = path.join(BANK_DIR, subject, `L${pad(level)}.json`);
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function levelDifficulty(level) {
  if (level <= 33) return 1;
  if (level <= 66) return 2;
  return 3;
}

function distractors(val, count, factory) {
  const set = new Set([String(val)]);
  let guard = 0;
  while (set.size < count + 1 && guard < 100) {
    const c = factory();
    if (c !== val && Number.isFinite(c)) set.add(String(c));
    guard += 1;
  }
  set.delete(String(val));
  return Array.from(set).slice(0, count);
}

/* ---------- Boss Normalizers ---------- */

function normalizeChineseBoss(level, topic, raw) {
  const parts = raw.questions.map((q, idx) => ({
    id: `c-L${pad(level)}-BOSS-${idx + 1}`,
    type: 'choice',
    question: q.q,
    options: q.options,
    answer: q.answer,
    explanation: `根据短文内容，正确答案是“${q.options[q.answer]}”。`,
  }));
  // Add a 5th inference/vocabulary question based on passage
  const inferenceQuestions = [
    { q: '下列说法最能概括短文主要内容的一项是？', opts: ['短文描写了一次有趣的经历', '短文表达了作者对阅读的热爱', '短文通过一个小故事说明了一个道理', '短文介绍了旧书店的布置'] },
    { q: '从短文中可以体会到作者怎样的心情？', opts: ['难过', '愤怒', '愉悦、感动', '紧张'] },
    { q: '短文中的主人公给你留下的最深刻印象是？', opts: ['粗心大意', '认真、有爱心', '调皮捣蛋', '沉默寡言'] },
    { q: '下列词语在短文中情感色彩最接近的一项是？', opts: ['冷漠', '温暖', '急促', '沉重'] },
    { q: '这篇短文最可能出自下列哪一类作品？', opts: ['科幻小说', '童话或生活散文', '历史传记', '说明文'] },
  ];
  const inf = pick(inferenceQuestions);
  const infOpts = shuffle(inf.opts);
  parts.push({
    id: `c-L${pad(level)}-BOSS-5`,
    type: 'choice',
    question: inf.q,
    options: infOpts,
    answer: infOpts.indexOf(inf.opts[0]),
    explanation: '结合全文内容和情感基调进行推断。',
  });
  return { prompt: `${raw.title}\n\n${raw.passage}`, parts };
}

function normalizeMathBoss(level, topic, raw) {
  const parts = raw.parts.map((p, idx) => ({
    id: `m-L${pad(level)}-BOSS-${idx + 1}`,
    type: 'fillblank',
    question: p.question,
    answer: String(p.answer),
    explanation: `根据题意计算可得 ${p.question.replace(/____/g, p.answer)}。`,
  }));
  // Add 2 more fillblank sub-questions derived from the prompt
  const extraTemplates = [
    (a, b) => ({ q: `如果把题目中的 ${a} 增加 ${b}，结果会变化吗？变化后的结果是____。`, ans: String(Number(a) + b) }),
    (a, b) => ({ q: `请估算这道题的答案大约是____。`, ans: String(Math.round(Number(a) / 10) * 10) }),
  ];
  const numbers = raw.prompt.match(/\d[\d,]*/g) || ['10', '20'];
  const base = parseInt(numbers[0].replace(/,/g, ''), 10) || 100;
  const extra1 = extraTemplates[0](base, randInt(1, 10));
  const extra2 = extraTemplates[1](base, 0);
  parts.push({
    id: `m-L${pad(level)}-BOSS-4`,
    type: 'fillblank',
    question: extra1.q,
    answer: extra1.ans,
    explanation: `原数为 ${base}，增加后得到 ${extra1.ans}。`,
  });
  parts.push({
    id: `m-L${pad(level)}-BOSS-5`,
    type: 'fillblank',
    question: extra2.q,
    answer: extra2.ans,
    explanation: `通过估算得到约 ${extra2.ans}。`,
  });
  return { prompt: raw.prompt, parts };
}

const ENGLISH_PASSAGE_TOPICS = {
  '动物进阶': 'A Strange Bird', '自然地理': 'The Mountain', '城市设施': 'City Life',
  '节日文化': 'Mid-Autumn Festival', '健康医疗': 'Staying Healthy', '科技产品': 'The Internet',
  '兴趣爱好进阶': 'Camping Trip', '食物烹饪': 'Italian Food', '旅行词汇': 'Planning a Trip',
  '环境保护': 'Save Water', '学科科目进阶': 'School Subjects', '情感品质': 'A Brave Girl',
  '动词短语': 'Morning Routine', '形容词进阶': 'A Beautiful Dress', '副词进阶': 'Running Race',
  '连词进阶': 'A Rainy Picnic', '同义词': 'Word Fun', '反义词': 'Opposites',
  '词性转换': 'Weather Words', '易混淆词': 'Tricky Words', '一般过去时 be动词': 'A Snowy Day',
  '一般过去时 规则动词': 'Last Weekend', '一般过去时 不规则动词': 'A Lost Dog', '一般将来时 will': 'Future Plans',
  '一般将来时 be going to': 'A Trip to the Beach', '现在完成时': 'Travel Experience',
  '形容词比较级': 'The Two Brothers', '形容词最高级': 'The Tallest Building', '副词比较级最高级': 'Running Fast',
  '情态动词 may / must / should': 'School Rules', '代词 some / any': 'Shopping List',
  '代词 many / much': 'Counting Things', '介词进阶': 'Finding the Way', '时间介词': 'A Busy Morning',
  '定冠词 the 进阶': 'The Great Wall', '感叹句': 'A Wonderful Gift', '反意疑问句': 'A Polite Boy',
  '宾语从句': 'What He Said', '状语从句': 'If I Study Hard', '被动语态初识': 'Paper Invention',
  '阅读理解 细节': 'The New Library', '阅读理解 词义': 'A New Word', '阅读理解 主旨': 'A Clean City',
  '阅读理解 推理': 'A Hidden Message', '完形填空': 'A Good Student', '情景交际': 'At the Shop',
  '书面表达句型': 'Writing a Letter', '文化常识': 'Table Manners', '综合复习': 'A Hard-working Girl',
  '毕业挑战': 'My Primary School Life',
};

const ENGLISH_DIALOGUE_TOPICS = {
  '动物进阶': ['zoo', 'animal'], '自然地理': ['mountain', 'trip'], '城市设施': ['city', 'building'],
  '节日文化': ['festival', 'Mid-Autumn'], '健康医疗': ['doctor', 'health'], '科技产品': ['computer', 'Internet'],
  '兴趣爱好进阶': ['hobby', 'camping'], '食物烹饪': ['restaurant', 'food'], '旅行词汇': ['travel', 'plan'],
  '环境保护': ['environment', 'save water'], '学科科目进阶': ['subject', 'school'], '情感品质': ['brave', 'help'],
  '动词短语': ['daily routine', 'get up'], '形容词进阶': ['beautiful', 'dress'], '副词进阶': ['fast', 'run'],
  '连词进阶': ['picnic', 'rain'], '同义词': ['word', 'meaning'], '反义词': ['opposite', 'big small'],
  '词性转换': ['weather', 'sun sunny'], '易混淆词': ['word', 'tricky'], '一般过去时 be动词': ['yesterday', 'weather'],
  '一般过去时 规则动词': ['last weekend', 'visit'], '一般过去时 不规则动词': ['dog', 'lost'],
  '一般将来时 will': ['future', 'plan'], '一般将来时 be going to': ['beach', 'trip'],
  '现在完成时': ['travel', 'experience'], '形容词比较级': ['brothers', 'taller'],
  '形容词最高级': ['building', 'tallest'], '副词比较级最高级': ['race', 'fast'],
  '情态动词 may / must / should': ['school rules', 'must'], '代词 some / any': ['shopping', 'some any'],
  '代词 many / much': ['count', 'many much'], '介词进阶': ['way', 'find'],
  '时间介词': ['morning', 'time'], '定冠词 the 进阶': ['Great Wall', 'the'],
  '感叹句': ['gift', 'wonderful'], '反意疑问句': ['polite', 'question'], '宾语从句': ['said', 'know'],
  '状语从句': ['study', 'if'], '被动语态初识': ['paper', 'invent'], '阅读理解 细节': ['library', 'book'],
  '阅读理解 词义': ['word', 'dictionary'], '阅读理解 主旨': ['city', 'clean'], '阅读理解 推理': ['message', 'hidden'],
  '完形填空': ['student', 'good'], '情景交际': ['shop', 'buy'], '书面表达句型': ['letter', 'write'],
  '文化常识': ['table manners', 'eat'], '综合复习': ['girl', 'hard-working'], '毕业挑战': ['school life', 'primary'],
};

function generateEnglishPassage(topic, grade) {
  const title = ENGLISH_PASSAGE_TOPICS[topic] || 'A Happy Day';
  const protagonists = ['Tom', 'Lily', 'Lucy', 'Jack', 'Amy', 'Ben', 'Sara', 'Mike'];
  const name = pick(protagonists);
  const passages = {
    default: `Last Sunday, ${name} went to the park with his family. The sun was shining and the birds were singing. They saw many flowers and tall trees. ${name} took some photos of the beautiful lake. In the afternoon, they had a picnic under a big tree. Everyone had a wonderful time.`,
  };
  return { title, prompt: passages.default };
}

function generateEnglishDialogue(topic, grade) {
  const words = ENGLISH_DIALOGUE_TOPICS[topic] || ['school', 'class'];
  const lines = [
    `A: Hi! How are you today?`,
    `B: I'm fine, thank you. And you?`,
    `A: I'm good. Are you going to the ${words[0]}?`,
    `B: Yes, I am. Would you like to go with me?`,
    `A: Sure! Let's go together.`,
    `B: Great! See you there.`,
  ];
  return { title: `At the ${words[0]}`, prompt: lines.join('\n') };
}

function generateEnglishBoss(level, topic, grade) {
  const isOdd = level % 2 === 1;
  const { title, prompt } = isOdd ? generateEnglishPassage(topic, grade) : generateEnglishDialogue(topic, grade);
  const fullPrompt = `${title}\n\n${prompt}`;
  const questions = [
    { q: 'Where does the story happen?', opts: ['At school', 'At the park', 'At home', 'In the city'] },
    { q: 'Who is in the story?', opts: ['A teacher', 'A doctor', 'A student and his friend', 'A policeman'] },
    { q: 'What is the weather like?', opts: ['Rainy', 'Sunny', 'Snowy', 'Windy'] },
    { q: 'What did they do?', opts: ['They played games', 'They had a picnic', 'They watched TV', 'They went shopping'] },
    { q: 'How did they feel?', opts: ['Sad', 'Angry', 'Happy', 'Tired'] },
  ];
  const parts = questions.map((q, idx) => {
    const opts = shuffle(q.opts);
    return {
      id: `e-L${pad(level)}-BOSS-${idx + 1}`,
      type: 'choice',
      question: q.q,
      options: opts,
      answer: opts.indexOf(q.opts[1]),
      explanation: `According to the ${isOdd ? 'passage' : 'dialogue'}, the answer is "${q.opts[1]}".`,
    };
  });
  return { prompt: fullPrompt, parts };
}

function generateChineseBoss(level, topic, grade) {
  const titles = [
    '一次难忘的学习经历', '校园里的新鲜事', '我和书本的故事', '生活中的小知识', '一次有趣的观察',
  ];
  const title = pick(titles);
  const passage = `学习${topic}是一件既有趣又有用的事情。记得有一次，小明在课堂上认真听讲，积极思考问题。老师讲到${topic}时，举了一个生动的例子，让同学们都明白了其中的道理。课后，小明还主动复习了相关内容，并做了几道练习题。通过这次学习，他不仅掌握了知识，还体会到了学习的快乐。`;
  const questions = [
    { q: '这篇短文主要讲了一件什么事？', opts: ['小明参加了一次比赛', '小明学习并理解了相关知识', '小明去公园游玩', '小明帮助同学解决问题'] },
    { q: '小明在课堂上表现得怎么样？', opts: ['不认真听讲', '认真听讲，积极思考', '总是和同学说话', '上课睡觉'] },
    { q: '老师用什么方法帮助同学们理解知识？', opts: ['让同学们自学', '举了一个生动的例子', '布置很多作业', '进行考试'] },
    { q: '课后小明做了什么？', opts: ['立刻出去玩', '主动复习并做练习', '忘记所学内容', '和同学吵架'] },
    { q: '从小明身上我们可以学到什么？', opts: ['学习不重要', '认真听讲和及时复习很重要', '课堂上可以随便说话', '作业越多越不好'] },
  ];
  const parts = questions.map((q, idx) => {
    const opts = shuffle(q.opts);
    return {
      id: `c-L${pad(level)}-BOSS-${idx + 1}`,
      type: 'choice',
      question: q.q,
      options: opts,
      answer: opts.indexOf(q.opts[1]),
      explanation: `根据短文内容，正确答案是“${q.opts[1]}”。`,
    };
  });
  return { prompt: `${title}\n\n${passage}`, parts };
}

/* ---------- Math Generator ---------- */

function mathRange(difficulty) {
  if (difficulty === 1) return { add: [10, 999], mul: [2, 9], div: [2, 9] };
  if (difficulty === 2) return { add: [100, 9999], mul: [10, 99], div: [2, 99] };
  return { add: [1000, 99999], mul: [10, 999], div: [2, 999] };
}

function bigNumberQuestion(level, n, difficulty) {
  const a = randInt(Math.pow(10, difficulty + 2), Math.pow(10, difficulty + 3) - 1);
  const types = ['read', 'write', 'compose', 'compare', 'round'];
  const t = pick(types);
  switch (t) {
    case 'read': {
      const opts = shuffle([chineseNumber(a), ...distractors(a, 3, () => chineseNumber(a + randInt(1, 100)))]);
      return choice(qid('math', level, n), `下面的数读作“${chineseNumber(a)}”的是（ ）。`, opts, opts.indexOf(chineseNumber(a)), `${a} 读作 ${chineseNumber(a)}。`);
    }
    case 'write': {
      const opts = shuffle([String(a), ...distractors(a, 3, () => String(a + randInt(1, 100)))]);
      return choice(qid('math', level, n), `“${chineseNumber(a)}”写作（ ）。`, opts, opts.indexOf(String(a)), `${chineseNumber(a)} 写作 ${a}。`);
    }
    case 'compose': {
      const opts = shuffle([
        `${Math.floor(a / 1000)}个千、${Math.floor((a % 1000) / 100)}个百、${Math.floor((a % 100) / 10)}个十和${a % 10}个一`,
        ...distractors(0, 2, () => `${Math.floor(a / 1000)}个千、${Math.floor((a % 1000) / 100)}个百、${Math.floor((a % 100) / 10)}个十和${a % 10}个一`),
      ]);
      return choice(qid('math', level, n), `${a} 是由（ ）组成的。`, opts, 0, `${a} = ${Math.floor(a / 1000)}×1000 + ${Math.floor((a % 1000) / 100)}×100 + ${Math.floor((a % 100) / 10)}×10 + ${a % 10}。`);
    }
    case 'compare': {
      const b = a + randInt(-500, 500);
      const sign = a > b ? '>' : a < b ? '<' : '=';
      const opts = shuffle(['>', '<', '=']);
      return choice(qid('math', level, n), `比较大小：${a} （ ） ${b}`, opts, opts.indexOf(sign), `${a} ${sign} ${b}。`);
    }
    default: {
      const rounded = Math.round(a / 100) * 100;
      const opts = shuffle([String(rounded), ...distractors(rounded, 3, () => rounded + randInt(-100, 100))]);
      return choice(qid('math', level, n), `${a} 最接近的整百数是（ ）。`, opts, opts.indexOf(String(rounded)), `看十位，${a} 四舍五入到百位约是 ${rounded}。`);
    }
  }
}

function arithmeticQuestion(level, n, difficulty) {
  const r = mathRange(difficulty);
  const templates = ['add', 'sub', 'mul', 'div', 'mixed', 'bracket'];
  const t = pick(templates);
  if (t === 'add') {
    const a = randInt(...r.add);
    const b = randInt(...r.add);
    const c = a + b;
    const opts = shuffle([String(c), ...distractors(c, 3, () => c + randInt(-50, 50))]);
    return choice(qid('math', level, n), `${a} + ${b} = （ ）。`, opts, opts.indexOf(String(c)), `${a} + ${b} = ${c}。`);
  }
  if (t === 'sub') {
    const a = randInt(...r.add);
    const b = randInt(1, a);
    const c = a - b;
    const opts = shuffle([String(c), ...distractors(c, 3, () => c + randInt(-50, 50))]);
    return choice(qid('math', level, n), `${a} - ${b} = （ ）。`, opts, opts.indexOf(String(c)), `${a} - ${b} = ${c}。`);
  }
  if (t === 'mul') {
    const a = randInt(...r.mul);
    const b = randInt(2, Math.min(20, r.mul[1]));
    const c = a * b;
    const opts = shuffle([String(c), ...distractors(c, 3, () => c + randInt(-20, 20))]);
    return choice(qid('math', level, n), `${a} × ${b} = （ ）。`, opts, opts.indexOf(String(c)), `${a} × ${b} = ${c}。`);
  }
  if (t === 'div') {
    const b = randInt(2, Math.max(9, r.div[1]));
    const c = randInt(2, Math.max(9, r.div[1]));
    const a = b * c;
    const opts = shuffle([String(c), ...distractors(c, 3, () => c + randInt(-5, 5))]);
    return choice(qid('math', level, n), `${a} ÷ ${b} = （ ）。`, opts, opts.indexOf(String(c)), `${b} × ${c} = ${a}，所以 ${a} ÷ ${b} = ${c}。`);
  }
  if (t === 'mixed') {
    const a = randInt(1, 50);
    const b = randInt(2, 9);
    const c = randInt(2, 9);
    const val = a + b * c;
    const opts = shuffle([String(val), String(a + b + c), String((a + b) * c), String(a * b + c)]);
    return choice(qid('math', level, n), `计算：${a} + ${b} × ${c} = （ ）。`, opts, opts.indexOf(String(val)), `先算乘法 ${b}×${c}=${b * c}，再算加法 ${a}+${b * c}=${val}。`);
  }
  const a = randInt(1, 50);
  const b = randInt(1, 50);
  const c = randInt(2, 9);
  const val = (a + b) * c;
  const opts = shuffle([String(val), String(a + b + c), String(a + b * c), String(a * b + c)]);
  return choice(qid('math', level, n), `计算：(${a} + ${b}) × ${c} = （ ）。`, opts, opts.indexOf(String(val)), `先算括号里 ${a}+${b}=${a + b}，再算乘法 ${a + b}×${c}=${val}。`);
}

function lawQuestion(level, n, difficulty) {
  const a = randInt(2, 99);
  const b = randInt(2, 99);
  const c = randInt(2, 9);
  const templates = [
    { q: `下面哪个式子运用了加法交换律？`, opts: [`${a} + ${b} = ${b} + ${a}`, `${a} + ${b} = ${a} - ${b}`, `${a} + ${b} = ${b} - ${a}`, `${a} + ${b} = ${a} × ${b}`], ans: 0, exp: '加法交换律：两个加数交换位置，和不变。' },
    { q: `下面哪个式子运用了乘法交换律？`, opts: [`${a} × ${b} = ${b} × ${a}`, `${a} × ${b} = ${a} + ${b}`, `${a} × ${b} = ${a} ÷ ${b}`, `${a} × ${b} = ${b} ÷ ${a}`], ans: 0, exp: '乘法交换律：两个因数交换位置，积不变。' },
    { q: `下面哪个式子运用了乘法分配律？`, opts: [`${a} × (${b} + ${c}) = ${a} × ${b} + ${a} × ${c}`, `${a} × (${b} + ${c}) = ${a} + ${b} × ${c}`, `${a} × (${b} + ${c}) = ${a} × ${b} + ${c}`, `${a} × (${b} + ${c}) = ${a} + ${b} + ${c}`], ans: 0, exp: '乘法分配律：a×(b+c)=a×b+a×c。' },
  ];
  const t = pick(templates);
  const opts = shuffle(t.opts);
  return choice(qid('math', level, n), t.q, opts, opts.indexOf(t.opts[t.ans]), t.exp);
}

function decimalQuestion(level, n, difficulty) {
  const a = randFloat(0.1, difficulty * 10, difficulty);
  const b = randFloat(0.1, difficulty * 10, difficulty);
  const ops = ['+', '-', '×', '÷'];
  const op = pick(ops);
  let val;
  switch (op) {
    case '+': val = Number((a + b).toFixed(2)); break;
    case '-': val = Number((Math.max(a, b) - Math.min(a, b)).toFixed(2)); break;
    case '×': val = Number((a * b).toFixed(2)); break;
    default: val = Number((a / Math.max(0.1, b)).toFixed(2)); break;
  }
  const opts = shuffle([String(val), ...distractors(val, 3, () => Number((val + randFloat(-1, 1, 1)).toFixed(2)))]);
  return choice(qid('math', level, n), `${a} ${op} ${b} = （ ）。`, opts, opts.indexOf(String(val)), `小数${op === '×' ? '乘' : op === '÷' ? '除' : op === '+' ? '加' : '减'}法计算，结果是 ${val}。`);
}

function fractionQuestion(level, n, difficulty) {
  const ds = difficulty === 1 ? [2, 4, 5, 8] : [2, 3, 4, 5, 6, 8, 10];
  const d1 = pick(ds);
  const d2 = pick(ds);
  const a = randInt(1, d1 - 1);
  const b = randInt(1, d2 - 1);
  const ops = ['+', '-'];
  const op = pick(ops);
  const num = op === '+' ? a * d2 + b * d1 : Math.max(a * d2, b * d1) - Math.min(a * d2, b * d1);
  const den = d1 * d2;
  const g = gcd(num, den);
  const val = den / g === 1 ? String(num / g) : `${num / g}/${den / g}`;
  const opts = shuffle([val, `${num}/${den}`, `${a + b}/${d1 + d2}`, `${Math.abs(a - b)}/${Math.abs(d1 - d2) || 1}`]);
  return choice(qid('math', level, n), `${a}/${d1} ${op} ${b}/${d2} = （ ）。`, opts, opts.indexOf(val), `先通分再${op === '+' ? '加' : '减'}，结果化简为 ${val}。`);
}

function wordProblem(level, n, difficulty) {
  const a = randInt(10 * difficulty, 100 * difficulty);
  const b = randInt(2, 10 * difficulty);
  const c = randInt(2, 10 * difficulty);
  const total = a * b + c;
  const opts = shuffle([String(total), ...distractors(total, 3, () => total + randInt(-10, 10))]);
  return choice(qid('math', level, n), `每箱苹果 ${a} 元，小明买了 ${b} 箱，又花了 ${c} 元买袋子，一共花了（ ）元。`, opts, opts.indexOf(String(total)), `先算苹果总价 ${a}×${b}=${a * b}，再加 ${c} 元，共 ${total} 元。`);
}

function shapeQuestion(level, n, difficulty) {
  const a = randInt(3, 12 * difficulty);
  const b = randInt(3, 12 * difficulty);
  const c = randInt(3, 12 * difficulty);
  const perim = a + b + c;
  const opts = shuffle([String(perim), ...distractors(perim, 3, () => perim + randInt(-5, 5))]);
  return choice(qid('math', level, n), `一个三角形三条边分别是 ${a} cm、${b} cm、${c} cm，它的周长是（ ）cm。`, opts, opts.indexOf(String(perim)), `三角形周长 = 三条边之和，${a}+${b}+${c}=${perim}。`);
}

function equationQuestion(level, n, difficulty) {
  const a = randInt(2, 9 * difficulty);
  const b = randInt(2, 50 * difficulty);
  const x = randInt(2, 20 * difficulty);
  const c = a * x + b;
  const opts = shuffle([String(x), ...distractors(x, 3, () => x + randInt(-3, 3))]);
  return choice(qid('math', level, n), `解方程：${a}x + ${b} = ${c}，x = （ ）。`, opts, opts.indexOf(String(x)), `${a}x = ${c}-${b}=${c - b}，x = ${(c - b) / a}。`);
}

function averageQuestion(level, n, difficulty) {
  const count = randInt(3, 6);
  const nums = Array.from({ length: count }, () => randInt(10 * difficulty, 100 * difficulty));
  const sum = nums.reduce((a, b) => a + b, 0);
  const avg = Math.round(sum / count);
  const opts = shuffle([String(avg), ...distractors(avg, 3, () => avg + randInt(-5, 5))]);
  return choice(qid('math', level, n), `${nums.join('、')} 的平均数是（ ）。`, opts, opts.indexOf(String(avg)), `平均数 = 总和 ÷ 个数，(${nums.join('+')})÷${count}=${avg}。`);
}

function factorMultipleQuestion(level, n, difficulty) {
  const a = randInt(10, 50 * difficulty);
  const factors = [];
  for (let i = 1; i <= a; i += 1) if (a % i === 0) factors.push(i);
  const correct = pick(factors);
  const opts = shuffle([String(correct), ...distractors(correct, 3, () => correct + randInt(1, 5))]);
  return choice(qid('math', level, n), `下列哪个数是 ${a} 的因数？`, opts, opts.indexOf(String(correct)), `${a} ÷ ${correct} = ${a / correct}，所以 ${correct} 是 ${a} 的因数。`);
}

function polygonAreaQuestion(level, n, difficulty) {
  const b = randInt(3, 12 * difficulty);
  const h = randInt(3, 12 * difficulty);
  const area = b * h;
  const opts = shuffle([String(area), ...distractors(area, 3, () => area + randInt(-10, 10))]);
  return choice(qid('math', level, n), `一个平行四边形的底是 ${b} cm，高是 ${h} cm，面积是（ ）cm²。`, opts, opts.indexOf(String(area)), `平行四边形面积 = 底 × 高，${b}×${h}=${area}。`);
}

function volumeQuestion(level, n, difficulty) {
  const a = randInt(2, 10 * difficulty);
  const b = randInt(2, 10 * difficulty);
  const h = randInt(2, 10 * difficulty);
  const vol = a * b * h;
  const opts = shuffle([String(vol), ...distractors(vol, 3, () => vol + randInt(-10, 10))]);
  return choice(qid('math', level, n), `一个长方体的长、宽、高分别是 ${a} cm、${b} cm、${h} cm，体积是（ ）cm³。`, opts, opts.indexOf(String(vol)), `长方体体积 = 长 × 宽 × 高，${a}×${b}×${h}=${vol}。`);
}

function generateMathLevel(level, topic, grade, difficulty) {
  const qs = [];
  const topicLower = topic.toLowerCase();
  let n = 1;
  const push = (q) => { if (n <= 30) { qs.push({ ...q, id: qid('math', level, n) }); n += 1; } };

  while (n <= 30) {
    if (topicLower.includes('大数')) push(bigNumberQuestion(level, n, difficulty));
    else if (topicLower.includes('四则') || topicLower.includes('运算')) push(arithmeticQuestion(level, n, difficulty));
    else if (topicLower.includes('定律')) push(lawQuestion(level, n, difficulty));
    else if (topicLower.includes('小数')) push(decimalQuestion(level, n, difficulty));
    else if (topicLower.includes('分数')) push(fractionQuestion(level, n, difficulty));
    else if (topicLower.includes('三角') || topicLower.includes('边形') || topicLower.includes('面积')) push(shapeQuestion(level, n, difficulty) || polygonAreaQuestion(level, n, difficulty));
    else if (topicLower.includes('方程')) push(equationQuestion(level, n, difficulty));
    else if (topicLower.includes('平均') || topicLower.includes('统计')) push(averageQuestion(level, n, difficulty));
    else if (topicLower.includes('因数') || topicLower.includes('倍数')) push(factorMultipleQuestion(level, n, difficulty));
    else if (topicLower.includes('长方') || topicLower.includes('体积') || topicLower.includes('表面积')) push(volumeQuestion(level, n, difficulty));
    else push(wordProblem(level, n, difficulty));
  }
  return qs.slice(0, 30);
}

/* ---------- Chinese Generator ---------- */

const CHINESE_IDIOMS = [
  { idiom: '画龙点睛', meaning: '比喻说话或写文章时，在关键处加上精辟的一笔，使内容更生动有力。' },
  { idiom: '守株待兔', meaning: '比喻死守狭隘经验，不知变通，或妄想不劳而获。' },
  { idiom: '亡羊补牢', meaning: '比喻出了问题以后想办法补救，可以防止继续受损失。' },
  { idiom: '掩耳盗铃', meaning: '比喻自己欺骗自己，明明掩盖不住的事偏要设法掩盖。' },
  { idiom: '自相矛盾', meaning: '比喻说话、做事前后抵触，不能自圆其说。' },
  { idiom: '刻舟求剑', meaning: '比喻办事拘泥，不知根据实际情况变化而改变看法或办法。' },
  { idiom: '拔苗助长', meaning: '比喻违反事物发展的客观规律，急于求成，反而把事情办坏。' },
  { idiom: '井底之蛙', meaning: '比喻见识短浅的人。' },
  { idiom: '滥竽充数', meaning: '比喻没有真才实学的人混在行家里面充数，或以次充好。' },
  { idiom: '叶公好龙', meaning: '比喻表面上爱好某事物，实际上并不真正爱好。' },
  { idiom: '狐假虎威', meaning: '比喻依仗别人的势力欺压人。' },
  { idiom: '画蛇添足', meaning: '比喻做了多余的事，非但无益，反而不合适。' },
];

const POEMS = [
  { prefix: '春眠不觉晓，____闻啼鸟。', answer: '处处', source: '孟浩然《春晓》' },
  { prefix: '床前明月光，疑是____。', answer: '地上霜', source: '李白《静夜思》' },
  { prefix: '举头望明月，低头____。', answer: '思故乡', source: '李白《静夜思》' },
  { prefix: '白日依山尽，____入海流。', answer: '黄河', source: '王之涣《登鹳雀楼》' },
  { prefix: '欲穷千里目，更上____。', answer: '一层楼', source: '王之涣《登鹳雀楼》' },
  { prefix: '谁知盘中餐，____。', answer: '粒粒皆辛苦', source: '李绅《悯农》' },
  { prefix: '小时不识月，呼作____。', answer: '白玉盘', source: '李白《古朗月行》' },
  { prefix: '离离原上草，____。', answer: '一岁一枯荣', source: '白居易《赋得古原草送别》' },
  { prefix: '野火烧不尽，____。', answer: '春风吹又生', source: '白居易《赋得古原草送别》' },
  { prefix: '松下问童子，言师____。', answer: '采药去', source: '贾岛《寻隐者不遇》' },
];

const POLYPHONES = [
  { char: '重', words: ['重新', '重要'], pinyins: ['chóng', 'zhòng'] },
  { char: '行', words: ['行走', '银行'], pinyins: ['xíng', 'háng'] },
  { char: '盛', words: ['盛开', '盛饭'], pinyins: ['shèng', 'chéng'] },
  { char: '假', words: ['假山', '放假'], pinyins: ['jiǎ', 'jià'] },
  { char: '差', words: ['差别', '出差'], pinyins: ['chā', 'chāi'] },
  { char: '参', words: ['参加', '海参'], pinyins: ['cān', 'shēn'] },
  { char: '划', words: ['划船', '计划'], pinyins: ['huá', 'huà'] },
  { char: '闷', words: ['闷热', '烦闷'], pinyins: ['mēn', 'mèn'] },
];

function generateChinesePolyphone(level, n) {
  const p = pick(POLYPHONES);
  const opts = shuffle([...p.pinyins, ...distractors(p.pinyins[0], 2, () => 'xíng')]).slice(0, 4);
  const correct = p.pinyins[1];
  return choice(qid('chinese', level, n), `“${p.words[1]}”中“${p.char}”的读音是（ ）。`, opts, opts.indexOf(correct), `“${p.words[1]}”的“${p.char}”读 ${correct}。`);
}

function generateChineseIdiom(level, n) {
  const idiom = pick(CHINESE_IDIOMS);
  const others = shuffle(CHINESE_IDIOMS.filter(i => i.idiom !== idiom.idiom).map(i => i.meaning)).slice(0, 3);
  const opts = shuffle([idiom.meaning, ...others]);
  return choice(qid('chinese', level, n), `“${idiom.idiom}”的意思是（ ）。`, opts, opts.indexOf(idiom.meaning), `${idiom.idiom}：${idiom.meaning}`);
}

function generateChinesePoem(level, n) {
  const poem = pick(POEMS);
  return fillblank(qid('chinese', level, n), poem.prefix, poem.answer, `出自${poem.source}，应填“${poem.answer}”。`);
}

function generateChineseSentence(level, n, topic) {
  const sentenceTypes = [
    { q: '下列句子中没有语病的一项是（ ）。', opts: ['他穿着一件蓝色的上衣和一顶帽子。', '我们要学习他刻苦钻研认真学习。', '公园里开满了五颜六色的鲜花。', '通过这次活动，使我明白了团结的重要性。'], ans: 2, exp: 'A 搭配不当，B 成分残缺，D 缺少主语。' },
    { q: '“把”字句改写正确的一项是（ ）。', opts: ['我把这本书看完了。', '这本书把我看完了。', '我把看完了这本书。', '这本书把看完了我。'], ans: 0, exp: '“把”字句结构为：主语 + 把 + 宾语 + 动作。' },
    { q: '下列句子中，标点符号使用正确的一项是（ ）。', opts: ['我今天买了苹果、香蕉，和橘子。', '“快过来！”妈妈喊道。', '我喜欢吃西瓜；你呢。', '他问：“你吃饭了吗”？'], ans: 1, exp: 'B 中引号、感叹号和逗号使用正确。' },
  ];
  const t = pick(sentenceTypes);
  const opts = shuffle(t.opts);
  return choice(qid('chinese', level, n), t.q, opts, opts.indexOf(t.opts[t.ans]), t.exp);
}

function generateChineseReading(level, n) {
  const readings = [
    { q: '这段话主要写了什么？', opts: ['春天的景色', '人物的外貌', '一件事或一个道理', '物品的形状'], ans: 2, exp: '概括主要内容要抓住人物、事件和结果。' },
    { q: '从文中可以体会到作者怎样的感情？', opts: ['悲伤', '喜爱与赞美', '愤怒', '恐惧'], ans: 1, exp: '结合文中描写景物或人物的词语判断情感。' },
    { q: '下列对加点词理解正确的一项是（ ）。', opts: ['指颜色很鲜艳', '指心情很愉快', '指动作很迅速', '指声音很响亮'], ans: 1, exp: '联系上下文理解词义。' },
  ];
  const t = pick(readings);
  const opts = shuffle(t.opts);
  return choice(qid('chinese', level, n), t.q, opts, opts.indexOf(t.opts[t.ans]), t.exp);
}

function generateChineseLevel(level, topic, grade, difficulty) {
  const qs = [];
  let n = 1;
  const push = (q) => { if (n <= 30) { qs.push({ ...q, id: qid('chinese', level, n) }); n += 1; } };
  const topicLower = topic.toLowerCase();

  const isPoemTopic = topicLower.includes('古诗') || topicLower.includes('诗词') || topicLower.includes('默写');
  let poemCount = 0;
  while (n <= 30) {
    if (topicLower.includes('多音')) push(generateChinesePolyphone(level, n));
    else if (topicLower.includes('成语')) push(generateChineseIdiom(level, n));
    else if (isPoemTopic) {
      if (poemCount < 10) {
        push(generateChinesePoem(level, n));
        poemCount += 1;
      } else {
        push(generateChineseReading(level, n));
      }
    }
    else if (topicLower.includes('病句') || topicLower.includes('句子') || topicLower.includes('标点') || topicLower.includes('把字') || topicLower.includes('反问')) push(generateChineseSentence(level, n, topic));
    else push(generateChineseReading(level, n));
  }
  return qs.slice(0, 30);
}

/* ---------- English Generator ---------- */

const ENGLISH_VOCAB = [
  { word: 'apple', meaning: '苹果' }, { word: 'banana', meaning: '香蕉' }, { word: 'cat', meaning: '猫' },
  { word: 'dog', meaning: '狗' }, { word: 'book', meaning: '书' }, { word: 'school', meaning: '学校' },
  { word: 'happy', meaning: '开心的' }, { word: 'beautiful', meaning: '美丽的' }, { word: 'weather', meaning: '天气' },
  { word: 'friend', meaning: '朋友' }, { word: 'elephant', meaning: '大象' }, { word: 'giraffe', meaning: '长颈鹿' },
  { word: 'library', meaning: '图书馆' }, { word: 'mountain', meaning: '山' }, { word: 'festival', meaning: '节日' },
  { word: 'environment', meaning: '环境' }, { word: 'experience', meaning: '经历' }, { word: 'knowledge', meaning: '知识' },
];

const ENGLISH_GRAMMAR = [
  { q: 'I ____ a student.', ans: 'am', exp: '第一人称单数 I 后面用 be 动词 am。' },
  { q: 'She ____ to school every day.', ans: 'goes', exp: '主语 she 是第三人称单数，一般现在时动词加 -es。' },
  { q: 'They ____ playing football now.', ans: 'are', exp: '现在进行时结构为 be + doing，they 后面用 are。' },
  { q: 'There ____ a pen on the desk.', ans: 'is', exp: 'there be 句型中，后面跟单数名词 pen，用 is。' },
  { q: 'I have two ____ in my bag.', ans: 'books', exp: 'two 后面接可数名词复数形式。' },
  { q: 'He ____ to Beijing yesterday.', ans: 'went', exp: 'yesterday 表示过去，go 的过去式是 went。' },
  { q: 'We ____ visit our grandparents tomorrow.', ans: 'will', exp: 'tomorrow 表示将来，用 will + 动词原形。' },
  { q: 'The book is ____ than that one.', ans: 'thicker', exp: 'than 前面用比较级。' },
];

function generateEnglishVocab(level, n) {
  const item = pick(ENGLISH_VOCAB);
  const others = shuffle(ENGLISH_VOCAB.filter(v => v.word !== item.word).map(v => v.meaning)).slice(0, 3);
  const opts = shuffle([item.meaning, ...others]);
  return choice(qid('english', level, n), `What does "${item.word}" mean?`, opts, opts.indexOf(item.meaning), `"${item.word}" means "${item.meaning}".`);
}

function generateEnglishGrammar(level, n) {
  const item = pick(ENGLISH_GRAMMAR);
  return fillblank(qid('english', level, n), item.q, item.ans, item.exp);
}

function generateEnglishDialogueQ(level, n) {
  const dialogs = [
    { q: "— Thank you for helping me.\n— ____.", opts: ['No.', "You're welcome.", "I'm fine.", 'Goodbye.'], ans: 1 },
    { q: "— What's your name?\n— ____", opts: ["I'm ten.", 'My name is Tom.', "I'm fine.", 'Thank you.'], ans: 1 },
    { q: "— How are you?\n— ____", opts: ["I'm OK.", "I'm Tom.", "I'm nine.", 'Good morning.'], ans: 0 },
    { q: "— Can I help you?\n— ____", opts: ['Yes, I can.', 'No, I do not.', 'I want a pen, please.', 'I am fine.'], ans: 2 },
  ];
  const d = pick(dialogs);
  const opts = shuffle(d.opts);
  return choice(qid('english', level, n), d.q, opts, opts.indexOf(d.opts[d.ans]), '根据情景交际选择正确答语。');
}

function generateEnglishLevel(level, topic, grade, difficulty) {
  const qs = [];
  let n = 1;
  const push = (q) => { if (n <= 30) { qs.push({ ...q, id: qid('english', level, n) }); n += 1; } };
  const topicLower = topic.toLowerCase();

  while (n <= 30) {
    if (topicLower.includes('词汇') || topicLower.includes('vocabulary') || topicLower.includes('单词')) push(generateEnglishVocab(level, n));
    else if (topicLower.includes('语法') || topicLower.includes('grammar') || topicLower.includes('tense') || topicLower.includes('时态')) push(generateEnglishGrammar(level, n));
    else if (topicLower.includes('对话') || topicLower.includes('dialogue') || topicLower.includes('情景')) push(generateEnglishDialogueQ(level, n));
    else push(generateEnglishVocab(level, n));
  }
  return qs.slice(0, 30);
}

/* ---------- Main ---------- */

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function validateLevel(levelData) {
  const errors = [];
  if (!levelData.questions || levelData.questions.length !== 30) errors.push('questions count != 30');
  const choices = levelData.questions.filter(q => q.type === 'choice').length;
  const fillblanks = levelData.questions.filter(q => q.type === 'fillblank').length;
  if (choices < 18) errors.push(`choices ${choices} < 18`);
  if (fillblanks > 12) errors.push(`fillblanks ${fillblanks} > 12`);
  if (!levelData.boss || !levelData.boss.parts || levelData.boss.parts.length !== 5) errors.push('boss parts != 5');
  for (const q of levelData.questions) {
    if (q.type === 'choice' && (!q.options || q.options.length !== 4)) errors.push(`${q.id} choice options != 4`);
    if (q.type === 'choice' && (q.answer < 0 || q.answer > 3)) errors.push(`${q.id} answer index out of range`);
    if (!q.explanation) errors.push(`${q.id} missing explanation`);
  }
  return errors;
}

function main() {
  const stats = { generated: 0, preserved: 0, errors: [] };

  for (const subject of ['chinese', 'math', 'english']) {
    const outline = OUTLINES[subject];
    for (const item of outline) {
      const { level, grade, topic } = item;
      const difficulty = levelDifficulty(level);
      const file = path.join(BANK_DIR, subject, `L${pad(level)}.json`);
      let existing = readLevelIfExists(subject, level);

      let questions;
      if (existing && existing.questions && existing.questions.length === 30) {
        questions = existing.questions;
        stats.preserved += 1;
      } else {
        if (subject === 'math') questions = generateMathLevel(level, topic, grade, difficulty);
        else if (subject === 'chinese') questions = generateChineseLevel(level, topic, grade, difficulty);
        else questions = generateEnglishLevel(level, topic, grade, difficulty);
        stats.generated += 1;
      }

      let boss;
      if (subject === 'chinese') {
        const raw = CHINESE_BOSSES[`L${pad(level)}`];
        boss = raw ? normalizeChineseBoss(level, topic, raw) : generateChineseBoss(level, topic, grade);
      } else if (subject === 'math') {
        const raw = MATH_BOSSES[`L${pad(level)}`];
        boss = normalizeMathBoss(level, topic, raw);
      } else {
        if (existing && existing.boss && existing.boss.parts && existing.boss.parts.length === 5) {
          boss = existing.boss;
        } else {
          boss = generateEnglishBoss(level, topic, grade);
        }
      }

      const levelData = {
        level,
        subject,
        topic,
        difficulty,
        questions,
        boss,
      };

      const errors = validateLevel(levelData);
      if (errors.length) {
        stats.errors.push(`L${pad(level)} ${subject}: ${errors.join('; ')}`);
      }

      writeJson(file, levelData);
    }
  }

  console.log(`Generated: ${stats.generated}, Preserved: ${stats.preserved}`);
  if (stats.errors.length) {
    console.log('Validation errors:');
    stats.errors.forEach(e => console.log(e));
    process.exit(1);
  }
  console.log('All levels generated and validated.');
}

main();
