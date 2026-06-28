// A curated list of common Chinese two-character words suitable for word-chain games.
export const WORD_DICTIONARY: string[] = [
  '天空', '空气', '气球', '球赛', '赛跑', '跑步', '步入', '入口', '口红', '红色',
  '色彩', '彩虹', '虹桥', '桥梁', '梁柱', '柱子', '子女', '女儿', '儿童', '童话',
  '话语', '语文', '文学', '学习', '习惯', '惯性', '性格', '格外', '外面', '面包',
  '包围', '围巾', '毛巾', '金牌', '牌照', '照片', '电影', '影视', '视线', '线路',
  '路灯', '灯光', '光明', '明天', '天气', '气温', '温暖', '暖气', '气球', '球门',
  '门口', '口袋', '袋鼠', '鼠标', '标准', '准备', '备课', '课本', '本来', '来往',
  '往事', '事情', '情况', '况且', '且慢', '慢慢', '快慢', '快递', '递送', '送信',
  '信封', '封闭', '闭幕', '幕后', '后面', '面条', '条理', '理由', '由于', '于是',
  '是非', '非常', '常见', '见面', '面容', '容易', '易发', '发现', '现在', '在家',
  '家庭', '庭院', '院长', '长大', '大海', '海水', '水果', '果园', '园林', '林子',
  '子孙', '孙女', '女生', '生活', '活动', '动物', '物体', '体重', '重量', '量杯',
  '杯子', '子女', '子孙', '松树', '树木', '木头', '头脑', '脑袋', '袋子', '子孙',
  '孙辈', '辈分', '分开', '开始', '始终', '终于', '于是', '是非', '非洲', '洲际',
  '亚洲', '深圳', '深圳', '江面', '面条', '条理', '理论', '论文', '文化', '化妆',
  '妆点', '点头', '头发', '发现', '现金', '金钱', '钱包', '包容', '容易', '易如',
  '如此', '此事', '事件', '件数', '数学', '学习', '习题', '题目', '目标', '标准'
];

export function getRandomStartWord(): string {
  return WORD_DICTIONARY[Math.floor(Math.random() * WORD_DICTIONARY.length)];
}

export function findChainResponse(word: string): string | null {
  const lastChar = word.slice(-1);
  const candidates = WORD_DICTIONARY.filter(w => w.length >= 2 && w[0] === lastChar);
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

export function isValidChainWord(prevWord: string, nextWord: string, usedWords: Set<string>): boolean {
  if (nextWord.length < 2) return false;
  if (usedWords.has(nextWord)) return false;
  return nextWord[0] === prevWord.slice(-1) && WORD_DICTIONARY.includes(nextWord);
}
