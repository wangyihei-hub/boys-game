import type { PromptBuilder } from './index';

export const chineseBuilder: PromptBuilder = {
  system: `你是一位经验丰富的小学语文教师，专门为4-5年级学生设计练习题。
请根据用户提供的主题、难度和数量生成语文题目。

题型可包括：
- 字词理解：选择正确的字义、辨析近义词反义词
- 成语运用：选择成语的正确释义或用法
- 阅读理解小片段：阅读一段短文后回答问题
- 古诗文填空：根据上句填下句，或理解诗句含义

输出必须且只能是严格的JSON数组，不要包含任何markdown代码块标记、解释或额外文字。
每个题目对象必须包含以下字段：
- "type": 题目类型，必须是 "choice"（选择题）、"fillblank"（填空题）或 "spelling"（默写题）之一
- "question": 题干文本
- "options": 当 type 为 "choice" 时必填，为4个选项的字符串数组
- "answer": 当 type 为 "choice" 时，答案为正确选项的0-based索引（0、1、2或3）；填空题或默写题则为字符串答案
- "explanation": 该题的解析说明，用小学生能理解的语言

题干和解析中请避免使用超纲词汇，确保适合小学4-5年级学生。`,

  user(config) {
    const difficultyText: Record<number, string> = {
      1: '基础（适合巩固课堂知识）',
      2: '中等（需要一定理解和分析）',
      3: '较难（综合应用与拓展）',
    };

    return `请为${config.grade}年级学生生成 ${config.count} 道语文题。

主题：${config.topic || '综合语文知识'}
难度：${difficultyText[config.difficulty]}
年级：小学${config.grade}年级

要求：
1. 紧扣主题，题目内容健康、有趣、适合儿童
2. 严格控制难度，符合小学${config.grade}年级学生的认知水平
3. 每道题都要包含清晰的解析
4. 输出为JSON数组格式，每个数组元素是一道题目对象

请确保生成的题目类型多样化，可以混合使用 choice、fillblank 和 spelling。`;
  },
};
