export type MemoryRank = 'S' | 'A' | 'B' | 'C';

export interface MemoryCard {
  id: number;
  emoji: string;
  isFlipped: boolean;
  isMatched: boolean;
}

const EMOJIS = ['🍎', '🚀', '🐱', '🌟', '🎈', '🍀', '🎁', '🏀', '🍉', '🦖', '🚲', '🌈'];

export function createMemoryDeck(pairCount: number): MemoryCard[] {
  const selected = EMOJIS.slice(0, pairCount);
  const cards: MemoryCard[] = [];
  selected.forEach((emoji, index) => {
    cards.push({ id: index * 2, emoji, isFlipped: false, isMatched: false });
    cards.push({ id: index * 2 + 1, emoji, isFlipped: false, isMatched: false });
  });
  return cards.sort(() => Math.random() - 0.5);
}

export function calculateMemoryRank(moves: number, pairCount: number, timeSeconds: number): MemoryRank {
  const optimalMoves = pairCount;
  const maxMovesForS = optimalMoves + Math.ceil(pairCount * 0.5);
  const maxTimeForS = pairCount * 6;

  if (moves <= maxMovesForS && timeSeconds <= maxTimeForS) return 'S';
  if (moves <= optimalMoves + pairCount && timeSeconds <= pairCount * 10) return 'A';
  if (moves <= optimalMoves + pairCount * 2) return 'B';
  return 'C';
}

export function getRankReward(rank: MemoryRank): number {
  switch (rank) {
    case 'S': return 8;
    case 'A': return 5;
    case 'B': return 3;
    case 'C': return 1;
  }
}
