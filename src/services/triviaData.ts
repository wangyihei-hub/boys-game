export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: 'nature' | 'history' | 'science' | 'geography' | 'culture';
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: 't1',
    question: '太阳系中最大的行星是哪一颗？',
    options: ['地球', '木星', '土星', '火星'],
    correctIndex: 1,
    explanation: '木星是太阳系中体积和质量最大的行星。',
    category: 'science'
  },
  {
    id: 't2',
    question: '中国的首都是哪里？',
    options: ['上海', '广州', '北京', '深圳'],
    correctIndex: 2,
    explanation: '北京是中华人民共和国的首都。',
    category: 'geography'
  },
  {
    id: 't3',
    question: '水的化学式是什么？',
    options: ['CO₂', 'O₂', 'H₂O', 'NaCl'],
    correctIndex: 2,
    explanation: '水由两个氢原子和一个氧原子组成，化学式为 H₂O。',
    category: 'science'
  },
  {
    id: 't4',
    question: '一年有多少个节气？',
    options: ['12', '24', '36', '48'],
    correctIndex: 1,
    explanation: '中国传统二十四节气对应一年四季的变化。',
    category: 'culture'
  },
  {
    id: 't5',
    question: '长颈鹿的脖子为什么很长？',
    options: ['方便打架', '够到高处树叶', '呼吸更多空气', '看起来更高'],
    correctIndex: 1,
    explanation: '长颈鹿的长脖子帮助它们吃到高处的树叶。',
    category: 'nature'
  },
  {
    id: 't6',
    question: '世界上最高的山峰是？',
    options: ['泰山', '珠穆朗玛峰', '富士山', '阿尔卑斯山'],
    correctIndex: 1,
    explanation: '珠穆朗玛峰海拔约 8848 米，是世界最高峰。',
    category: 'geography'
  },
  {
    id: 't7',
    question: '中国古代四大发明不包括以下哪项？',
    options: ['造纸术', '指南针', '火药', '地动仪'],
    correctIndex: 3,
    explanation: '四大发明是造纸术、印刷术、指南针和火药。',
    category: 'history'
  },
  {
    id: 't8',
    question: '彩虹通常有哪几种颜色？',
    options: ['红橙黄绿青蓝紫', '红黄蓝', '黑白灰', '金银铜'],
    correctIndex: 0,
    explanation: '阳光经过水滴折射后形成七色光谱。',
    category: 'science'
  },
  {
    id: 't9',
    question: '蜜蜂采蜜是为了？',
    options: ['好玩', '制作蜂蜜', '清洁花朵', '吸引蝴蝶'],
    correctIndex: 1,
    explanation: '蜜蜂把花蜜带回蜂巢酿造成蜂蜜储存食物。',
    category: 'nature'
  },
  {
    id: 't10',
    question: '中国的国宝动物是？',
    options: ['老虎', '金丝猴', '大熊猫', '丹顶鹤'],
    correctIndex: 2,
    explanation: '大熊猫是中国特有的珍稀动物，被称为国宝。',
    category: 'culture'
  },
  {
    id: 't11',
    question: '一天有多少小时？',
    options: ['12', '24', '36', '48'],
    correctIndex: 1,
    explanation: '地球自转一周约为 24 小时。',
    category: 'science'
  },
  {
    id: 't12',
    question: '下列哪种水果富含维生素 C？',
    options: ['香蕉', '橙子', '西瓜', '葡萄'],
    correctIndex: 1,
    explanation: '橙子等柑橘类水果富含维生素 C。',
    category: 'nature'
  },
  {
    id: 't13',
    question: '《西游记》的作者是？',
    options: ['罗贯中', '施耐庵', '吴承恩', '曹雪芹'],
    correctIndex: 2,
    explanation: '吴承恩是明代小说家，《西游记》的作者。',
    category: 'culture'
  },
  {
    id: 't14',
    question: '地球绕着什么转？',
    options: ['月亮', '太阳', '火星', '自己'],
    correctIndex: 1,
    explanation: '地球围绕太阳公转，公转一周为一年。',
    category: 'science'
  },
  {
    id: 't15',
    question: '中秋节人们常吃什么？',
    options: ['粽子', '月饼', '汤圆', '饺子'],
    correctIndex: 1,
    explanation: '中秋节有吃月饼、赏月的传统习俗。',
    category: 'culture'
  }
];

export function getTriviaQuestions(count = 10): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
