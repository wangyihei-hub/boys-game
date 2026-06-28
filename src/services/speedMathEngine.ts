export type MathOperator = '+' | '-' | '*' | '/';

export interface SpeedMathProblem {
  a: number;
  b: number;
  operator: MathOperator;
  answer: number;
}

export type SpeedMathRank = 'S' | 'A' | 'B' | 'C';

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function generateSpeedMathProblem(): SpeedMathProblem {
  const operators: MathOperator[] = ['+', '-', '*', '/'];
  const operator = operators[Math.floor(Math.random() * operators.length)];

  switch (operator) {
    case '+': {
      const a = randomInt(2, 50);
      const b = randomInt(2, 50);
      return { a, b, operator, answer: a + b };
    }
    case '-': {
      const a = randomInt(10, 80);
      const b = randomInt(2, a - 1);
      return { a, b, operator, answer: a - b };
    }
    case '*': {
      const a = randomInt(2, 12);
      const b = randomInt(2, 12);
      return { a, b, operator, answer: a * b };
    }
    case '/': {
      const b = randomInt(2, 12);
      const answer = randomInt(2, 12);
      const a = b * answer;
      return { a, b, operator, answer };
    }
  }
}

export function formatSpeedMathProblem(problem: SpeedMathProblem): string {
  const symbol: Record<MathOperator, string> = { '+': '+', '-': '-', '*': '×', '/': '÷' };
  return `${problem.a} ${symbol[problem.operator]} ${problem.b}`;
}

export function calculateSpeedMathRank(correct: number, totalTimeSeconds: number): SpeedMathRank {
  if (correct >= 10 && totalTimeSeconds <= 60) return 'S';
  if (correct >= 8 && totalTimeSeconds <= 90) return 'A';
  if (correct >= 5) return 'B';
  return 'C';
}

export function getSpeedMathRankReward(rank: SpeedMathRank): number {
  switch (rank) {
    case 'S': return 10;
    case 'A': return 6;
    case 'B': return 3;
    case 'C': return 1;
  }
}
