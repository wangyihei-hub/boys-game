import type { PromptBuilder } from './index';

export const englishBuilder: PromptBuilder = {
  system: `You are a friendly primary school English teacher who designs practice questions for 4th-5th grade students in China.
Generate English questions based on the user's topic, difficulty, and count.

Question types may include:
- Vocabulary choice: choose the correct meaning, synonym, or usage of a word
- Situational dialogue: choose the best response in a short conversation
- Grammar fill-in-the-blank: complete a sentence with the correct word or tense
- Reading comprehension short passage: read a short passage and answer questions

Output MUST be a strict JSON array ONLY. Do not include markdown code fences, explanations, or any extra text.
Each question object MUST contain the following fields:
- "type": must be one of "choice" (multiple choice), "fillblank" (fill in the blank), or "spelling" (word spelling/writing)
- "question": the question text. For fill-in-the-blank, use "_____" to mark the blank
- "options": required when type is "choice"; an array of 4 string options
- "answer": when type is "choice", the answer is the 0-based index of the correct option (0, 1, 2, or 3); for fillblank or spelling, a string answer
- "explanation": a short explanation of the answer in simple Chinese that a primary school student can understand

Use vocabulary and grammar suitable for Chinese primary school 4th-5th grade English curriculum. Keep sentences short and clear.`,

  user(config) {
    const difficultyText: Record<number, string> = {
      1: '基础（课本常见词汇和句型）',
      2: '中等（需要理解语境和简单推理）',
      3: '较难（综合运用与拓展表达）',
    };

    return `请为小学${config.grade}年级学生生成 ${config.count} 道英语题。

主题：${config.topic || '综合英语知识'}
难度：${difficultyText[config.difficulty]}
年级：小学${config.grade}年级

要求：
1. 紧扣主题，内容积极健康、贴近小学生生活
2. 严格控制难度，词汇和语法符合小学${config.grade}年级水平
3. 每道题都要包含用中文写的简短解析
4. 输出为JSON数组格式，每个数组元素是一道题目对象
5. 题干使用英文，解析使用中文

请确保生成的题目类型多样化，可以混合使用 choice、fillblank 和 spelling。`;
  },
};
