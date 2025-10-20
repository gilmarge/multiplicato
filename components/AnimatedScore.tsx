import React, { useState, useEffect, useRef } from 'react';

interface AnimatedScoreProps {
  targetScore: number;
}

const AnimatedScore: React.FC<AnimatedScoreProps> = ({ targetScore }) => {
  const [displayedScore, setDisplayedScore] = useState(targetScore);
  const [isAnimating, setIsAnimating] = useState(false);
  
  // FIX: Initialize useRef with null. The error message pointed to line 11 but was likely referring to this line.
  // useRef<T>() requires an initial value if T doesn't include undefined.
  const animationFrameId = useRef<number | null>(null);
  const prevTargetScore = useRef(targetScore);

  useEffect(() => {
    // Prevent animation on initial render or if score hasn't changed.
    if (prevTargetScore.current === targetScore) {
      return;
    }

    const startScore = prevTargetScore.current;
    const duration = 800; // Animate over 800ms
    let startTime: number | null = null;
    
    // Only trigger visual animation on score increase
    if (targetScore > startScore) {
      setIsAnimating(true);
    }
    
    const animate = (timestamp: number) => {
      if (!startTime) {
        startTime = timestamp;
      }
      
      const elapsed = timestamp - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      const newDisplayValue = Math.round(startScore + (targetScore - startScore) * progress);
      
      setDisplayedScore(newDisplayValue);
      
      if (progress < 1) {
        animationFrameId.current = requestAnimationFrame(animate);
      } else {
        // Animation finished
        setIsAnimating(false);
        setDisplayedScore(targetScore); // Ensure final score is exact
      }
    };
    
    // Start the animation
    animationFrameId.current = requestAnimationFrame(animate);
    
    // Update the ref for the next change
    prevTargetScore.current = targetScore;
    
    // Cleanup function to cancel the animation frame if component unmounts or targetScore changes again
    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
    
  }, [targetScore]);

  // When unmounting, ensure we store the latest value
  useEffect(() => {
    return () => {
      prevTargetScore.current = displayedScore;
    };
  }, [displayedScore]);


  const animationClass = isAnimating ? 'text-green-500 animate-score-bounce' : 'text-slate-700 dark:text-slate-200';

  return (
    <span className={`inline-block text-3xl font-black transition-colors duration-300 ${animationClass}`}>
      {displayedScore}
    </span>
  );
};

export default AnimatedScore;
