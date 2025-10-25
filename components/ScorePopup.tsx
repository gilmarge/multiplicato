interface ScorePopupProps {
  points: number;
  style: React.CSSProperties;
}

const ScorePopup: React.FC<ScorePopupProps> = ({ points, style }) => {
  return (
    <div style={style} className="absolute z-20 pointer-events-none animate-score-popup">
      <div className="px-4 py-2 bg-yellow-400 text-yellow-900 font-bold text-lg rounded-full shadow-lg border-4 border-white">
        +{points}
      </div>
    </div>
  );
};

export default ScorePopup;