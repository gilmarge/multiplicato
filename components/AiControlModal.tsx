// FIX: Import React
import React from 'react';
import { Player, PlayerConfig, AiDifficulty } from '../types.ts';

interface AiControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  player: Player | null;
  config: PlayerConfig | null;
  onSave: (player: Player, config: PlayerConfig) => void;
  isAiChangeable: boolean;
}

const AiControlModal: React.FC<AiControlModalProps> = ({ isOpen, onClose, player, config, onSave, isAiChangeable }) => {
  const [isAi, setIsAi] = React.useState(false);
  const [difficulty, setDifficulty] = React.useState<AiDifficulty>(1);
  const [name, setName] = React.useState('');

  React.useEffect(() => {
    if (isOpen && config) {
      setIsAi(config.isAi);
      setDifficulty(config.difficulty);
      setName(config.name);
    }
  }, [isOpen, config]);

  if (!isOpen || !player || !config) return null;

  const handleSave = () => {
    onSave(player, { isAi, difficulty, name });
  };
  
  const difficultyDescriptions: Record<AiDifficulty, string> = {
    1: "Niveau 1 : L'ordinateur choisit ses coups au hasard.",
    2: "Niveau 2 : L'ordinateur essaie de faire des alignements de 3 jetons.",
    3: "Niveau 3 : L'ordinateur joue pour gagner et essaie de bloquer l'adversaire."
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-md text-slate-800 dark:text-slate-200 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">Configurer le joueur {player}</h2>
        
        <div className="space-y-6">
           <div>
              <label htmlFor="player-name-modal" className="text-lg font-medium text-slate-700 dark:text-slate-300">
                Prénom du Joueur
              </label>
              <input
                  id="player-name-modal"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-2 w-full px-4 py-2 bg-slate-100 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
                  placeholder="Entrez un nom"
              />
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-100 dark:bg-slate-700 rounded-lg">
            <span className={`text-lg font-medium ${!isAiChangeable ? 'text-slate-400 dark:text-slate-500' : ''}`}>
                Contrôlé par l'ordinateur
            </span>
            <button
              onClick={() => isAiChangeable && setIsAi(!isAi)}
              disabled={!isAiChangeable}
              className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors ${isAi ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-500'} ${!isAiChangeable ? 'cursor-not-allowed' : ''}`}
            >
              <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform ${isAi ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
          {!isAiChangeable && <p className="text-sm text-yellow-600 dark:text-yellow-400 -mt-4 px-1">Le premier joueur doit être humain.</p>}

          {isAi && (
            <div className="space-y-4 animate-fade-in-down">
              <h3 className="text-lg font-medium">Niveau de difficulté de l'ordinateur</h3>
              <div className="space-y-3">
                {([1, 2, 3] as AiDifficulty[]).map(level => (
                  <button
                    key={level}
                    onClick={() => setDifficulty(level)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${difficulty === level ? 'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-500' : 'bg-slate-100 dark:bg-slate-700 border-transparent hover:border-slate-300 dark:hover:border-slate-500'}`}
                  >
                    <p className="font-bold">Niveau {level}</p>
                    <p className="text-sm text-slate-600 dark:text-slate-400">{difficultyDescriptions[level]}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-8 flex justify-end space-x-4">
            <button onClick={onClose} className="px-6 py-3 text-lg font-semibold bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-500 transition">
              Annuler
            </button>
            <button onClick={handleSave} className="px-6 py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
              Sauvegarder
            </button>
        </div>
      </div>
    </div>
  );
};

export default AiControlModal;