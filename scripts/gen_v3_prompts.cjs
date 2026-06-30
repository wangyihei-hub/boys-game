const fs = require('fs');
const batches = JSON.parse(fs.readFileSync('scripts/v3_batches.json', 'utf8'));
const subjectNames = { chinese: '语文', math: '数学', english: '英语' };
const idPrefixes = { chinese: 'c', math: 'm', english: 'e' };
const prompts = batches.map(b => {
  const bossReq = b.subject === 'english'
    ? `## Boss 要求\n- 奇数关：一篇 80-120 词英文短文 + 5 道选择题（id 如 e-L011-BOSS-1 ... e-L011-BOSS-5）\n- 偶数关：一段 5-7 轮英文情景对话 + 5 道选择题\n- Boss 短文/对话内容要与本关 topic 相关\n- 每个 level JSON 包含 "boss" 字段：{"prompt":"...","parts":[5道choice小题]}\n`
    : `## Boss\n本批只生成普通题，Boss 后续统一处理。每个 level JSON 不要包含 boss 字段。\n`;
  const filePaths = b.levels.map(l => `   /d/coder/boys-game/src/data/v3/bank/${b.subject}/L${String(l.level).padStart(3, '0')}.json`).join('\n');
  return {
    name: `${b.subject}_L${String(b.start).padStart(3, '0')}_L${String(b.end).padStart(3, '0')}`,
    prompt: `你是一个小学 4-5 年级${subjectNames[b.subject]}题库出题专家。\n\n你的任务：根据下面 ${b.levels.length} 关的知识点大纲，每关生成 30 道原创普通题（四选一或填空），落盘到指定 JSON 文件。\n\n## 输入大纲\n${JSON.stringify(b.levels, null, 2)}\n\n## 输出要求\n1. 每关恰好 30 道普通题。\n2. 选择题 ≥ 18 道，填空题 ≤ 12 道。\n3. 每道选择题 4 个选项，answer 为正确选项的 0-based 索引（0/1/2/3）。\n4. 填空题 answer 为字符串答案。\n5. 难度配比：约 70% 当前关难度 + 20% 低一档 + 10% 高一档。\n6. 题面原创，符合小学 4-5 年级期中/期末考试真题风格。\n7. 每题给出 explanation（简短解析）。\n8. 落盘路径（使用 Write 工具）：\n${filePaths}\n\n## 每个文件 JSON 结构\n{\n  "level": ${b.levels[0].level},\n  "subject": "${b.subject}",\n  "topic": "${b.levels[0].topic}",\n  "difficulty": ${b.levels[0].difficulty},\n  "questions": [\n    {\n      "id": "${idPrefixes[b.subject]}-L${String(b.levels[0].level).padStart(3, '0')}-Q01",\n      "type": "choice",\n      "question": "...",\n      "options": ["...","...","...","..."],\n      "answer": 0,\n      "explanation": "..."\n    },\n    ...\n  ]\n}\n\nid 规则：${idPrefixes[b.subject]}-L{三位关卡号}-Q{两位题号}。\nsubject 固定为 "${b.subject}"。\n\n${bossReq}\n## 重要\n- 填空题 type 字段值固定为 "fillblank"；选择题 type 字段值固定为 "choice"。\n- 选择题必须提供 4 个选项，选项本身不要带 A/B/C/D 前缀。\n- 答案必须正确，解析要与答案一致。\n- 使用 Write 工具直接落盘 ${b.levels.length} 个文件。不要返回 JSON 字符串给我。\n\n完成后汇报：生成了哪些文件、每文件多少题、是否有异常。`
  };
});
fs.writeFileSync('scripts/v3_prompts.json', JSON.stringify(prompts, null, 2));
console.log('prompts:', prompts.length);
