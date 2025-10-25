

// Fix: Add React import to resolve UMD global errors.
import React from 'react';
import {
  GameBoard as GameBoardType,
  Player,
  GameLevel,
  GameState,
  Scores,
  Move,
  WinningLine,
  PlayerConfig,
} from './types.ts';
import {
  generateBoard,
  calculateBonusForMove,
  findWinningLines,
  aiSelectFactor,
  findBestAiMove,
} from './utils.ts';
import { LEVEL_CONFIG } from './constants.ts';

import GameBoardComponent from './components/GameBoard.tsx';
import PlayerPanel from './components/PlayerPanel.tsx';
import FactorModal from './components/FactorModal.tsx';
import RulesModal from './components/RulesModal.tsx';
import GameControls from './components/GameControls.tsx';
import AiControlModal from './components/AiControlModal.tsx';
import PrintableGrid from './components/PrintableGrid.tsx';
import FlyingPoint from './components/FlyingPoint.tsx';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

interface FlyingPointState {
    id: string;
    from: { x: number; y: number };
    to: { x: number; y: number };
    delay: number;
    onComplete: (id: string) => void;
}

const App: React.FC = () => {
    // Game State
    const [gameState, setGameState] = React.useState<GameState>('setup');
    const [numPlayers, setNumPlayers] = React.useState(2);
    const [players, setPlayers] = React.useState<Player[]>(['Rouge', 'Bleu']);
    const [scores, setScores] = React.useState<Scores>({ Rouge: 0, Bleu: 0, Vert: 0 });
    const [board, setBoard] = React.useState<GameBoardType>([]);
    const [gameLevel, setGameLevel] = React.useState<GameLevel>(1);
    const [gridSize, setGridSize] = React.useState(5);
    const [moves, setMoves] = React.useState<Move[]>([]);
    const [winningLines, setWinningLines] = React.useState<WinningLine[]>([]);

    // Turn State
    const [currentPlayerIndex, setCurrentPlayerIndex] = React.useState(0);
    const [attacker, setAttacker] = React.useState<Player | null>(null);
    const [defender, setDefender] = React.useState<Player | null>(null);
    const [attackingFactor, setAttackingFactor] = React.useState<number | null>(null);
    const [selectedCell, setSelectedCell] = React.useState<{ r: number; c: number } | null>(null);

    // UI State
    const [isFactorModalOpen, setIsFactorModalOpen] = React.useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = React.useState(false);
    const [isAiControlModalOpen, setIsAiControlModalOpen] = React.useState(false);
    const [playerToConfigure, setPlayerToConfigure] = React.useState<Player | null>(null);
    const [scorePopup, setScorePopup] = React.useState<{ points: number; r: number; c: number; key: number } | null>(null);
    const [incorrectCell, setIncorrectCell] = React.useState<{ r: number; c: number } | null>(null);
    const [highlightedLines, setHighlightedLines] = React.useState<WinningLine[]>([]);
    const [flyingPoints, setFlyingPoints] = React.useState<FlyingPointState[]>([]);
    
    // Print State
    const [boardForPrint, setBoardForPrint] = React.useState<GameBoardType | null>(null);
    const printContainerRef = React.useRef<HTMLDivElement>(null);

    // Refs for animation
    const playerScoreRefs = {
        Rouge: React.useRef<HTMLSpanElement>(null),
        Bleu: React.useRef<HTMLSpanElement>(null),
        Vert: React.useRef<HTMLSpanElement>(null),
    };
    const gameBoardRef = React.useRef<HTMLDivElement>(null);
    const gridUtilsRef = React.useRef<{
        positioner: (r: number, c: number) => { top: number; left: number };
        cellSize: number;
    } | null>(null);

    // Player Configuration
    const [playerConfigs, setPlayerConfigs] = React.useState<Record<Player, PlayerConfig>>({
        Rouge: { isAi: false, difficulty: 1, name: 'Joueur 1' },
        Bleu: { isAi: false, difficulty: 1, name: 'Joueur 2' },
        Vert: { isAi: false, difficulty: 1, name: 'Joueur 3' },
    });

    const levelConfig = React.useMemo(() => LEVEL_CONFIG[gameLevel], [gameLevel]);

    const availableFactors = React.useMemo(() => {
        const { attackerRange, defenderRange } = levelConfig;
        const allFactors = [];
        for (let i = attackerRange.min; i <= attackerRange.max; i++) {
            allFactors.push(i);
        }

        if (gameState !== 'playing' || board.length === 0) {
            return allFactors;
        }

        const validFactors = [];
        for (const factor1 of allFactors) {
            let isFactorPlayable = false;
            for (const row of board) {
                for (const cell of row) {
                    if (cell.owner === null && cell.number > 0 && cell.number % factor1 === 0) {
                        const factor2 = cell.number / factor1;
                        if (factor2 >= defenderRange.min && factor2 <= defenderRange.max) {
                            isFactorPlayable = true;
                            break; 
                        }
                    }
                }
                if (isFactorPlayable) break;
            }
            if (isFactorPlayable) {
                validFactors.push(factor1);
            }
        }
        return validFactors;
    }, [levelConfig, board, gameState]);
    
    React.useEffect(() => {
        setGridSize(numPlayers === 2 ? 5 : 7);
    }, [numPlayers]);

    const setupRoles = React.useCallback((playerIndex: number) => {
        const currentAttacker = players[playerIndex % players.length];
        const currentDefender = players[(playerIndex + 1) % players.length];
        setAttacker(currentAttacker);
        setDefender(currentDefender);
    }, [players]);

    const handleNewGame = React.useCallback(() => {
        setGameState('setup');
        setBoard([]);
        setScores({ Rouge: 0, Bleu: 0, Vert: 0 });
        setMoves([]);
        setWinningLines([]);
        setCurrentPlayerIndex(0);
        setAttacker(null);
        setDefender(null);
        setAttackingFactor(null);
    }, []);

    const handleStartGame = (num: number, level: GameLevel, size: number) => {
        const newPlayers: Player[] = num === 3 ? ['Rouge', 'Bleu', 'Vert'] : ['Rouge', 'Bleu'];
        setPlayers(newPlayers);
        setNumPlayers(num);
        setGameLevel(level);
        setGridSize(size);
        setBoard(generateBoard(level, size, num));
        setScores({ Rouge: 0, Bleu: 0, Vert: 0 });
        setGameState('playing');
        setupRoles(0);
    };
    
    const handlePlayerNameChange = (player: Player, newName: string) => {
        setPlayerConfigs(prev => ({
            ...prev,
            [player]: { ...prev[player], name: newName }
        }));
    };

    const nextTurn = React.useCallback(() => {
        setAttackingFactor(null);
        setSelectedCell(null);
        setHighlightedLines([]);

        const nextIndex = currentPlayerIndex + 1;
        
        const isBoardFull = board.length > 0 && board.every(row => row.every(cell => cell.owner !== null));
        if (isBoardFull) {
            setGameState('gameOver');
            setAttacker(null);
            setDefender(null);
            return;
        }

        setCurrentPlayerIndex(nextIndex);
        setupRoles(nextIndex);
    }, [board, currentPlayerIndex, setupRoles]);
    
    const handleSelectFactor = (factor: number) => {
        if (attacker && playerConfigs[attacker].isAi) return;
        setAttackingFactor(factor);
    };

    const handleCellClick = (r: number, c: number) => {
        if (board[r][c].owner || !attackingFactor || (defender && playerConfigs[defender].isAi)) {
            return;
        }
        setSelectedCell({ r, c });
        setIsFactorModalOpen(true);
    };

    const handleSubmitFactor = React.useCallback((factor2: number) => {
        if (!selectedCell || !attackingFactor || !defender) return;

        const { r, c } = selectedCell;
        const numberToSolve = board[r][c].number;
        const isCorrect = attackingFactor * factor2 === numberToSolve;
        
        setIsFactorModalOpen(false);

        if (isCorrect) {
            const oldBoard = board;
            const newBoard = JSON.parse(JSON.stringify(oldBoard));
            newBoard[r][c].owner = defender;
            setBoard(newBoard);
            
            setMoves(prev => [...prev, { player: defender, number: numberToSolve, factor1: attackingFactor, factor2 }]);
            
            const bonusPoints = calculateBonusForMove(newBoard, r, c, defender);
            const pointsForCorrectAnswer = 1;
            const totalPointsGained = bonusPoints + pointsForCorrectAnswer;

            const oldLines = findWinningLines(oldBoard);
            const newLines = findWinningLines(newBoard);
            setWinningLines(newLines);
            
            if (totalPointsGained > 0) {
                setScores(prev => ({ ...prev, [defender]: prev[defender] + totalPointsGained }));

                setScorePopup({ points: totalPointsGained, r, c, key: Date.now() });
                 
                 const defenderScoreEl = playerScoreRefs[defender]?.current;
                 const gridEl = gameBoardRef.current;
                 const gridUtils = gridUtilsRef.current;

                 if (defenderScoreEl && gridEl && gridUtils) {
                    const sourcePos = gridUtils.positioner(r, c);
                    const gridRect = gridEl.getBoundingClientRect();
                    const destRect = defenderScoreEl.getBoundingClientRect();
                    
                    const startX = gridRect.left + sourcePos.left + (gridUtils.cellSize / 2);
                    const startY = gridRect.top + sourcePos.top + (gridUtils.cellSize / 2);
                    const endX = destRect.left + destRect.width / 2;
                    const endY = destRect.top + destRect.height / 2;
                    
                    const newPoints = Array.from({ length: totalPointsGained }).map((_, i) => {
                       const pointId = `${Date.now()}-${i}`;
                       return {
                         id: pointId,
                         from: { x: startX, y: startY },
                         to: { x: endX, y: endY },
                         delay: i * 200,
                         onComplete: (id: string) => {
                            setFlyingPoints(current => current.filter(p => p.id !== id));
                         }
                       };
                    });
                    setFlyingPoints(current => [...current, ...newPoints]);
                 }
                
                const generateLineKey = (line: WinningLine): string => {
                    const start = line.coords[0];
                    const end = line.coords[line.coords.length - 1];
                    const coord1Str = `${start.r},${start.c}`;
                    const coord2Str = `${end.r},${end.c}`;
                    const sortedCoords = [coord1Str, coord2Str].sort();
                    return `${line.player}:${sortedCoords[0]}:${sortedCoords[1]}`;
                };

                 const oldLineKeys = new Set(oldLines.map(generateLineKey));
                 const newlyFormedLines = newLines.filter(l => {
                    if (l.player !== defender) return false;
                    const key = generateLineKey(l);
                    return !oldLineKeys.has(key);
                 });
                 setHighlightedLines(newlyFormedLines);
            }
        } else {
            setScores(prev => ({ ...prev, [defender]: Math.max(0, prev[defender] - 1) }));
            setIncorrectCell({r, c});
            setTimeout(() => setIncorrectCell(null), 1000);
        }

        setTimeout(() => nextTurn(), 1500);
    }, [selectedCell, attackingFactor, defender, board, nextTurn]);
    
    // --- Print Logic ---
    const handlePrint = () => {
        const boardToPrint = generateBoard(gameLevel, gridSize, numPlayers);
        setBoardForPrint(boardToPrint);
    };
    
    React.useEffect(() => {
        if (boardForPrint && printContainerRef.current) {
            const { jsPDF } = window.jspdf;
            const elementToPrint = printContainerRef.current;
            
            const options = {
                scale: 2,
                useCORS: true,
                logging: false,
                width: elementToPrint.offsetWidth,
                height: elementToPrint.offsetHeight,
                backgroundColor: '#ffffff',
            };

            window.html2canvas(elementToPrint, options).then((canvas: HTMLCanvasElement) => {
                const imgData = canvas.toDataURL('image/png');
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const pdf = new jsPDF({
                    orientation: imgWidth > imgHeight ? 'landscape' : 'portrait',
                    unit: 'px',
                    format: [imgWidth, imgHeight]
                });

                pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
                
                window.open(pdf.output('bloburl'), '_blank');

                setBoardForPrint(null);
            }).catch((err: any) => {
                console.error("Failed to generate PDF", err);
                setBoardForPrint(null);
            });
        }
    }, [boardForPrint]);


    // --- AI & Turn Management LOGIC ---
    React.useEffect(() => {
        if (gameState !== 'playing') return;

        // 1. Check if the current attacker has any moves. If not, skip their turn.
        if (attacker && !attackingFactor && availableFactors.length === 0) {
            console.warn(`Attacker ${attacker} has no playable factors. Skipping turn.`);
            const skipTurnTimer = setTimeout(() => {
                nextTurn();
            }, 2000);
            return () => clearTimeout(skipTurnTimer);
        }

        // 2. If moves are possible, let the AI play if it's its turn.
        const handleAiTurn = async () => {
            // AI Attacker: only runs if availableFactors is NOT empty
            if (attacker && playerConfigs[attacker].isAi && !attackingFactor) {
                await new Promise(res => setTimeout(res, 1000));
                const factor = aiSelectFactor(availableFactors);
                setAttackingFactor(factor);
                return;
            }

            // AI Defender
            if (defender && playerConfigs[defender].isAi && attackingFactor && !selectedCell) {
                await new Promise(res => setTimeout(res, 1500));
                const opponents = players.filter(p => p !== defender);
                const bestMove = findBestAiMove(board, attackingFactor, levelConfig.defenderRange, defender, opponents, playerConfigs[defender].difficulty);

                if (bestMove) {
                    setSelectedCell({ r: bestMove.r, c: bestMove.c });
                    await new Promise(res => setTimeout(res, 500));
                    handleSubmitFactor(bestMove.factor2);
                } else {
                    // This case should be rare now, but as a fallback, pass turn.
                    console.error("AI Defender found no valid moves, but should have. Skipping turn.");
                    nextTurn();
                }
            }
        };

        handleAiTurn();

    }, [gameState, attacker, defender, attackingFactor, selectedCell, playerConfigs, availableFactors, board, nextTurn, players, levelConfig, handleSubmitFactor]);
    
    // --- Setup UI ---
    if (gameState === 'setup') {
        return (
            <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8 flex items-center justify-center">
                <div className="w-full max-w-4xl mx-auto space-y-8">
                   <div className="text-center">
                        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white">Multiplicato</h1>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8 items-start">
                        <GameControls
                            numPlayers={numPlayers}
                            onNumPlayersChange={setNumPlayers}
                            level={gameLevel}
                            onLevelChange={setGameLevel}
                            onStartGame={handleStartGame}
                            onShowRules={() => setIsRulesModalOpen(true)}
                            onPrint={handlePrint}
                        />
                        <div className="space-y-4">
                             <h3 className="text-xl font-bold text-center text-slate-900 dark:text-white">Configuration des joueurs</h3>
                            {(numPlayers === 2 ? ['Rouge', 'Bleu'] : ['Rouge', 'Bleu', 'Vert']).map(p => {
                                const player = p as Player;
                                return (
                                    <PlayerPanel
                                        key={player}
                                        player={player}
                                        displayName={playerConfigs[player].name}
                                        score={0}
                                        role={null}
                                        isActive={false}
                                        moves={[]}
                                        isAi={playerConfigs[player].isAi}
                                        isSetupPhase={true}
                                        onPlayerClick={(pl) => {
                                            setPlayerToConfigure(pl);
                                            setIsAiControlModalOpen(true);
                                        }}
                                        onNameChange={handlePlayerNameChange}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>

                <RulesModal isOpen={isRulesModalOpen} onClose={() => setIsRulesModalOpen(false)} />
                <AiControlModal
                    isOpen={isAiControlModalOpen}
                    onClose={() => setIsAiControlModalOpen(false)}
                    player={playerToConfigure}
                    config={playerToConfigure ? playerConfigs[playerToConfigure] : null}
                    onSave={(player, config) => {
                        setPlayerConfigs(prev => ({...prev, [player]: config}));
                        setIsAiControlModalOpen(false);
                    }}
                    isAiChangeable={playerToConfigure !== 'Rouge'}
                />
                <div
                    ref={printContainerRef}
                    style={{
                        position: 'absolute',
                        left: '-9999px',
                        top: '-9999px',
                        width: '1123px',
                        background: 'white'
                    }}
                >
                   {boardForPrint && (
                       <PrintableGrid 
                           board={boardForPrint} 
                           levelConfig={levelConfig} 
                           numPlayers={numPlayers} 
                       />
                   )}
                </div>
            </div>
        );
    }

    // --- Gameplay UI ---
    return (
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8 flex flex-col">
            <main className="max-w-7xl mx-auto w-full flex-grow">
                <div className="grid lg:grid-cols-[1fr_2fr_1fr] gap-6 items-start">
                    <div className="flex flex-col gap-6">
                        <PlayerPanel
                            player={players[0]}
                            displayName={playerConfigs[players[0]].name}
                            score={scores[players[0]]}
                            role={attacker === players[0] ? 'attacker' : (defender === players[0] ? 'defender' : null)}
                            isActive={attacker === players[0] || defender === players[0]}
                            moves={moves}
                            isAi={playerConfigs[players[0]].isAi}
                            isSetupPhase={false}
                            availableFactors={attacker === players[0] ? availableFactors : undefined}
                            onSelectFactor={handleSelectFactor}
                            scoreRef={playerScoreRefs[players[0]]}
                        />
                         {numPlayers === 3 && players[2] && (
                             <PlayerPanel
                                player={players[2]}
                                displayName={playerConfigs[players[2]].name}
                                score={scores[players[2]]}
                                role={attacker === players[2] ? 'attacker' : (defender === players[2] ? 'defender' : null)}
                                isActive={attacker === players[2] || defender === players[2]}
                                moves={moves}
                                isAi={playerConfigs[players[2]].isAi}
                                isSetupPhase={false}
                                availableFactors={attacker === players[2] ? availableFactors : undefined}
                                onSelectFactor={handleSelectFactor}
                                scoreRef={playerScoreRefs[players[2]]}
                            />
                        )}
                    </div>
                    
                    <div className="lg:col-start-2 space-y-4">
                      {attackingFactor && defender && gameState === 'playing' && (
                        <div 
                          className="p-4 bg-yellow-100 dark:bg-yellow-900/50 border-2 border-yellow-400 rounded-lg text-center animate-fade-in-down"
                          role="alert"
                          aria-live="polite"
                        >
                          <p className="text-lg font-semibold text-yellow-800 dark:text-yellow-200">
                            {playerConfigs[defender].name} cherche un nombre dans la table de <strong className="text-3xl font-black">{attackingFactor}</strong>
                          </p>
                        </div>
                      )}
                      <GameBoardComponent
                          board={board}
                          numPlayers={numPlayers}
                          winningLines={winningLines}
                          onCellClick={handleCellClick}
                          disabled={!attackingFactor || (defender !== null && playerConfigs[defender].isAi) || gameState === 'gameOver'}
                          defender={defender || players[0]}
                          scorePopup={scorePopup}
                          incorrectCell={incorrectCell}
                          highlightedLines={highlightedLines}
                          gameBoardRef={gameBoardRef}
                          onPositionerReady={(utils) => { gridUtilsRef.current = utils; }}
                      />
                    </div>
                    
                    <div className="lg:col-start-3">
                         <PlayerPanel
                            player={players[1]}
                            displayName={playerConfigs[players[1]].name}
                            score={scores[players[1]]}
                            role={attacker === players[1] ? 'attacker' : (defender === players[1] ? 'defender' : null)}
                            isActive={attacker === players[1] || defender === players[1]}
                            moves={moves}
                             isAi={playerConfigs[players[1]].isAi}
                             isSetupPhase={false}
                            availableFactors={attacker === players[1] ? availableFactors : undefined}
                            onSelectFactor={handleSelectFactor}
                            scoreRef={playerScoreRefs[players[1]]}
                        />
                    </div>
                </div>
            </main>
            
            <footer className="max-w-7xl mx-auto w-full text-center pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="p-3 bg-white dark:bg-slate-800 rounded-lg shadow-md text-left order-2 sm:order-1 flex-grow sm:flex-grow-0">
                    <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">Rappel des points bonus :</h4>
                    <div className="text-xs text-slate-600 dark:text-slate-400 flex flex-col sm:flex-row sm:gap-x-2 flex-wrap">
                        <span>Alignement de 3 : <strong className="text-green-500">+1 pt</strong></span>
                        <span className="hidden sm:inline">|</span>
                        <span>Alignement de 4 : <strong className="text-green-500">+3 pts</strong></span>
                        <span className="hidden sm:inline">|</span>
                        <span>Alignement de 5 : <strong className="text-green-500">+5 pts</strong></span>
                        {numPlayers === 3 && (
                            <>
                                <span className="hidden sm:inline">|</span>
                                <span>Alignement de 6 : <strong className="text-green-500">+7 pts</strong></span>
                                <span className="hidden sm:inline">|</span>
                                <span>Alignement de 7 : <strong className="text-green-500">+10 pts</strong></span>
                            </>
                        )}
                    </div>
                </div>
                <button
                    onClick={handleNewGame}
                    className="px-8 py-4 text-xl font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300 order-1 sm:order-2"
                >
                    Nouvelle Partie
                </button>
            </footer>

            {flyingPoints.map(p => (
                <FlyingPoint
                    key={p.id}
                    id={p.id}
                    from={p.from}
                    to={p.to}
                    delay={p.delay}
                    onComplete={p.onComplete}
                />
            ))}

            {selectedCell && defender && (
                <FactorModal
                    isOpen={isFactorModalOpen}
                    onClose={() => {
                        setIsFactorModalOpen(false);
                    }}
                    numberToSolve={board[selectedCell.r][selectedCell.c].number}
                    attackingFactor={attackingFactor!}
                    minFactor={levelConfig.defenderRange.min}
                    maxFactor={levelConfig.defenderRange.max}
                    onSubmit={handleSubmitFactor}
                />
            )}
        </div>
    );
};

export default App;