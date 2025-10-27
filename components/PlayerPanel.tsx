// Fix: Add React import to resolve UMD global errors.
import React from 'react';
import { Player, Move, Role } from '../types.ts';
import { PLAYER_COLORS } from '../constants.ts';
import AnimatedScore from './AnimatedScore.tsx';

interface PlayerPanelProps {
  player: Player;
  displayName: string;
  score: number;
  role: Role;
  isActive: boolean;
  moves: Move[];
  isAi: boolean;
  isSetupPhase: boolean;
  availableFactors?: number[];
  onSelectFactor?: (factor: number) => void;
  onPlayerClick?: (player: Player) => void;
  onNameChange?: (player: Player, newName: string) => void;
  scoreRef?: React.Ref<HTMLSpanElement>;
}

const RobotIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 2a8 8 0 100 16 8 8 0 000-16zM5 10a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 4a1 1 0 100 2h6a1 1 0 100-2H6z" clipRule="evenodd" />
        <path d="M9 4.5a1 1 0 11-2 0 1 1 0 012 0zM13 4.5a1 1 0 11-2 0 1 1 0 012 0z" />
    </svg>
);

const HumanIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
      <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
    </svg>
);


const PlayerPanel: React.FC<PlayerPanelProps> = ({ player, displayName, score, role, isActive, moves, isAi, isSetupPhase, availableFactors, onSelectFactor, onPlayerClick, onNameChange, scoreRef }) => {
  const playerMoves = moves.filter(move => move.player === player);
  const color = PLAYER_COLORS[player];
  const isChoosingFactor = role === 'attacker' && !!onSelectFactor;

  const getBorderColorClass = () => {
    if (!isActive || !role) return 'border-transparent';
    return role === 'attacker' ? 'border-yellow-400' : 'border-cyan-400';
  };

  const getRingClass = () => {
    if (isSetupPhase) return '';
    if (!isActive || !role) return 'ring-transparent';
    const colorClass = role === 'attacker' ? 'ring-yellow-400' : 'ring-cyan-400';
    return `ring-4 ${colorClass} animate-pulse-ring`;
  };
  
  const iconColorClass = role === 'attacker' ? 'text-yellow-500' : 'text-cyan-400';

  if (isSetupPhase) {
    return (
        <div 
            onClick={() => onPlayerClick?.(player)} 
            className="p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl space-y-3 cursor-pointer ring-2 ring-transparent hover:ring-indigo-500 transition-all"
        >
            <div className="flex justify-between items-center">
                <h3 className={`text-xl font-bold ${color.text}`}>{player}</h3>
                <div className="flex items-center gap-2 text-sm font-semibold px-3 py-1 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300">
                    {isAi ? <RobotIcon /> : <HumanIcon />}
                    <span>{isAi ? 'Ordinateur' : 'Humain'}</span>
                </div>
            </div>
            <div className="space-y-1">
                <label htmlFor={`player-name-${player}`} className="text-sm font-medium text-slate-600 dark:text-slate-400">
                    Prénom du joueur
                </label>
                <input
                    id={`player-name-${player}`}
                    type="text"
                    value={displayName}
                    onChange={(e) => {
                        e.stopPropagation();
                        onNameChange?.(player, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full px-3 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                    placeholder="Entrez un nom"
                />
            </div>
             <p className="text-xs text-center text-slate-500 dark:text-slate-400 pt-1">Cliquez pour changer le type (Humain/Ordinateur)</p>
        </div>
    );
  }

  return (
    <div
      className={`rounded-2xl shadow-xl transition-all duration-300 w-full max-w-xs ${getRingClass()}`}
    >
      <div className="bg-white dark:bg-slate-800 rounded-xl w-full h-full flex flex-col">
        <div className={`p-4 border-b-4 ${getBorderColorClass()}`}>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              {isActive && (
                <svg className={`w-5 h-5 ${iconColorClass}`} viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z" clipRule="evenodd" />
                </svg>
              )}
               {isAi && <RobotIcon />}
              <h2 className={`text-2xl font-bold ${color.text}`}>{displayName}</h2>
            </div>
            
             <div className="flex items-center gap-4">
                {role && (
                    <span className={`px-3 py-1 text-sm font-bold text-white rounded-full ${role === 'attacker' ? 'bg-yellow-500' : 'bg-cyan-500'}`}>
                        {role === 'attacker' ? 'Attaquant' : 'Défenseur'}
                    </span>
                )}
                <AnimatedScore targetScore={score} ref={scoreRef} />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-2 flex-grow overflow-y-auto max-h-80">
          {isChoosingFactor && (
            <div className="mb-4 animate-fade-in-down">
              <h3 className="text-lg font-semibold text-yellow-500 dark:text-yellow-400 border-b pb-2 mb-3">Choisir une table :</h3>
              {availableFactors && availableFactors.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableFactors.map(factor => (
                    <button
                      key={factor}
                      onClick={() => onSelectFactor(factor)}
                      className="p-2 text-center font-bold bg-slate-200 dark:bg-slate-700 rounded-md hover:bg-indigo-600 hover:text-white transition-all transform hover:scale-110"
                    >
                      {factor}
                    </button>
                  ))}
                </div>
              ) : (
                <div className="text-center p-2 bg-slate-100 dark:bg-slate-700 rounded-md">
                    <p className="text-slate-600 dark:text-slate-300 font-semibold">Aucune table jouable !</p>
                    <p className="text-slate-500 dark:text-slate-400 italic text-sm mt-1">Il n'y a plus de multiples disponibles pour vos tables. Le tour va passer automatiquement.</p>
                </div>
              )}
            </div>
          )}
          <h3 className="text-lg font-semibold text-slate-600 dark:text-slate-300 border-b pb-2 mb-2">Coups :</h3>
          {playerMoves.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400 italic text-sm">Aucun coup joué.</p>
          ) : (
            [...playerMoves].reverse().map((move, index) => (
              <div key={index} className="text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 p-2 rounded-md text-center">
                <span className="font-mono">{move.factor1} &times; {move.factor2} = </span>
                <span className="font-bold text-lg">{move.number}</span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayerPanel;