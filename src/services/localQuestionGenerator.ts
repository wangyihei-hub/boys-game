import type { Difficulty, QuestionGenerationConfig, QuestionType } from '../types';

export interface LocalRawQuestion {
  type: QuestionType;
  question: string;
  options?: string[];
  answer: number | string;
  explanation: string;
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randInt(0, i);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

function reduceFraction(numerator: number, denominator: number): string {
  if (denominator === 0) return '0';
  if (numerator === 0) return '0';
  const sign = Math.sign(numerator) * Math.sign(denominator);
  const num = Math.abs(numerator);
  const den = Math.abs(denominator);
  const g = gcd(num, den);
  const reducedNum = (num / g) * sign;
  const reducedDen = den / g;
  if (reducedDen === 1) return String(reducedNum);
  return `${reducedNum}/${reducedDen}`;
}

function formatDecimal(n: number): string {
  return Number(n.toFixed(2)).toString();
}

function pickOne<T>(items: T[]): T {
  return items[randInt(0, items.length - 1)];
}

function numericDistractors(correct: number, count = 3): number[] {
  const set = new Set<number>();
  const attempts = 0;
  while (set.size < count && attempts < count * 10) {
    const offset = randInt(1, Math.max(1, Math.floor(Math.abs(correct) * 0.5) + 5));
    const sign = Math.random() > 0.5 ? 1 : -1;
    const candidate = correct + offset * sign;
    if (Number.isFinite(candidate) && candidate !== correct) {
      set.add(candidate);
    }
  }
  while (set.size < count) {
    const candidate = correct + set.size + 1;
    set.add(candidate);
  }
  return Array.from(set);
}

function makeChoiceOptions(correctAnswer: string, distractorAnswers: string[]): string[] {
  const options = shuffle([correctAnswer, ...distractorAnswers]);
  if (options.length < 4) {
    while (options.length < 4) {
      options.push(`选项 ${options.length + 1}`);
    }
  }
  return options.slice(0, 4);
}

function findAnswerIndex(options: string[], correctAnswer: string): number {
  return options.findIndex(opt => opt === correctAnswer);
}

interface MathRange {
  addition: [number, number];
  subtraction: [number, number];
  multiplication: [number, number];
  division: [number, number];
}

function getMathRange(difficulty: Difficulty): MathRange {
  switch (difficulty) {
    case 1:
      return { addition: [2, 50], subtraction: [2, 50], multiplication: [2, 9], division: [2, 9] };
    case 2:
      return { addition: [10, 500], subtraction: [10, 500], multiplication: [2, 50], division: [2, 12] };
    case 3:
      return { addition: [100, 2000], subtraction: [100, 2000], multiplication: [10, 99], division: [3, 20] };
    default:
      return { addition: [2, 50], subtraction: [2, 50], multiplication: [2, 9], division: [2, 9] };
  }
}

function generateMathQuestion(config: QuestionGenerationConfig, index: number): LocalRawQuestion {
  const range = getMathRange(config.difficulty);
  const topic = config.topic.toLowerCase();
  const preferFraction = topic.includes('分数');
  const preferDecimal = topic.includes('小数');
  const preferWord = topic.includes('应用') || topic.includes('问题');
  const preferAdd = topic.includes('加');
  const preferSub = topic.includes('减');
  const preferMul = topic.includes('乘');
  const preferDiv = topic.includes('除');

  const templates = [
    'addition',
    'subtraction',
    'multiplication',
    'division',
    'fraction',
    'decimal',
    'mixed',
    'word',
  ] as const;

  let template = templates[index % templates.length];
  if (preferFraction) template = 'fraction';
  if (preferDecimal) template = 'decimal';
  if (preferWord) template = 'word';
  if (preferAdd) template = 'addition';
  if (preferSub) template = 'subtraction';
  if (preferMul) template = 'multiplication';
  if (preferDiv) template = 'division';

  const useChoice = index % 2 === 0;

  switch (template) {
    case 'addition': {
      const a = randInt(...range.addition);
      const b = randInt(...range.addition);
      const correct = a + b;
      const question = `${a} + ${b} = ?`;
      if (useChoice) {
        const correctStr = String(correct);
        const options = makeChoiceOptions(correctStr, numericDistractors(correct).map(String));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `加法计算：${a} + ${b} = ${correct}。` };
      }
      return { type: 'fillblank', question: `${a} + ${b} = ____`, answer: String(correct), explanation: `直接相加，${a} + ${b} = ${correct}。` };
    }
    case 'subtraction': {
      const a = randInt(...range.subtraction);
      const b = randInt(...range.subtraction);
      const [max, min] = a >= b ? [a, b] : [b, a];
      const correct = max - min;
      const question = `${max} - ${min} = ?`;
      if (useChoice) {
        const correctStr = String(correct);
        const options = makeChoiceOptions(correctStr, numericDistractors(correct).map(String));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `减法计算：${max} - ${min} = ${correct}。` };
      }
      return { type: 'fillblank', question: `${max} - ${min} = ____`, answer: String(correct), explanation: `直接相减，${max} - ${min} = ${correct}。` };
    }
    case 'multiplication': {
      const a = randInt(...range.multiplication);
      const b = randInt(...range.multiplication);
      const correct = a * b;
      const question = `${a} × ${b} = ?`;
      if (useChoice) {
        const correctStr = String(correct);
        const options = makeChoiceOptions(correctStr, numericDistractors(correct).map(String));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `乘法口诀/计算：${a} × ${b} = ${correct}。` };
      }
      return { type: 'fillblank', question: `${a} × ${b} = ____`, answer: String(correct), explanation: `乘法计算，${a} × ${b} = ${correct}。` };
    }
    case 'division': {
      const b = randInt(...range.division);
      const correct = randInt(2, Math.max(3, range.division[1]));
      const a = b * correct;
      const question = `${a} ÷ ${b} = ?`;
      if (useChoice) {
        const correctStr = String(correct);
        const options = makeChoiceOptions(correctStr, numericDistractors(correct).map(String));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `除法是乘法的逆运算：${b} × ${correct} = ${a}，所以 ${a} ÷ ${b} = ${correct}。` };
      }
      return { type: 'fillblank', question: `${a} ÷ ${b} = ____`, answer: String(correct), explanation: `想乘法算除法：${b} × ${correct} = ${a}。` };
    }
    case 'fraction': {
      const denominators = config.difficulty === 1 ? [2, 4] : [2, 3, 4, 5, 6, 8];
      const d1 = pickOne(denominators);
      const d2 = pickOne(denominators);
      const a = randInt(1, d1 - 1);
      const c = randInt(1, d2 - 1);
      const num = a * d2 + c * d1;
      const den = d1 * d2;
      const correct = reduceFraction(num, den);
      const question = `${a}/${d1} + ${c}/${d2} = ?`;
      if (useChoice) {
        const wrong = shuffle([
          reduceFraction(num + 1, den),
          reduceFraction(num, den + 1),
          reduceFraction(a + c, d1 + d2),
        ]);
        const options = makeChoiceOptions(correct, wrong);
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correct), explanation: `先通分：${a}/${d1} = ${a * d2}/${d1 * d2}，${c}/${d2} = ${c * d1}/${d1 * d2}，相加得 ${num}/${den}，化简为 ${correct}。` };
      }
      return { type: 'fillblank', question: `${a}/${d1} + ${c}/${d2} = ____`, answer: correct, explanation: `通分后分子相加，再化简。` };
    }
    case 'decimal': {
      const scale = config.difficulty === 1 ? 1 : 2;
      const a = Number((Math.random() * (range.addition[1] / 10)).toFixed(scale));
      const b = Number((Math.random() * (range.addition[1] / 10)).toFixed(scale));
      const correct = Number((a + b).toFixed(scale));
      const question = `${a} + ${b} = ?`;
      if (useChoice) {
        const correctStr = formatDecimal(correct);
        const wrong = [Number(correct + 0.1).toFixed(scale), Number(correct - 0.1).toFixed(scale), Number(correct * 2).toFixed(scale)];
        const options = makeChoiceOptions(correctStr, wrong.map(s => Number(s).toString()));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `小数加法：小数点对齐，${a} + ${b} = ${correct}。` };
      }
      return { type: 'fillblank', question: `${a} + ${b} = ____`, answer: formatDecimal(correct), explanation: `小数点对齐后相加，${a} + ${b} = ${correct}。` };
    }
    case 'mixed': {
      const a = randInt(1, 20);
      const b = randInt(2, 9);
      const c = randInt(2, 9);
      const correct = a + b * c;
      const question = `${a} + ${b} × ${c} = ?`;
      if (useChoice) {
        const correctStr = String(correct);
        const wrong = [a + b + c, (a + b) * c, a * b + c].map(String);
        const options = makeChoiceOptions(correctStr, wrong);
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `先算乘法再算加法：${b} × ${c} = ${b * c}，再加上 ${a} 得 ${correct}。` };
      }
      return { type: 'fillblank', question: `${a} + ${b} × ${c} = ____`, answer: String(correct), explanation: `先乘后加，${b} × ${c} = ${b * c}，${b * c} + ${a} = ${correct}。` };
    }
    case 'word': {
      const a = randInt(10, range.addition[1]);
      const b = randInt(1, a);
      const correct = a - b;
      const question = `小明有 ${a} 元，买文具花去 ${b} 元，还剩多少元？`;
      if (useChoice) {
        const correctStr = String(correct);
        const options = makeChoiceOptions(correctStr, numericDistractors(correct).map(String));
        return { type: 'choice', question, options, answer: findAnswerIndex(options, correctStr), explanation: `用总数减去花去的钱：${a} - ${b} = ${correct}（元）。` };
      }
      return { type: 'fillblank', question, answer: String(correct), explanation: `剩下的钱 = ${a} - ${b} = ${correct} 元。` };
    }
    default:
      return generateMathQuestion({ ...config }, index + 1);
  }
}

const CHINESE_IDIOMS: { idiom: string; meaning: string }[] = [
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

const CHINESE_POEMS: { prefix: string; answer: string; source: string }[] = [
  { prefix: '春眠不觉晓，____闻啼鸟。', answer: '处处', source: '孟浩然《春晓》' },
  { prefix: '床前明月光，疑是____。', answer: '地上霜', source: '李白《静夜思》' },
  { prefix: '举头望明月，低头____。', answer: '思故乡', source: '李白《静夜思》' },
  { prefix: '白日依山尽，____入海流。', answer: '黄河', source: '王之涣《登鹳雀楼》' },
  { prefix: '欲穷千里目，更上____。', answer: '一层楼', source: '王之涣《登鹳雀楼》' },
];

function generateChineseQuestion(config: QuestionGenerationConfig, index: number): LocalRawQuestion {
  const topic = config.topic.toLowerCase();
  const preferPoem = topic.includes('古诗') || topic.includes('诗');
  const preferIdiom = topic.includes('成语');

  const type: QuestionType = preferPoem ? 'fillblank' : index % 2 === 0 ? 'choice' : 'fillblank';

  if (type === 'fillblank' && (preferPoem || (!preferIdiom && index % 3 === 0))) {
    const poem = CHINESE_POEMS[index % CHINESE_POEMS.length];
    return {
      type: 'fillblank',
      question: poem.prefix,
      answer: poem.answer,
      explanation: `出自${poem.source}，应填“${poem.answer}”。`,
    };
  }

  const idiom = CHINESE_IDIOMS[index % CHINESE_IDIOMS.length];
  if (type === 'choice') {
    const otherMeanings = shuffle(CHINESE_IDIOMS.filter(i => i.idiom !== idiom.idiom).map(i => i.meaning)).slice(0, 3);
    const options = makeChoiceOptions(idiom.meaning, otherMeanings);
    return {
      type: 'choice',
      question: `“${idiom.idiom}”是什么意思？`,
      options,
      answer: findAnswerIndex(options, idiom.meaning),
      explanation: `${idiom.idiom}：${idiom.meaning}`,
    };
  }

  return {
    type: 'fillblank',
    question: `“____”的意思是“${idiom.meaning}”。`,
    answer: idiom.idiom,
    explanation: `这个成语是“${idiom.idiom}”，意思是${idiom.meaning}`,
  };
}

const ENGLISH_VOCAB: { word: string; meaning: string }[] = [
  { word: 'apple', meaning: '苹果' },
  { word: 'banana', meaning: '香蕉' },
  { word: 'cat', meaning: '猫' },
  { word: 'dog', meaning: '狗' },
  { word: 'book', meaning: '书' },
  { word: 'school', meaning: '学校' },
  { word: 'happy', meaning: '开心的' },
  { word: 'beautiful', meaning: '美丽的' },
  { word: 'weather', meaning: '天气' },
  { word: 'friend', meaning: '朋友' },
];

const ENGLISH_GRAMMAR: { question: string; answer: string; explanation: string }[] = [
  { question: 'I ____ a student.', answer: 'am', explanation: '第一人称单数 I 后面用 be 动词 am。' },
  { question: 'She ____ to school every day.', answer: 'goes', explanation: '主语 she 是第三人称单数，一般现在时动词加 -es。' },
  { question: 'They ____ playing football now.', answer: 'are', explanation: '现在进行时结构为 be + doing，they 后面用 are。' },
  { question: 'There ____ a pen on the desk.', answer: 'is', explanation: 'there be 句型中，后面跟单数名词 pen，用 is。' },
  { question: 'I have two ____ in my bag.', answer: 'books', explanation: 'two 后面接可数名词复数形式。' },
];

const ENGLISH_DIALOGUES: { question: string; options: string[]; answer: number; explanation: string }[] = [
  {
    question: "— Thank you for helping me.\n— ____.",
    options: ["No.", "You're welcome.", "I'm fine.", "Goodbye."],
    answer: 1,
    explanation: "对感谢的礼貌回答是 You're welcome.（不客气）。",
  },
  {
    question: "— What's your name?\n— ____",
    options: ["I'm ten.", "My name is Tom.", "I'm fine.", "Thank you."],
    answer: 1,
    explanation: "回答姓名用 My name is ...。",
  },
  {
    question: "— How are you?\n— ____",
    options: ["I'm OK.", "I'm Tom.", "I'm nine.", "Good morning."],
    answer: 0,
    explanation: "How are you? 常用 I'm fine / I'm OK. 回答。",
  },
];

function generateEnglishQuestion(config: QuestionGenerationConfig, index: number): LocalRawQuestion {
  const topic = config.topic.toLowerCase();
  const preferGrammar = topic.includes('语法') || topic.includes('grammar') || topic.includes('tense');
  const preferDialogue = topic.includes('对话') || topic.includes('dialogue');
  const preferVocab = topic.includes('词汇') || topic.includes('vocabulary') || topic.includes('单词');

  const order: ('vocab' | 'grammar' | 'dialogue')[] = ['vocab', 'grammar', 'dialogue'];
  if (preferVocab) order.unshift('vocab');
  if (preferGrammar) order.unshift('grammar');
  if (preferDialogue) order.unshift('dialogue');
  const kind = order[index % order.length];

  if (kind === 'vocab') {
    const item = ENGLISH_VOCAB[index % ENGLISH_VOCAB.length];
    const otherMeanings = shuffle(ENGLISH_VOCAB.filter(v => v.word !== item.word).map(v => v.meaning)).slice(0, 3);
    const options = makeChoiceOptions(item.meaning, otherMeanings);
    return {
      type: 'choice',
      question: `What does "${item.word}" mean?`,
      options,
      answer: findAnswerIndex(options, item.meaning),
      explanation: `"${item.word}" 的中文意思是 "${item.meaning}"。`,
    };
  }

  if (kind === 'grammar') {
    const item = ENGLISH_GRAMMAR[index % ENGLISH_GRAMMAR.length];
    return {
      type: 'fillblank',
      question: item.question,
      answer: item.answer,
      explanation: item.explanation,
    };
  }

  const item = ENGLISH_DIALOGUES[index % ENGLISH_DIALOGUES.length];
  const options = shuffle([...item.options]);
  const answerWord = item.options[item.answer];
  return {
    type: 'choice',
    question: item.question,
    options,
    answer: findAnswerIndex(options, answerWord),
    explanation: item.explanation,
  };
}

export async function generateLocalQuestions(
  config: QuestionGenerationConfig
): Promise<LocalRawQuestion[]> {
  const clampedCount = Math.max(1, Math.min(20, config.count));
  const questions: LocalRawQuestion[] = [];

  for (let i = 0; i < clampedCount; i += 1) {
    switch (config.subject) {
      case 'math':
        questions.push(generateMathQuestion(config, i));
        break;
      case 'chinese':
        questions.push(generateChineseQuestion(config, i));
        break;
      case 'english':
        questions.push(generateEnglishQuestion(config, i));
        break;
      default:
        questions.push(generateMathQuestion(config, i));
    }
  }

  return questions;
}
