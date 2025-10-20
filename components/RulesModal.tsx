import React from 'react';

interface RulesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RulesModal: React.FC<RulesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-lg text-slate-800 dark:text-slate-200 transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-3xl font-bold mb-6 text-center text-slate-900 dark:text-white">Règles du jeu Multiplicat</h2>
        
        <div className="space-y-4 text-left max-h-[70vh] overflow-y-auto pr-2">
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">But du jeu :</h3>
            <p>Le but est de marquer le plus de points en alignant tes jetons de couleur sur la grille. Tu peux faire des lignes de 3, 4 ou 5 jetons.</p>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">Comment jouer ?</h3>
            <p>À chaque tour, il y a un <strong className="text-yellow-500">Attaquant</strong> et un <strong className="text-cyan-400">Défenseur</strong>.</p>
            <ol className="list-decimal list-inside mt-2 space-y-1 pl-4">
              <li>L'<strong>Attaquant</strong> choisit une table de multiplication pour le Défenseur (par exemple, la table de 7).</li>
              <li>Le <strong>Défenseur</strong> choisit un nombre sur la grille qui est dans cette table (par exemple, 42).</li>
              <li>Le <strong>Défenseur</strong> doit alors donner le deuxième facteur de la multiplication (pour 42, si la table est 7, il faut répondre 6, car 7 &times; 6 = 42).</li>
            </ol>
          </div>

          <div>
            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">Marquer des points :</h3>
            <ul className="list-disc list-inside mt-2 space-y-2 pl-4">
              <li><strong>Bonne réponse :</strong> Placer un jeton sur la grille rapporte <strong>1 point</strong>.</li>
              <li><strong>Mauvaise réponse :</strong> Une mauvaise réponse coûte <strong>1 point</strong>.</li>
              <li><strong>Points d'alignement :</strong> Des points supplémentaires sont accordés pour la création ou l'extension de lignes. La valeur totale de chaque alignement est :
                <ul className="list-['-_'] list-inside ml-6 mt-1 space-y-1">
                    <li>Ligne de 3 : <strong>1 point</strong></li>
                    <li>Ligne de 4 : <strong>3 points</strong></li>
                    <li>Ligne de 5 : <strong>10 points</strong></li>
                </ul>
              </li>
               <li className="pt-1"><small><em>Note : Si vous étendez une ligne (ex: de 3 à 4), vous gagnez la différence de points (ici, 3 - 1 = 2 points bonus).</em></small></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-semibold text-indigo-600 dark:text-indigo-400">Fin de la partie :</h3>
            <p>La partie se termine quand toute la grille est remplie. Le joueur avec le score le plus élevé gagne !</p>
          </div>
        </div>

        <div className="mt-8 text-center">
            <button onClick={onClose} className="w-1/2 py-3 text-lg font-bold text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition">
              J'ai compris !
            </button>
        </div>
      </div>
    </div>
  );
};

export default RulesModal;