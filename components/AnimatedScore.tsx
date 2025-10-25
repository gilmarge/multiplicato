// FIX: Import React
import React from 'react';

interface AnimatedScoreProps {
  targetScore: number;
}

const AnimatedScore = React.forwardRef<HTMLSpanElement, AnimatedScoreProps>(({ targetScore }, ref) => {
  const [isAnimating, setIsAnimating] = React.useState(false);
  const prevScoreRef = React.useRef(targetScore);

  React.useEffect(() => {
    // Ne déclencher l'animation de rebond que si le score augmente.
    if (targetScore > prevScoreRef.current) {
      setIsAnimating(true);
      // Réinitialiser la classe d'animation une fois l'animation terminée (600ms).
      const timer = setTimeout(() => setIsAnimating(false), 600);
      return () => clearTimeout(timer);
    }
    // Mettre à jour la référence pour la prochaine comparaison.
    prevScoreRef.current = targetScore;
  }, [targetScore]);

  const animationClass = isAnimating ? 'text-green-500 animate-score-bounce' : 'text-slate-700 dark:text-slate-200';

  return (
    <span ref={ref} className={`inline-block text-3xl font-black transition-colors duration-300 ${animationClass}`}>
      {targetScore}
    </span>
  );
});

export default AnimatedScore;