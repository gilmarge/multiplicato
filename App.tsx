import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  GameBoard as GameBoardType,
  Player,
  GameLevel,
  GameState,
  Scores,
  Move,
  WinningLine,
  PlayerConfig,
} from './types';
import {
  generateBoard,
  calculateScores,
  findWinningLines,
  aiSelectFactor,
  findBestAiMove,
} from './utils';
import { LEVEL_CONFIG } from './constants';

import GameBoardComponent from './components/GameBoard';
import ScoreBoard from './components/ScoreBoard';
import PlayerPanel from './components/PlayerPanel';
import FactorModal from './components/FactorModal';
import RulesModal from './components/RulesModal';
import GameControls from './components/GameControls';
import AiControlModal from './components/AiControlModal';
import PrintableGrid from './components/PrintableGrid';

declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

const App: React.FC = () => {
    // Game State
    const [gameState, setGameState] = useState<GameState>('setup');
    const [numPlayers, setNumPlayers] = useState(2);
    const [players, setPlayers] = useState<Player[]>(['Rouge', 'Bleu']);
    const [scores, setScores] = useState<Scores>({ Rouge: 0, Bleu: 0, Vert: 0 });
    const [board, setBoard] = useState<GameBoardType>([]);
    const [gameLevel, setGameLevel] = useState<GameLevel>(1);
    const [gridSize, setGridSize] = useState(5);
    const [moves, setMoves] = useState<Move[]>([]);
    const [winningLines, setWinningLines] = useState<WinningLine[]>([]);

    // Turn State
    const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
    const [attacker, setAttacker] = useState<Player | null>(null);
    const [defender, setDefender] = useState<Player | null>(null);
    const [attackingFactor, setAttackingFactor] = useState<number | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ r: number; c: number } | null>(null);

    // UI State
    const [isFactorModalOpen, setIsFactorModalOpen] = useState(false);
    const [isRulesModalOpen, setIsRulesModalOpen] = useState(false);
    const [isAiControlModalOpen, setIsAiControlModalOpen] = useState(false);
    const [playerToConfigure, setPlayerToConfigure] = useState<Player | null>(null);
    const [scorePopup, setScorePopup] = useState<{ points: number; r: number; c: number; key: number } | null>(null);
    const [incorrectCell, setIncorrectCell] = useState<{ r: number; c: number } | null>(null);
    const [highlightedLines, setHighlightedLines] = useState<WinningLine[]>([]);
    
    // Print State
    const [boardForPrint, setBoardForPrint] = useState<GameBoardType | null>(null);
    const printContainerRef = useRef<HTMLDivElement>(null);

    // Player Configuration
    const [playerConfigs, setPlayerConfigs] = useState<Record<Player, PlayerConfig>>({
        Rouge: { isAi: false, difficulty: 1, name: 'Joueur 1' },
        Bleu: { isAi: false, difficulty: 1, name: 'Joueur 2' },
        Vert: { isAi: false, difficulty: 1, name: 'Joueur 3' },
    });

    const levelConfig = useMemo(() => LEVEL_CONFIG[gameLevel], [gameLevel]);
    const availableFactors = useMemo(() => {
        const factors = [];
        for (let i = levelConfig.attackerRange.min; i <= levelConfig.attackerRange.max; i++) {
            factors.push(i);
        }
        return factors;
    }, [levelConfig]);
    
    useEffect(() => {
        setGridSize(numPlayers === 2 ? 5 : 7);
    }, [numPlayers]);

    const setupRoles = useCallback((playerIndex: number) => {
        const currentAttacker = players[playerIndex % players.length];
        const currentDefender = players[(playerIndex + 1) % players.length];
        setAttacker(currentAttacker);
        setDefender(currentDefender);
    }, [players]);

    const handleNewGame = useCallback(() => {
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
        setGameState('playing');
        setupRoles(0);
    };
    
    const handlePlayerNameChange = (player: Player, newName: string) => {
        setPlayerConfigs(prev => ({
            ...prev,
            [player]: { ...prev[player], name: newName }
        }));
    };

    const nextTurn = useCallback(() => {
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

    const handleSubmitFactor = useCallback((factor2: number) => {
        if (!selectedCell || !attackingFactor || !defender) return;
        
        const { r, c } = selectedCell;
        const numberToSolve = board[r][c].number;
        const isCorrect = attackingFactor * factor2 === numberToSolve;
        
        setIsFactorModalOpen(false);

        const oldScores = { ...scores };
        const oldLines = findWinningLines(board);

        if (isCorrect) {
            const newBoard = JSON.parse(JSON.stringify(board));
            newBoard[r][c].owner = defender;
            setBoard(newBoard);
            
            setMoves(prev => [...prev, { player: defender, number: numberToSolve, factor1: attackingFactor, factor2 }]);
            
            const newScores = calculateScores(newBoard);
            const newLines = findWinningLines(newBoard);
            setWinningLines(newLines);
            
            let scoreDelta = newScores[defender] - oldScores[defender];
            scoreDelta += 1; // 1 point for correct answer

            const totalPointsGained = scoreDelta;
            
            if (totalPointsGained > 0) {
                 setScorePopup({ points: totalPointsGained, r, c, key: Date.now() });
                 const oldLineKeys = new Set(oldLines.map(l => `${l.player}-${l.coords[0].r},${l.coords[0].c}-${l.coords[l.coords.length-1].r},${l.coords[l.coords.length-1].c}`));
                 const newlyFormedLines = newLines.filter(l => {
                    const key = `${l.player}-${l.coords[0].r},${l.coords[0].c}-${l.coords[l.coords.length-1].r},${l.coords[l.coords.length-1].c}`;
                    return !oldLineKeys.has(key) && l.player === defender;
                 });
                 setHighlightedLines(newlyFormedLines);
            }
            
            setScores(prev => ({ ...prev, [defender]: prev[defender] + totalPointsGained }));
        } else {
            setScores(prev => ({ ...prev, [defender]: Math.max(0, prev[defender] - 1) }));
            setIncorrectCell({r, c});
            setTimeout(() => setIncorrectCell(null), 1000);
        }

        setTimeout(() => nextTurn(), 1500);
    }, [selectedCell, attackingFactor, defender, board, scores, nextTurn]);
    
    // --- Print Logic ---
    const handlePrint = () => {
        const boardToPrint = generateBoard(gameLevel, gridSize, numPlayers);
        setBoardForPrint(boardToPrint);
    };
    
    useEffect(() => {
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


    // --- AI LOGIC ---
    useEffect(() => {
        if (gameState !== 'playing') return;

        const handleAiTurn = async () => {
            // AI Attacker
            if (attacker && playerConfigs[attacker].isAi && !attackingFactor) {
                await new Promise(res => setTimeout(res, 1000));
                const factor = aiSelectFactor(availableFactors);
                setAttackingFactor(factor);
                return; // Let the effect re-run for defender
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
                    // No valid moves, pass turn
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
                        <h1 className="text-5xl font-extrabold text-slate-900 dark:text-white">Multiplicat</h1>
                        <p className="mt-2 text-lg text-slate-600 dark:text-slate-400">Le jeu de calcul pour maîtriser les multiplications !</p>
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
        <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                <ScoreBoard
                    scores={scores}
                    players={players}
                    currentPlayer={attacker}
                    onNewGame={handleNewGame}
                />
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
                            />
                        )}
                    </div>
                    
                    <div className="lg:col-start-2">
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
                        />
                    </div>
                </div>
            </div>

            {selectedCell && defender && (
                <FactorModal
                    isOpen={isFactorModalOpen}
                    onClose={() => setIsFactorModalOpen(false)}
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