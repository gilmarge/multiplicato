import React, { useLayoutEffect, useRef, useState, useCallback, useEffect } from 'react';
import { GameBoard as GameBoardType, Player, WinningLine } from '../types.ts';
import { PLAYER_COLORS } from '../constants.ts';
import WinningLinesOverlay from './WinningLinesOverlay.tsx';
import ScorePopup from './ScorePopup.tsx';

interface GameBoardProps {
  board: GameBoardType;
  numPlayers: number;
  winningLines: WinningLine[];
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  defender: Player;
  scorePopup: { points: number; r: number; c: number; key: number } | null;
  incorrectCell: { r: number; c: number } | null;
  highlightedLines: WinningLine[];
  gameBoardRef: React.RefObject<HTMLDivElement>;
  onPositionerReady: (utils: {
    positioner: (r: number, c: number) => { top: number; left: number };
    cellSize: number;
  }) => void;
}

interface CellProps {
    number: number;
    owner: Player | null;
    onClick: () => void;
    disabled: boolean;
    defender: Player;
    isHighlighted: boolean;
    isIncorrect: boolean;
    isCircle: boolean;
    style?: React.CSSProperties;
    fontSizeClass: string;
}

const Cell: React.FC<CellProps> = ({ number, owner, onClick, disabled, defender, isHighlighted, isIncorrect, isCircle, style, fontSizeClass }) => {
  const ownerColor = owner ? PLAYER_COLORS[owner].base : 'bg-slate-200 dark:bg-slate-700';
  const hoverEffect = owner || disabled ? '' : `hover:ring-4 ${PLAYER_COLORS[defender].ring} cursor-pointer`;
  const textClass = owner ? 'text-white' : 'text-slate-800 dark:text-slate-200';
  const disabledClass = disabled && !owner ? 'opacity-50 cursor-not-allowed' : '';
  const highlightClass = isHighlighted ? 'animate-pulse-highlight' : '';
  const incorrectClass = isIncorrect ? 'animate-flash-red' : '';
  const shapeClass = isCircle ? 'rounded-full' : 'rounded-lg';

  return (
    <div
      style={style}
      onClick={owner || disabled ? undefined : onClick}
      className={`absolute flex items-center justify-center shadow-md transition-all duration-300 transform hover:scale-105 ${shapeClass} ${ownerColor} ${hoverEffect} ${disabledClass} ${highlightClass} ${incorrectClass}`}
    >
      <span className={`font-bold ${fontSizeClass} ${textClass}`}>{number}</span>
    </div>
  );
};


const GameBoardComponent: React.FC<GameBoardProps> = ({ board, numPlayers, winningLines, onCellClick, disabled, defender, scorePopup, incorrectCell, highlightedLines, gameBoardRef, onPositionerReady }) => {
  const [cellSize, setCellSize] = useState(0);
  const [containerSize, setContainerSize] = useState({width: 0, height: 0});
  
  const isHexagonalLayout = numPlayers === 3;
  const gridSize = board.length;

  useLayoutEffect(() => {
    const container = gameBoardRef.current;
    if (!container) return;

    const resizeObserver = new ResizeObserver(entries => {
        for (let entry of entries) {
            const containerWidth = entry.contentRect.width;
            if (gridSize <= 0) return;

            let newCellSize = 0;
            let newContainerHeight = 0;

            if (isHexagonalLayout) {
                // --- 3-Player Hexagonal Grid Calculation ---
                // A staggered grid's width is determined by the number of cells plus half a cell for the offset rows.
                const STAGGER_OFFSET_IN_CELLS = 0.5;
                const effectiveGridWidthInCells = gridSize + STAGGER_OFFSET_IN_CELLS;
                newCellSize = containerWidth / effectiveGridWidthInCells;

                // For a perfect honeycomb layout, the vertical distance between row centers is (sqrt(3)/2) * cellDiameter.
                const HEX_VERTICAL_SPACING_RATIO = Math.sqrt(3) / 2;
                const rowHeight = newCellSize * HEX_VERTICAL_SPACING_RATIO;
                newContainerHeight = newCellSize + (gridSize - 1) * rowHeight;
            } else {
                // --- 2-Player Square Grid Calculation ---
                // We define a gap between cells as a fraction of the cell size for clear spacing.
                const GAP_TO_CELL_RATIO = 0.2; // 20% gap
                
                // The total width is composed of `gridSize` cells and `gridSize` gaps (which includes padding on the sides).
                // containerWidth = (gridSize * cellSize) + (gridSize * gap)
                // containerWidth = cellSize * (gridSize * (1 + GAP_TO_CELL_RATIO))
                const totalDivisions = gridSize * (1 + GAP_TO_CELL_RATIO);
                newCellSize = containerWidth / totalDivisions;
                
                // The container remains square for a balanced look.
                newContainerHeight = containerWidth;
            }
            
            setCellSize(newCellSize);
            setContainerSize({ width: containerWidth, height: newContainerHeight });
        }
    });

    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, [gridSize, isHexagonalLayout, gameBoardRef]);
  
  const getCellPosition = useCallback((r: number, c: number) => {
      if (cellSize === 0) return { top: 0, left: 0 };

      if (isHexagonalLayout) {
        // --- 3-Player Hexagonal Positioning ---
        const STAGGER_OFFSET_IN_CELLS = 0.5;
        const HEX_VERTICAL_SPACING_RATIO = Math.sqrt(3) / 2;
        
        const isStaggeredRow = r % 2 !== 0;
        const horizontalOffset = isStaggeredRow ? cellSize * STAGGER_OFFSET_IN_CELLS : 0;
        const rowHeight = cellSize * HEX_VERTICAL_SPACING_RATIO;
        
        return {
            top: r * rowHeight,
            left: c * cellSize + horizontalOffset,
        };
      } else {
        // --- 2-Player Square Positioning ---
        const GAP_TO_CELL_RATIO = 0.2;
        const gap = cellSize * GAP_TO_CELL_RATIO;
        
        // A half-gap padding is applied on each side to center the grid.
        const padding = gap / 2;
        const totalCellAndGapSize = cellSize + gap;
        
        return {
            top: padding + r * totalCellAndGapSize,
            left: padding + c * totalCellAndGapSize,
        };
      }
  }, [cellSize, isHexagonalLayout, gridSize]);

  useEffect(() => {
    if (onPositionerReady) {
      onPositionerReady({ positioner: getCellPosition, cellSize });
    }
  }, [onPositionerReady, getCellPosition, cellSize]);
  
  const fontSizeClass = isHexagonalLayout ? 'text-xl' : 'text-2xl md:text-3xl';
  
  return (
    <div className={`p-4 bg-white dark:bg-slate-800 rounded-2xl shadow-xl transition-opacity duration-300 ${disabled ? 'opacity-70' : ''}`}>
        <div 
            ref={gameBoardRef} 
            className="relative w-full" 
            style={{ height: containerSize.height }}
        >
          {board.map((row, r) =>
              row.map((cell, c) => {
                  const isHighlighted = highlightedLines.some(line => line.coords.some(coord => coord.r === r && coord.c === c));
                  const isIncorrect = incorrectCell?.r === r && incorrectCell?.c === c;
                  const position = getCellPosition(r, c);
                  const style = {
                    ...position,
                    width: cellSize,
                    height: cellSize,
                  };
                  return (
                      <Cell
                          key={`${r}-${c}`}
                          number={cell.number}
                          owner={cell.owner}
                          onClick={() => onCellClick(r, c)}
                          disabled={disabled}
                          defender={defender}
                          isHighlighted={isHighlighted}
                          isIncorrect={isIncorrect}
                          isCircle={isHexagonalLayout}
                          style={style}
                          fontSizeClass={fontSizeClass}
                      />
                  );
              })
          )}
          <WinningLinesOverlay 
              lines={winningLines}
              highlightedLines={highlightedLines}
              gridSize={gridSize} 
              is3P={isHexagonalLayout}
              cellSize={cellSize}
              getCellPosition={getCellPosition}
          />
          {scorePopup && (() => {
            const pos = getCellPosition(scorePopup.r, scorePopup.c);
            const style = {
                position: 'absolute' as const,
                top: `${pos.top + cellSize / 2}px`,
                left: `${pos.left + cellSize / 2}px`,
                transform: 'translate(-50%, -50%)',
            };
             return <ScorePopup key={scorePopup.key} points={scorePopup.points} style={style} />;
          })()}
        </div>
    </div>
  );
};

export default GameBoardComponent;