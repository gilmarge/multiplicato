import React from 'react';
import { Scores, Player } from '../types';
import { PLAYER_COLORS } from '../constants';
import AnimatedScore from './AnimatedScore';

interface ScoreBoardProps {
  scores: Scores;
  players: Player[];
  currentPlayer: Player | null;
  onNewGame: () => void;
}

const ScoreBoard: React.FC<ScoreBoardProps> = ({ scores, players, currentPlayer, onNewGame }) => {
  return (
    <div className="w-full p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl flex flex-wrap justify-between items-center gap-4">
      <div className="flex items-center gap-4 md:gap-6 flex-wrap">
        {players.map(player => (
          <div
            key={player}
            className={`p-3 rounded-lg flex items-center gap-3 transition-all duration-300 ring-4 ${
              currentPlayer === player ? `${PLAYER_COLORS[player].ring}` : 'ring-transparent'
            }`}
          >
            <span className={`text-xl font-bold ${PLAYER_COLORS[player].text}`}>{player}</span>
            <AnimatedScore targetScore={scores[player]} />
          </div>
        ))}
      </div>
      <button
        onClick={onNewGame}
        className="px-6 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg shadow-lg hover:bg-indigo-700 transition-transform transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-300"
      >
        Nouvelle Partie
      </button>
    </div>
  );
};

export default ScoreBoard;