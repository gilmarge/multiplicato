import { GameBoard, GameLevel, Player, Scores, CellData, WinningLine, Coordinate, AiMove, AiDifficulty } from './types';
import { LEVEL_CONFIG, POINTS_MAP } from './constants';

export const generateBoard = (level: GameLevel, gridSize: number, numPlayers: number): GameBoard => {
  let { attackerRange, defenderRange } = { ...LEVEL_CONFIG[level] };

  if (numPlayers === 3) {
    attackerRange = { ...attackerRange, min: Math.max(attackerRange.min, 4) };
    defenderRange = { ...defenderRange, min: Math.max(defenderRange.min, 4) };
  }
  
  const products: number[] = [];
  for (let i = attackerRange.min; i <= attackerRange.max; i++) {
    for (let j = defenderRange.min; j <= defenderRange.max; j++) {
      products.push(i * j);
    }
  }

  let productPool: number[];
  const uniqueProducts = Array.from(new Set(products));

  if (numPlayers === 3) {
    // For 3 players, use each unique product up to twice.
    productPool = [...uniqueProducts, ...uniqueProducts];
  } else {
    // For 2 players, use unique products.
    productPool = uniqueProducts;
  }
  
  const shuffledProducts = productPool.sort(() => 0.5 - Math.random());
  
  let boardNumbers = shuffledProducts.slice(0, gridSize * gridSize);

  // For 3 players, ensure there are no zeros if the pool was too small.
  if (numPlayers === 3 && boardNumbers.length < gridSize * gridSize) {
    const needed = gridSize * gridSize - boardNumbers.length;
    if (uniqueProducts.length > 0) {
      for (let i = 0; i < needed; i++) {
        boardNumbers.push(uniqueProducts[i % uniqueProducts.length]);
      }
    }
  }


  const board: GameBoard = [];
  for (let i = 0; i < gridSize; i++) {
    const row: CellData[] = [];
    for (let j = 0; j < gridSize; j++) {
      row.push({
        number: boardNumbers[i * gridSize + j] || 0,
        owner: null,
      });
    }
    board.push(row);
  }
  return board;
};

const scoreLine = (line: (Player | null)[]): Partial<Scores> => {
    const scores: Partial<Scores> = {};
    let i = 0;
    while (i < line.length) {
        const player = line[i];
        if (player === null) {
            i++;
            continue;
        }

        let j = i;
        while (j < line.length && line[j] === player) {
            j++;
        }

        const streakLength = j - i;
        if (streakLength >= 3) {
            const points = POINTS_MAP[Math.min(streakLength, 5)];
            if (points) {
               scores[player] = (scores[player] || 0) + points;
            }
        }
        i = j;
    }
    return scores;
};

export const calculateScores = (board: GameBoard): Scores => {
  const totalScores: Scores = { Rouge: 0, Bleu: 0, Vert: 0 };
  if (board.length === 0) return totalScores;
  const size = board.length;

  const updateScores = (lineScores: Partial<Scores>) => {
    for (const player in lineScores) {
      totalScores[player as Player] += lineScores[player as Player]!;
    }
  };

  // Rows
  for (let r = 0; r < size; r++) {
    const row = board[r].map(cell => cell.owner);
    updateScores(scoreLine(row));
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = board.map(row => row[c].owner);
    updateScores(scoreLine(col));
  }

  // Diagonals
  for (let k = 0; k < size * 2 - 1; k++) {
    const d1: (Player|null)[] = [];
    const d2: (Player|null)[] = [];
    for (let j = 0; j <= k; j++) {
      const i = k - j;
      if (i < size && j < size) {
        d1.push(board[i][j].owner);
        d2.push(board[i][size - 1 - j].owner);
      }
    }
    if (d1.length >= 3) updateScores(scoreLine(d1));
    if (d2.length >= 3) updateScores(scoreLine(d2));
  }

  return totalScores;
};


const findLineStreaks = (line: {owner: Player | null, r: number, c: number}[]): WinningLine[] => {
    const winningLines: WinningLine[] = [];
    let i = 0;
    while (i < line.length) {
        const cell = line[i];
        const player = cell.owner;
        if (player === null) {
            i++;
            continue;
        }

        let j = i;
        while (j < line.length && line[j].owner === player) {
            j++;
        }

        const streakLength = j - i;
        if (streakLength >= 3) {
           const coords: Coordinate[] = [];
           for (let k = i; k < j; k++) {
                coords.push({ r: line[k].r, c: line[k].c });
           }
           winningLines.push({ player, coords });
        }
        i = j;
    }
    return winningLines;
};


export const findWinningLines = (board: GameBoard): WinningLine[] => {
  const allLines: WinningLine[] = [];
  if (board.length === 0) return [];
  const size = board.length;

  // Rows
  for (let r = 0; r < size; r++) {
    const row = board[r].map((cell, c) => ({ owner: cell.owner, r, c }));
    allLines.push(...findLineStreaks(row));
  }

  // Columns
  for (let c = 0; c < size; c++) {
    const col = board.map((row, r) => ({ owner: row[c].owner, r, c }));
     allLines.push(...findLineStreaks(col));
  }

  // Diagonals
  for (let k = 0; k < size * 2 - 1; k++) {
    const d1: {owner: Player | null, r: number, c: number}[] = [];
    const d2: {owner: Player | null, r: number, c: number}[] = [];
    for (let c = 0; c <= k; c++) {
      const r = k - c;
      if (r < size && c < size) {
        d1.push({ owner: board[r][c].owner, r, c});
        d2.push({ owner: board[r][size - 1 - c].owner, r, c: size - 1 - c});
      }
    }
     if (d1.length >= 3) allLines.push(...findLineStreaks(d1));
     if (d2.length >= 3) allLines.push(...findLineStreaks(d2));
  }
  
  return allLines;
};

// --- AI Logic ---

export const getValidAiMoves = (board: GameBoard, attackingFactor: number, defenderRange: {min: number, max: number}): AiMove[] => {
    const moves: AiMove[] = [];
    board.forEach((row, r) => {
        row.forEach((cell, c) => {
            if (cell.owner === null) {
                if (cell.number % attackingFactor === 0) {
                    const factor2 = cell.number / attackingFactor;
                    if (factor2 >= defenderRange.min && factor2 <= defenderRange.max) {
                        moves.push({ r, c, factor2 });
                    }
                }
            }
        });
    });
    return moves;
};

export const aiSelectFactor = (availableFactors: number[]): number => {
    // Simple strategy: pick a random factor
    if (availableFactors.length === 0) return 0; // Should not happen if called correctly
    return availableFactors[Math.floor(Math.random() * availableFactors.length)];
};

const aiFindBestMoveLevel1 = (validMoves: AiMove[]): AiMove | null => {
    if (validMoves.length === 0) return null;
    return validMoves[Math.floor(Math.random() * validMoves.length)];
};

const aiFindBestMoveLevel2 = (board: GameBoard, validMoves: AiMove[], aiPlayer: Player): AiMove | null => {
    if (validMoves.length === 0) return null;

    const checkMoveForNewLine = (r: number, c: number) => {
        const tempBoard = JSON.parse(JSON.stringify(board));
        tempBoard[r][c].owner = aiPlayer;
        const newLines = findWinningLines(tempBoard).filter(l => l.player === aiPlayer);
        const originalLines = findWinningLines(board).filter(l => l.player === aiPlayer);
        return newLines.length > originalLines.length;
    };
    
    for (const move of validMoves) {
        if (checkMoveForNewLine(move.r, move.c)) {
            return move;
        }
    }
    
    return validMoves[Math.floor(Math.random() * validMoves.length)];
};


const aiFindBestMoveLevel3 = (
    board: GameBoard, 
    validMoves: AiMove[],
    aiPlayer: Player,
    humanPlayer: Player,
): AiMove | null => {
    if (validMoves.length === 0) return null;
    
    const originalAiLines = findWinningLines(board).filter(l => l.player === aiPlayer);
    const originalHumanLines = findWinningLines(board).filter(l => l.player === humanPlayer);

    const checkMove = (r: number, c: number, player: Player) => {
        const tempBoard = JSON.parse(JSON.stringify(board)); // Deep copy
        tempBoard[r][c].owner = player;
        const newLines = findWinningLines(tempBoard).filter(l => l.player === player);
        const originalLines = player === aiPlayer ? originalAiLines : originalHumanLines;
        return newLines.length > originalLines.length;
    };

    // 1. Find a winning move for the AI
    for (const move of validMoves) {
        if (checkMove(move.r, move.c, aiPlayer)) {
            return move;
        }
    }

    // 2. Find a move to block the human from winning
    for (const move of validMoves) {
        if (checkMove(move.r, move.c, humanPlayer)) {
            return move;
        }
    }
    
    // 3. Fallback to a random valid move
    return validMoves[Math.floor(Math.random() * validMoves.length)];
};


export const findBestAiMove = (
    board: GameBoard, 
    attackingFactor: number, 
    defenderRange: { min: number, max: number },
    aiPlayer: Player,
    opponents: Player[],
    difficulty: AiDifficulty
): AiMove | null => {
    const validMoves = getValidAiMoves(board, attackingFactor, defenderRange);
    if (validMoves.length === 0) return null;

    switch (difficulty) {
        case 1:
            return aiFindBestMoveLevel1(validMoves);
        case 2:
            return aiFindBestMoveLevel2(board, validMoves, aiPlayer);
        case 3:
        default:
            const primaryOpponent = opponents[0]; // Simple: block the first opponent
            if (!primaryOpponent) return aiFindBestMoveLevel1(validMoves); // No opponents, play random
            return aiFindBestMoveLevel3(board, validMoves, aiPlayer, primaryOpponent);
    }
};