import { WinningLine } from '../types.ts';
import { PLAYER_COLORS } from '../constants.ts';

interface WinningLinesOverlayProps {
  lines: WinningLine[];
  highlightedLines: WinningLine[];
  gridSize: number;
  is3P: boolean;
  cellSize: number;
  getCellPosition: (r: number, c: number) => { top: number, left: number };
}

const generateLineKey = (line: WinningLine): string => {
    const start = line.coords[0];
    const end = line.coords[line.coords.length - 1];
    const coord1Str = `${start.r},${start.c}`;
    const coord2Str = `${end.r},${end.c}`;
    const sortedCoords = [coord1Str, coord2Str].sort();
    return `${line.player}:${sortedCoords[0]}:${sortedCoords[1]}`;
};

const WinningLinesOverlay: React.FC<WinningLinesOverlayProps> = ({ lines, highlightedLines, gridSize, is3P, cellSize, getCellPosition }) => {

  if (lines.length === 0 || cellSize === 0) {
    return <div className="absolute inset-0 pointer-events-none" />;
  }

  const getCellCenter = (r: number, c: number) => {
    const { top, left } = getCellPosition(r,c);
    return {
      x: left + cellSize / 2,
      y: top + cellSize / 2,
    };
  };

  const highlightedLineKeys = new Set(highlightedLines.map(generateLineKey));

  return (
    <div className="absolute inset-0 pointer-events-none">
      <svg width="100%" height="100%" style={{ overflow: 'visible' }}>
        {lines.map((line) => {
          if (line.coords.length < 2) return null;
          
          const key = generateLineKey(line);
          const isHighlighted = highlightedLineKeys.has(key);
          const startCell = line.coords[0];
          const endCell = line.coords[line.coords.length - 1];
          const startPoint = getCellCenter(startCell.r, startCell.c);
          const endPoint = getCellCenter(endCell.r, endCell.c);
          const color = PLAYER_COLORS[line.player].ring.replace('ring-', '');

          const animationClass = isHighlighted ? "animate-draw-line animate-pulse-line" : "";
          const strokeWidth = isHighlighted ? "10" : "8";

          return (
            <line
              key={key}
              x1={startPoint.x}
              y1={startPoint.y}
              x2={endPoint.x}
              y2={endPoint.y}
              stroke={color}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
              className={animationClass}
            />
          );
        })}
      </svg>
    </div>
  );
};

export default WinningLinesOverlay;