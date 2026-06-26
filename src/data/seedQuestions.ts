import type { Question } from '../types';

const now = Date.now();

function q(partial: Omit<Question, 'id' | 'generatedAt'>): Question {
  return {
    ...partial,
    id: `seed-${partial.subject}-${partial.difficulty}-${partial.question.slice(0, 8)}`,
    generatedAt: now
  };
}

export const SEED_QUESTIONS: Question[] = [
  // 语文 难度1
  q({
    subject: 'chinese',
    topic: '字词理解',
    difficulty: 1,
    type: 'choice',
    question: '“高兴”的近义词是？',
    options: ['难过', '快乐', '生气', '害怕'],
    answer: 1,
    explanation: '“高兴”和“快乐”都表示心情愉快。'
  }),
  q({
    subject: 'chinese',
    topic: '成语运用',
    difficulty: 1,
    type: 'choice',
    question: '形容读书多、学问大的成语是？',
    options: ['井底之蛙', '学富五车', '守株待兔', '拔苗助长'],
    answer: 1,
    explanation: '“学富五车”形容读书多，学识渊博。'
  }),
  q({
    subject: 'chinese',
    topic: '古诗文填空',
    difficulty: 1,
    type: 'fillblank',
    question: '床前明月光，疑是地上___。',
    answer: '霜',
    explanation: '出自李白《静夜思》：床前明月光，疑是地上霜。'
  }),

  // 语文 难度2
  q({
    subject: 'chinese',
    topic: '成语运用',
    difficulty: 2,
    type: 'choice',
    question: '“他做事总是____，从不半途而废。”应填入？',
    options: ['三心二意', '有始有终', '半途而废', '虎头蛇尾'],
    answer: 1,
    explanation: '“有始有终”指做事能坚持到底。'
  }),
  q({
    subject: 'chinese',
    topic: '阅读理解',
    difficulty: 2,
    type: 'choice',
    question: '“春蚕到死丝方尽”常用来比喻什么？',
    options: ['无私奉献', '胆小怕事', '贪生怕死', '骄傲自满'],
    answer: 0,
    explanation: '这句诗常用来赞美默默奉献、直到生命最后一刻的精神。'
  }),
  q({
    subject: 'chinese',
    topic: '古诗文填空',
    difficulty: 2,
    type: 'fillblank',
    question: '春眠不觉晓，处处闻啼___。',
    answer: '鸟',
    explanation: '出自孟浩然《春晓》：春眠不觉晓，处处闻啼鸟。'
  }),

  // 语文 难度3
  q({
    subject: 'chinese',
    topic: '阅读理解',
    difficulty: 3,
    type: 'choice',
    question: '下列句子中运用了拟人修辞的是？',
    options: ['小草从土里钻出来。', '他跑得像风一样快。', '月亮像圆盘。', '这本书很厚。'],
    answer: 0,
    explanation: '“小草从土里钻出来”把草当作人来写，赋予它人的动作。'
  }),
  q({
    subject: 'chinese',
    topic: '成语运用',
    difficulty: 3,
    type: 'choice',
    question: '“画龙点睛”比喻？',
    options: ['画画很好', '在关键处加上精辟的一笔', '眼睛画得很像', '浪费笔墨'],
    answer: 1,
    explanation: '“画龙点睛”比喻在关键地方加上精辟语句，使内容更生动传神。'
  }),

  // 数学 难度1
  q({
    subject: 'math',
    topic: '四则运算',
    difficulty: 1,
    type: 'choice',
    question: '25 + 17 = ?',
    options: ['40', '41', '42', '43'],
    answer: 2,
    explanation: '25 + 17 = 42。'
  }),
  q({
    subject: 'math',
    topic: '四则运算',
    difficulty: 1,
    type: 'choice',
    question: '6 × 7 = ?',
    options: ['42', '36', '48', '54'],
    answer: 0,
    explanation: '根据乘法口诀，六七四十二。'
  }),
  q({
    subject: 'math',
    topic: '分数小数',
    difficulty: 1,
    type: 'choice',
    question: '0.5 等于几分之几？',
    options: ['1/3', '1/2', '1/4', '2/3'],
    answer: 1,
    explanation: '0.5 = 1/2。'
  }),

  // 数学 难度2
  q({
    subject: 'math',
    topic: '四则运算',
    difficulty: 2,
    type: 'choice',
    question: '123 - 45 + 28 = ?',
    options: ['96', '106', '116', '126'],
    answer: 1,
    explanation: '123 - 45 = 78，78 + 28 = 106。'
  }),
  q({
    subject: 'math',
    topic: '简单方程',
    difficulty: 2,
    type: 'choice',
    question: '如果 3x = 27，那么 x = ?',
    options: ['6', '7', '8', '9'],
    answer: 3,
    explanation: '两边同时除以 3，x = 27 ÷ 3 = 9。'
  }),
  q({
    subject: 'math',
    topic: '应用题',
    difficulty: 2,
    type: 'choice',
    question: '小明有 48 元，买了 6 本笔记本，每本多少钱？',
    options: ['6元', '7元', '8元', '9元'],
    answer: 2,
    explanation: '48 ÷ 6 = 8（元）。'
  }),

  // 数学 难度3
  q({
    subject: 'math',
    topic: '应用题',
    difficulty: 3,
    type: 'choice',
    question: '一辆汽车 3 小时行驶 180 千米，平均每小时行驶多少千米？',
    options: ['50', '60', '70', '80'],
    answer: 1,
    explanation: '速度 = 路程 ÷ 时间 = 180 ÷ 3 = 60 千米/小时。'
  }),
  q({
    subject: 'math',
    topic: '分数小数',
    difficulty: 3,
    type: 'choice',
    question: '1/4 + 1/2 = ?',
    options: ['1/6', '2/6', '3/4', '1'],
    answer: 2,
    explanation: '1/2 = 2/4，所以 1/4 + 2/4 = 3/4。'
  }),

  // 英语 难度1
  q({
    subject: 'english',
    topic: '词汇选择',
    difficulty: 1,
    type: 'choice',
    question: '"Apple" 是什么意思？',
    options: ['香蕉', '苹果', '橙子', '葡萄'],
    answer: 1,
    explanation: 'Apple 是苹果。'
  }),
  q({
    subject: 'english',
    topic: '词汇选择',
    difficulty: 1,
    type: 'choice',
    question: 'I ___ a student.',
    options: ['is', 'am', 'are', 'be'],
    answer: 1,
    explanation: '第一人称 I 搭配 am。'
  }),
  q({
    subject: 'english',
    topic: '情景对话',
    difficulty: 1,
    type: 'choice',
    question: '早上见到老师，你应该说：',
    options: ['Good night.', 'Good morning.', 'Goodbye.', 'Thank you.'],
    answer: 1,
    explanation: '早上问候用 Good morning。'
  }),

  // 英语 难度2
  q({
    subject: 'english',
    topic: '语法填空',
    difficulty: 2,
    type: 'fillblank',
    question: 'She ___ (like/likes) reading books.',
    answer: 'likes',
    explanation: '第三人称单数 She 后面的动词要加 -s。'
  }),
  q({
    subject: 'english',
    topic: '词汇选择',
    difficulty: 2,
    type: 'choice',
    question: '"Beautiful" 的反义词是？',
    options: ['big', 'small', 'ugly', 'happy'],
    answer: 2,
    explanation: 'Beautiful（美丽）的反义词是 ugly（丑陋）。'
  }),
  q({
    subject: 'english',
    topic: '情景对话',
    difficulty: 2,
    type: 'choice',
    question: '当别人对你说 "Thank you"，你应该回答：',
    options: ['Sorry.', 'You\'re welcome.', 'Hello.', 'Goodbye.'],
    answer: 1,
    explanation: '回应感谢用 You\'re welcome（不客气）。'
  }),

  // 英语 难度3
  q({
    subject: 'english',
    topic: '语法填空',
    difficulty: 3,
    type: 'fillblank',
    question: 'Yesterday I ___ (go/went) to the park.',
    answer: 'went',
    explanation: 'Yesterday 表示过去，动词用过去式 went。'
  }),
  q({
    subject: 'english',
    topic: '阅读理解',
    difficulty: 3,
    type: 'choice',
    question: '"Tom is taller than Jim." 这句话的意思是？',
    options: ['Tom 比 Jim 矮。', 'Tom 和 Jim 一样高。', 'Tom 比 Jim 高。', 'Jim 比 Tom 高。'],
    answer: 2,
    explanation: 'taller than 表示“比……高”。'
  })
];

export function getSeedQuestionsBySubjectAndDifficulty(
  subject: Question['subject'],
  difficulty: Question['difficulty']
): Question[] {
  return SEED_QUESTIONS.filter(q => q.subject === subject && q.difficulty === difficulty);
}
