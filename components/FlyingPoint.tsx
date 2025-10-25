// FIX: Import React
import React from 'react';

interface FlyingPointProps {
  id: string;
  from: { x: number; y: number };
  to: { x: number; y: number };
  delay: number;
  onComplete: (id: string) => void;
}

const FlyingPoint: React.FC<FlyingPointProps> = ({ id, from, to, delay, onComplete }) => {
  const [position, setPosition] = React.useState(from);
  const [visible, setVisible] = React.useState(false);
  const pointRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const startTimer = setTimeout(() => {
      setVisible(true);
      // This short delay ensures the element is rendered and `visible` is true
      // before we trigger the CSS transition by changing the position.
      setTimeout(() => {
        setPosition(to);
      }, 20);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay, to]);

  React.useEffect(() => {
    const el = pointRef.current;
    if (!el) return;

    const handleTransitionEnd = (event: TransitionEvent) => {
      // Ensure we only fire onComplete when the 'top' or 'left' transition ends
      if (event.propertyName === 'top' || event.propertyName === 'left') {
        onComplete(id);
      }
    };

    el.addEventListener('transitionend', handleTransitionEnd);
    return () => el.removeEventListener('transitionend', handleTransitionEnd);
  }, [id, onComplete]);

  const isMoving = position.x !== to.x || position.y !== to.y;

  return (
    <div
      ref={pointRef}
      className="fixed z-50 rounded-full bg-yellow-400 text-yellow-900 text-xs font-bold flex items-center justify-center transition-all duration-700 ease-in-out shadow-lg border-2 border-white"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        width: '28px',
        height: '28px',
        transform: `translate(-50%, -50%) scale(${isMoving ? 1 : 0.5})`,
        opacity: visible && isMoving ? 1 : 0,
      }}
    >
      +1
    </div>
  );
};

export default FlyingPoint;