import React from 'react';
import { GameBoard, Player } from '../types';
import { LEVEL_CONFIG, POINTS_MAP } from '../constants';

interface PrintableGridProps {
  board: GameBoard;
  levelConfig: typeof LEVEL_CONFIG[1];
  numPlayers: number;
}

const PrintableGrid: React.FC<PrintableGridProps> = ({ board, levelConfig, numPlayers }) => {
  const isHexagonal = numPlayers === 3;
  const gridSize = board.length;
  const players: Player[] = numPlayers === 3 ? ['Rouge', 'Bleu', 'Vert'] : ['Rouge', 'Bleu'];
  
  // Player assignments for layout
  const leftPlayers = [players[0]]; // Red
  const rightPlayers = [players[1]]; // Blue
  const bottomPlayer = numPlayers === 3 ? [players[2]] : []; // Green (only for 3 players)

  // Reduced grid width to give more space to player score sheets on the sides
  const containerWidth = 400;

  const renderSquareGrid = () => {
    const GAP_FRACTION = 0.25;
    const totalDivisionsWithGaps = gridSize + (gridSize - 1) * GAP_FRACTION;
    const cellSize = containerWidth / totalDivisionsWithGaps;
    const gap = cellSize * GAP_FRACTION;
    const totalGridSize = containerWidth;

    const getCellCenter = (r: number, c: number) => {
        const x = c * (cellSize + gap) + cellSize / 2;
        const y = r * (cellSize + gap) + cellSize / 2;
        return { x, y };
    };

    return (
        <div style={{ position: 'relative', width: `${totalGridSize}px`, height: `${totalGridSize}px` }}>
            <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0, zIndex: 1 }}>
                {Array.from({ length: gridSize }).map((_, r) =>
                    Array.from({ length: gridSize }).map((_, c) => {
                        const lines = [];
                        const start = getCellCenter(r, c);
                        // Line to the right
                        if (c < gridSize - 1) {
                            const end = getCellCenter(r, c + 1);
                            lines.push(<line key={`${r}-${c}-h`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#ccc" strokeWidth="2" />);
                        }
                        // Line below
                        if (r < gridSize - 1) {
                            const end = getCellCenter(r + 1, c);
                            lines.push(<line key={`${r}-${c}-v`} x1={start.x} y1={start.y} x2={end.x} y2={end.y} stroke="#ccc" strokeWidth="2" />);
                        }
                        return lines;
                    })
                )}
            </svg>
            {board.map((row, r) =>
                row.map((cell, c) => (
                    <div key={`${r}-${c}`} style={{
                        position: 'absolute',
                        top: `${r * (cellSize + gap)}px`,
                        left: `${c * (cellSize + gap)}px`,
                        width: `${cellSize}px`,
                        height: `${cellSize}px`,
                        border: '2px solid #333',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '20px',
                        fontWeight: 'bold',
                        boxSizing: 'border-box',
                        background: '#fff',
                        zIndex: 2,
                    }}>
                        {cell.number}
                    </div>
                ))
            )}
        </div>
    );
};

  const renderHexagonalGrid = () => {
    const ROW_OVERLAP_FACTOR = 0.134;
    const STAGGER_OFFSET_FACTOR = 0.5;
    const effectiveGridWidthInCells = gridSize + STAGGER_OFFSET_FACTOR;
    const cellSize = containerWidth / effectiveGridWidthInCells;
    const rowHeight = cellSize * (1 - ROW_OVERLAP_FACTOR);
    const containerHeight = cellSize + (gridSize - 1) * rowHeight;

    return (
      <div style={{ position: 'relative', width: `${containerWidth}px`, height: `${containerHeight}px`, margin: '0 auto' }}>
        {board.map((row, r) =>
          row.map((cell, c) => {
            const isStaggeredRow = r % 2 !== 0;
            const xOffset = isStaggeredRow ? cellSize * STAGGER_OFFSET_FACTOR : 0;
            const left = c * cellSize + xOffset;
            const top = r * rowHeight;
            return (
              <div key={`${r}-${c}`} style={{
                position: 'absolute',
                top: `${top}px`,
                left: `${left}px`,
                width: `${cellSize}px`,
                height: `${cellSize}px`,
                border: '1px solid #999',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                fontWeight: 'bold',
                boxSizing: 'border-box'
              }}>
                {cell.number}
              </div>
            );
          })
        )}
      </div>
    );
  };
  
    const renderScoreSheet = (player: Player, playerNum: number, isBottomPlayer: boolean) => {
    // More lines for side players, fewer (but wider) for the bottom player.
    const numLines = isBottomPlayer ? 15 : 20;

    const renderScoreLines = () => {
        const numColumns = isBottomPlayer ? 3 : 2; // 3 columns for bottom player, 2 for side players
        const linesPerColumn = Math.ceil(numLines / numColumns);

        const columns = [];
        for (let col = 0; col < numColumns; col++) {
            const start = col * linesPerColumn;
            const end = Math.min((col + 1) * linesPerColumn, numLines);

            if (start >= end) continue;

            columns.push(
                <div key={col} style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: 1 }}>
                    {Array.from({ length: end - start }).map((_, i) => (
                        <div key={start + i} style={{ borderBottom: '1px dotted #999', height: '16px' }}></div>
                    ))}
                </div>
            );
        }
        return (
            <div style={{ display: 'flex', gap: '20px' }}>
                {columns}
            </div>
        );
    };

    return (
        <div style={{ border: '1px solid #ccc', padding: '10px', borderRadius: '8px' }}>
            <h3 style={{ paddingBottom: '8px', marginBottom: '10px', fontSize: '16px', fontWeight: 'bold', borderBottom: '1px solid #ccc' }}>
                Joueur {playerNum} ({player})
            </h3>
            <div style={{ fontSize: '12px' }}>
                {renderScoreLines()}
            </div>
            <div style={{ marginTop: '15px', fontSize: '14px', fontWeight: 'bold' }}>
                Score final: ........................
            </div>
        </div>
    );
};


  return (
    <div style={{ 
        fontFamily: 'Arial, sans-serif', 
        padding: '20px', 
        color: '#000', 
        background: '#fff', 
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        gap: '20px',
        minHeight: '100%'
    }}>
      {/* Top Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '30px' }}>
        {/* Left Column: Player 1 */}
        <div style={{ flex: 1 }}>
          {leftPlayers.map(player => renderScoreSheet(player, players.indexOf(player) + 1, false))}
        </div>

        {/* Center Column: Grid and Info */}
        <div style={{ flex: '0 1 auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', textAlign: 'center', marginBottom: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px' }}>
            <span>Multiplicat</span>
            <span style={{ fontSize: '16px', fontWeight: 'normal', color: '#555', border: '1px solid #ccc', padding: '2px 8px', borderRadius: '6px' }}>
              {numPlayers} joueurs
            </span>
          </h1>
          <p style={{ textAlign: 'center', fontSize: '14px', marginBottom: '20px', color: '#555' }}>
            <strong>Niveau :</strong> {levelConfig.description.split(':')[0]} | <strong>Tables de l'attaquant :</strong> {levelConfig.attackerRange.min} à {levelConfig.attackerRange.max}
          </p>

          {isHexagonal ? renderHexagonalGrid() : renderSquareGrid()}

          <div style={{ marginTop: '25px', border: '1px solid #ccc', padding: '10px 15px', borderRadius: '8px', fontSize: '12px', textAlign: 'center' }}>
            <h4 style={{ fontWeight: 'bold', marginBottom: '5px' }}>Rappel des points d'alignement :</h4>
            <p>
              Ligne de 3 : <strong>{POINTS_MAP[3]} point</strong> | 
              Ligne de 4 : <strong>{POINTS_MAP[4]} points</strong> | 
              Ligne de 5 : <strong>{POINTS_MAP[5]} points</strong>
            </p>
          </div>
        </div>

        {/* Right Column: Player 2 */}
        <div style={{ flex: 1 }}>
          {rightPlayers.map(player => renderScoreSheet(player, players.indexOf(player) + 1, false))}
        </div>
      </div>
      
      {/* Bottom Section for Player 3 */}
      {numPlayers === 3 && (
        <div style={{ width: '100%', paddingTop: '10px', display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: '85%', maxWidth: '800px' }}>
              {bottomPlayer.map(player => renderScoreSheet(player, players.indexOf(player) + 1, true))}
            </div>
        </div>
      )}
    </div>
  );
};

export default PrintableGrid;