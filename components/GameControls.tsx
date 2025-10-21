import React from 'react';
import { GameLevel } from '../types.ts';
import { LEVEL_CONFIG } from '../constants.ts';

interface GameControlsProps {
  numPlayers: number;
  onNumPlayersChange: (n: number) => void;
  level: GameLevel;
  onLevelChange: (l: GameLevel) => void;
  onStartGame: (numPlayers: number, level: GameLevel, gridSize: number) => void;
  onShowRules: () => void;
  onPrint: () => void;
}

const GameControls: React.FC<GameControlsProps> = ({ 
  numPlayers, 
  onNumPlayersChange, 
  level, 
  onLevelChange, 
  onStartGame, 
  onShowRules, 
  onPrint 
}) => {

  const handleStart = () => {
    const gridSize = numPlayers === 2 ? 5 : 7;
    onStartGame(numPlayers, level, gridSize);
  };

  return (
    <div className="p-6 bg-white dark:bg-slate-800 rounded-2xl shadow-xl space-y-6">
      <h2 className="text-3xl font-bold text-center text-slate-900 dark:text-white">Nouvelle Partie</h2>
      
      {/* Number of Players */}
      <div className="space-y-2">
        <label className="text-lg font-semibold text-slate-700 dark:text-slate-300">Nombre de joueurs</label>
        <div className="flex gap-4">
          {[2, 3].map(n => (
            <button
              key={n}
              onClick={() => onNumPlayersChange(n)}
              className={`flex-1 py-3 text-lg font-bold rounded-lg transition-all ${
                numPlayers === n ? 'bg-indigo-600 text-white ring-4 ring-indigo-300' : 'bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {n} Joueurs
            </button>
          ))}
        </div>
      </div>

      {/* Game Level */}
      <div className="space-y-3">
        <label className="text-lg font-semibold text-slate-700 dark:text-slate-300">Niveau de difficulté</label>
        {Object.entries(LEVEL_CONFIG).map(([levelKey, config]) => {
          const levelNum = parseInt(levelKey) as GameLevel;
          return (
            <div key={levelKey} className="relative group">
              <button
                onClick={() => onLevelChange(levelNum)}
                className={`w-full text-center p-4 rounded-lg border-2 transition-all font-bold ${
                  level === levelNum ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent hover:border-slate-300 dark:hover:border-slate-500'
                }`}
              >
                Niveau {levelKey}
              </button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-slate-800 text-white text-sm rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-10">
                {config.description}
                <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-800"></div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Action Buttons */}
      <div className="pt-4 space-y-3">
        <button
          onClick={handleStart}
          className="w-full py-4 text-xl font-bold text-white bg-green-600 rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-105"
        >
          Commencer à jouer
        </button>
        <div className="flex gap-4">
           <button
            onClick={onShowRules}
            className="w-full py-3 text-lg font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Règles du jeu
          </button>
          <button
            onClick={onPrint}
            className="w-full py-3 text-lg font-semibold bg-slate-200 dark:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition"
          >
            Imprimer une grille
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameControls;