export type GomokuCell = 0 | 1 | 2;
export type GomokuWinner = 0 | 1 | 2 | 'draw';

const BOARD_SIZE = 15;
const DIRECTIONS = [
  [1, 0], // horizontal
  [0, 1], // vertical
  [1, 1], // diagonal
  [1, -1] // anti-diagonal
];

export function createEmptyBoard(size = BOARD_SIZE): GomokuCell[][] {
  return Array.from({ length: size }, () => Array.from({ length: size }, () => 0 as GomokuCell));
}

export function getWinner(board: GomokuCell[][]): GomokuWinner {
  const size = board.length;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const player = board[r][c];
      if (player === 0) continue;

      for (const [dr, dc] of DIRECTIONS) {
        let count = 1;
        let nr = r + dr;
        let nc = c + dc;
        while (nr >= 0 && nr < size && nc >= 0 && nc < size && board[nr][nc] === player) {
          count++;
          nr += dr;
          nc += dc;
        }
        if (count >= 5) return player as GomokuWinner;
      }
    }
  }

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) return 0;
    }
  }

  return 'draw';
}

export function cloneBoard(board: GomokuCell[][]): GomokuCell[][] {
  return board.map(row => [...row]);
}

export function applyMove(board: GomokuCell[][], row: number, col: number, player: 1 | 2): GomokuCell[][] {
  const next = cloneBoard(board);
  next[row][col] = player;
  return next;
}

export function getValidMoves(board: GomokuCell[][]): { row: number; col: number }[] {
  const size = board.length;
  const moves: { row: number; col: number }[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      if (board[r][c] === 0) moves.push({ row: r, col: c });
    }
  }
  return moves;
}

function evaluateLine(line: GomokuCell[], player: 1 | 2): number {
  const opponent = player === 1 ? 2 : 1;
  let score = 0;

  for (let i = 0; i <= line.length - 5; i++) {
    let own = 0;
    let opp = 0;
    let empty = 0;
    for (let j = 0; j < 5; j++) {
      const cell = line[i + j];
      if (cell === player) own++;
      else if (cell === opponent) opp++;
      else empty++;
    }

    if (own > 0 && opp > 0) continue;
    if (own === 5) score += 100000;
    else if (own === 4 && empty === 1) score += 10000;
    else if (own === 3 && empty === 2) score += 1000;
    else if (own === 2 && empty === 3) score += 100;
    else if (own === 1 && empty === 4) score += 10;

    if (opp === 4 && empty === 1) score -= 9000;
    else if (opp === 3 && empty === 2) score -= 500;
    else if (opp === 2 && empty === 3) score -= 50;
  }

  return score;
}

function evaluateBoard(board: GomokuCell[][], player: 1 | 2): number {
  const size = board.length;
  let score = 0;

  // Rows
  for (let r = 0; r < size; r++) {
    score += evaluateLine(board[r], player);
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const line: GomokuCell[] = [];
    for (let r = 0; r < size; r++) line.push(board[r][c]);
    score += evaluateLine(line, player);
  }

  // Diagonals
  for (let start = 0; start < size; start++) {
    const diag1: GomokuCell[] = [];
    const diag2: GomokuCell[] = [];
    const diag3: GomokuCell[] = [];
    const diag4: GomokuCell[] = [];
    for (let k = 0; k < size - start; k++) {
      diag1.push(board[start + k][k]);
      diag2.push(board[k][start + k]);
      diag3.push(board[start + k][size - 1 - k]);
      diag4.push(board[k][size - 1 - start - k]);
    }
    if (diag1.length >= 5) score += evaluateLine(diag1, player);
    if (diag2.length >= 5 && start > 0) score += evaluateLine(diag2, player);
    if (diag3.length >= 5) score += evaluateLine(diag3, player);
    if (diag4.length >= 5 && start > 0) score += evaluateLine(diag4, player);
  }

  return score;
}

function minimax(
  board: GomokuCell[][],
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  aiPlayer: 1 | 2,
  humanPlayer: 1 | 2
): number {
  const winner = getWinner(board);
  if (winner === aiPlayer) return 1000000;
  if (winner === humanPlayer) return -1000000;
  if (winner === 'draw') return 0;
  if (depth === 0) return evaluateBoard(board, aiPlayer);

  const moves = getValidMoves(board);
  // Limit branching factor for performance while keeping moves near existing stones
  const candidateMoves = moves.slice(0, Math.min(moves.length, 20));

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of candidateMoves) {
      const nextBoard = applyMove(board, move.row, move.col, aiPlayer);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, false, aiPlayer, humanPlayer);
      maxEval = Math.max(maxEval, evalScore);
      alpha = Math.max(alpha, evalScore);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of candidateMoves) {
      const nextBoard = applyMove(board, move.row, move.col, humanPlayer);
      const evalScore = minimax(nextBoard, depth - 1, alpha, beta, true, aiPlayer, humanPlayer);
      minEval = Math.min(minEval, evalScore);
      beta = Math.min(beta, evalScore);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function findBestMove(board: GomokuCell[][], aiPlayer: 1 | 2, depth = 2): { row: number; col: number } | null {
  const moves = getValidMoves(board);
  if (moves.length === 0) return null;

  // Opening: prefer center
  const center = Math.floor(board.length / 2);
  if (board[center][center] === 0 && moves.length > board.length * board.length - 5) {
    return { row: center, col: center };
  }

  const humanPlayer = aiPlayer === 1 ? 2 : 1;
  let bestMove = moves[0];
  let bestScore = -Infinity;

  for (const move of moves.slice(0, Math.min(moves.length, 20))) {
    const nextBoard = applyMove(board, move.row, move.col, aiPlayer);
    const score = minimax(nextBoard, depth - 1, -Infinity, Infinity, false, aiPlayer, humanPlayer);
    if (score > bestScore) {
      bestScore = score;
      bestMove = move;
    }
  }

  return bestMove;
}
