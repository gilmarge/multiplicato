import React, { useState, useEffect, useRef } from 'react';

interface FactorModalProps {
  isOpen: boolean;
  numberToSolve: number;
  attackingFactor: number;
  minFactor: number;
  maxFactor: number;
  onClose: () => void;
  onSubmit: (factor2: number) => void;
}

const FactorModal: React.FC<FactorModalProps> = ({ isOpen, numberToSolve, attackingFactor, minFactor, maxFactor, onClose, onSubmit }) => {
  const [factor2, setFactor2] = useState('');
  const [error, setError] = useState<string | null>(null);
  const input2Ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setFactor2('');
      setError(null);
      setTimeout(() => input2Ref.current?.focus(), 100);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const f2 = parseInt(factor2, 10);

    if (isNaN(f2)) {
      setError('Veuillez entrer un nombre.');
      return;
    }
    
    if (f2 > maxFactor || f2 < minFactor) {
        setError(`Le facteur doit être entre ${minFactor} et ${maxFactor}.`);
        return;
    }

    // The parent component will handle success/failure and closing the modal.
    onSubmit(f2);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl p-8 w-full max-w-sm text-center transform transition-all" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">Complétez la multiplication :</h2>
        
        <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
            <p className="relative text-6xl font-black text-indigo-600 dark:text-indigo-400">
                {numberToSolve}
            </p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-center space-x-4">
            <span className="w-24 p-3 text-2xl font-bold text-center bg-slate-100 dark:bg-slate-700 rounded-lg dark:text-white">{attackingFactor}</span>
            <span className="text-3xl font-bold text-slate-500 dark:text-slate-400">×</span>
            <input
              ref={input2Ref}
              type="number"
              value={factor2}
              onChange={(e) => setFactor2(e.target.value)}
              className="w-24 p-3 text-2xl font-bold text-center bg-slate-200 dark:bg-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white"
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <div className="flex space-x-4 pt-4">
             <button type="button" onClick={onClose} className="w-full py-3 text-lg font-bold bg-slate-300 dark:bg-slate-600 text-slate-800 dark:text-slate-200 rounded-lg hover:bg-slate-400 dark:hover:bg-slate-500 transition">
              Annuler
            </button>
            <button type="submit" className="w-full py-3 text-lg font-bold text-white bg-green-600 rounded-lg hover:bg-green-700 transition">
              Vérifier
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default FactorModal;