import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Volume2, Trophy, Heart, Clock } from 'lucide-react';
import confetti from 'canvas-confetti';

const TILE_SIZE = 24;
const GRID_ROWS = 19;
const GRID_COLS = 19;

// Mapa del laberinto estilo Pacman
// 1 = Pared, 0 = Pastilla/Punto, 2 = Vacío, 3 = Super Píldora Mágica
const INITIAL_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,3,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,0,1],
  [1,0,0,0,0,1,0,0,0,1,0,0,0,1,0,0,0,0,1],
  [1,1,1,1,0,1,1,1,2,1,2,1,1,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,2,1,1,2,1,1,2,1,0,1,1,1,1],
  [2,2,2,2,0,2,2,1,2,2,2,1,2,2,0,2,2,2,2],
  [1,1,1,1,0,1,2,1,1,1,1,1,2,1,0,1,1,1,1],
  [2,2,2,1,0,1,2,2,2,2,2,2,2,1,0,1,2,2,2],
  [1,1,1,1,0,1,0,1,1,1,1,1,0,1,0,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,1,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,0,1,1,1,0,1,0,1,1,1,0,1,1,0,1],
  [1,3,0,1,0,0,0,0,0,2,0,0,0,0,0,1,0,3,1],
  [1,1,0,1,0,1,0,1,1,1,1,1,0,1,0,1,0,1,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

export default function PacmanGame({ onBack, onSaveScore, currentHigh = 0 }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [powerMode, setPowerMode] = useState(0); // contador de segundos de poder

  // Game state en ref para loop sin lag
  const gameState = useRef({
    map: JSON.parse(JSON.stringify(INITIAL_MAP)),
    pacman: { x: 9, y: 14, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouthAngle: 0.2, mouthDir: 1 },
    ghosts: [
      { id: 'blinky', x: 9, y: 8, dx: 1, dy: 0, color: '#ef4444', isScared: false },
      { id: 'pinky', x: 8, y: 9, dx: -1, dy: 0, color: '#ec4899', isScared: false },
      { id: 'inky', x: 10, y: 9, dx: 0, dy: -1, color: '#06b6d4', isScared: false },
      { id: 'clyde', x: 9, y: 10, dx: 0, dy: 1, color: '#f97316', isScared: false }
    ],
    score: 0,
    dotsLeft: 0,
    lives: 3,
    powerTimer: 0
  });

  // Inicializar contador de bolitas
  useEffect(() => {
    let dots = 0;
    INITIAL_MAP.forEach(row => {
      row.forEach(cell => {
        if (cell === 0 || cell === 3) dots++;
      });
    });
    gameState.current.dotsLeft = dots;
  }, []);

  const resetGame = () => {
    let dots = 0;
    INITIAL_MAP.forEach(row => {
      row.forEach(cell => {
        if (cell === 0 || cell === 3) dots++;
      });
    });

    gameState.current = {
      map: JSON.parse(JSON.stringify(INITIAL_MAP)),
      pacman: { x: 9, y: 14, dx: 0, dy: 0, nextDx: 0, nextDy: 0, mouthAngle: 0.2, mouthDir: 1 },
      ghosts: [
        { id: 'blinky', x: 9, y: 8, dx: 1, dy: 0, color: '#ef4444', isScared: false },
        { id: 'pinky', x: 8, y: 9, dx: -1, dy: 0, color: '#ec4899', isScared: false },
        { id: 'inky', x: 10, y: 9, dx: 0, dy: -1, color: '#06b6d4', isScared: false },
        { id: 'clyde', x: 9, y: 10, dx: 0, dy: 1, color: '#f97316', isScared: false }
      ],
      score: 0,
      dotsLeft: dots,
      lives: 3,
      powerTimer: 0
    };
    setScore(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
    setPowerMode(0);
  };

  // Controles de teclado
  useEffect(() => {
    const handleKeyDown = (e) => {
      const p = gameState.current.pacman;
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        p.nextDx = 0; p.nextDy = -1;
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        p.nextDx = 0; p.nextDy = 1;
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        p.nextDx = -1; p.nextDy = 0;
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        p.nextDx = 1; p.nextDy = 0;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Botones táctiles / on-screen para niños pequeños
  const handleDirectionPress = (dx, dy) => {
    gameState.current.pacman.nextDx = dx;
    gameState.current.pacman.nextDy = dy;
  };

  // Bucle principal de juego
  useEffect(() => {
    let animationFrameId;
    let tickCount = 0;

    const gameLoop = () => {
      const state = gameState.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      tickCount++;

      // Movimiento cada 8 frames para ritmo adecuado a niños
      if (tickCount % 8 === 0 && !gameOver && !gameWon) {
        // Reducir temporizador de poder
        if (state.powerTimer > 0) {
          state.powerTimer--;
          setPowerMode(state.powerTimer);
          if (state.powerTimer === 0) {
            state.ghosts.forEach(g => (g.isScared = false));
          }
        }

        // Intento de cambio de dirección de Pacman
        const p = state.pacman;
        const targetX = p.x + p.nextDx;
        const targetY = p.y + p.nextDy;
        if (state.map[targetY] && state.map[targetY][targetX] !== 1) {
          p.dx = p.nextDx;
          p.dy = p.nextDy;
        }

        // Mover Pacman
        const nextX = p.x + p.dx;
        const nextY = p.y + p.dy;

        // Teletransportación por túneles
        let finalX = nextX;
        let finalY = nextY;
        if (nextX < 0) finalX = GRID_COLS - 1;
        if (nextX >= GRID_COLS) finalX = 0;

        if (state.map[finalY] && state.map[finalY][finalX] !== 1) {
          p.x = finalX;
          p.y = finalY;

          // Comer bolitas
          if (state.map[p.y][p.x] === 0) {
            state.map[p.y][p.x] = 2;
            state.score += 10;
            state.dotsLeft--;
            setScore(state.score);
          } else if (state.map[p.y][p.x] === 3) {
            // Súper píldora mágica
            state.map[p.y][p.x] = 2;
            state.score += 50;
            state.dotsLeft--;
            state.powerTimer = 45; // ~7 segundos
            setPowerMode(45);
            state.ghosts.forEach(g => (g.isScared = true));
            setScore(state.score);
          }
        }

        // Mover fantasmas
        const validDirs = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 }
        ];

        state.ghosts.forEach(ghost => {
          // Filtrar direcciones que no sean paredes
          const possible = validDirs.filter(d => {
            const gx = ghost.x + d.dx;
            const gy = ghost.y + d.dy;
            return state.map[gy] && state.map[gy][gx] !== 1;
          });

          if (possible.length > 0) {
            // 70% probabilidad de ir hacia pacman si no está asustado, 30% azar
            let chosen = possible[Math.floor(Math.random() * possible.length)];
            if (!ghost.isScared && Math.random() < 0.6) {
              possible.sort((a, b) => {
                const distA = Math.hypot(ghost.x + a.dx - p.x, ghost.y + a.dy - p.y);
                const distB = Math.hypot(ghost.x + b.dx - p.x, ghost.y + b.dy - p.y);
                return distA - distB;
              });
              chosen = possible[0];
            } else if (ghost.isScared) {
              // Huir
              possible.sort((a, b) => {
                const distA = Math.hypot(ghost.x + a.dx - p.x, ghost.y + a.dy - p.y);
                const distB = Math.hypot(ghost.x + b.dx - p.x, ghost.y + b.dy - p.y);
                return distB - distA;
              });
              chosen = possible[0];
            }

            ghost.dx = chosen.dx;
            ghost.dy = chosen.dy;
            ghost.x += ghost.dx;
            ghost.y += ghost.dy;
          }

          // Colisión con Pacman
          if (ghost.x === p.x && ghost.y === p.y) {
            if (ghost.isScared) {
              // Fantasma comido
              ghost.x = 9;
              ghost.y = 9;
              ghost.isScared = false;
              state.score += 200;
              setScore(state.score);
            } else {
              // Pierde vida
              state.lives--;
              setLives(state.lives);
              p.x = 9;
              p.y = 14;
              p.dx = 0;
              p.dy = 0;
              if (state.lives <= 0) {
                setGameOver(true);
                onSaveScore(state.score);
              }
            }
          }
        });

        // Verificar victoria
        if (state.dotsLeft <= 0) {
          setGameWon(true);
          confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
          onSaveScore(state.score + 500);
        }
      }

      // Animación boca Pacman
      state.pacman.mouthAngle += 0.04 * state.pacman.mouthDir;
      if (state.pacman.mouthAngle > 0.45 || state.pacman.mouthAngle < 0.05) {
        state.pacman.mouthDir *= -1;
      }

      // RENDERIZADO EN CANVAS
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, GRID_COLS * TILE_SIZE, GRID_ROWS * TILE_SIZE);

      // Dibujar Mapa
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = state.map[r][c];
          const px = c * TILE_SIZE;
          const py = r * TILE_SIZE;

          if (tile === 1) {
            // Muro redondeado arcade neón
            ctx.fillStyle = '#1e3a8a';
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.roundRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2, 5);
            ctx.fill();
            ctx.stroke();
          } else if (tile === 0) {
            // Bolita dorada pequeña
            ctx.fillStyle = '#fbbf24';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 3, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 3) {
            // Super píldora mágica titilante
            ctx.fillStyle = '#f59e0b';
            ctx.shadowColor = '#fbbf24';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
          }
        }
      }

      // Dibujar Pacman
      const pac = state.pacman;
      const pacX = pac.x * TILE_SIZE + TILE_SIZE / 2;
      const pacY = pac.y * TILE_SIZE + TILE_SIZE / 2;
      let startAngle = pac.mouthAngle;
      let endAngle = Math.PI * 2 - pac.mouthAngle;

      // Rotar según dirección
      if (pac.dx === -1) {
        startAngle += Math.PI;
        endAngle += Math.PI;
      } else if (pac.dy === -1) {
        startAngle += Math.PI * 1.5;
        endAngle += Math.PI * 1.5;
      } else if (pac.dy === 1) {
        startAngle += Math.PI * 0.5;
        endAngle += Math.PI * 0.5;
      }

      ctx.fillStyle = '#facc15';
      ctx.beginPath();
      ctx.moveTo(pacX, pacY);
      ctx.arc(pacX, pacY, TILE_SIZE / 2 - 2, startAngle, endAngle);
      ctx.closePath();
      ctx.fill();

      // Ojo de Pacman
      ctx.fillStyle = '#000';
      ctx.beginPath();
      ctx.arc(pacX - (pac.dx || 1) * 2, pacY - 5, 2, 0, Math.PI * 2);
      ctx.fill();

      // Dibujar Fantasmas
      state.ghosts.forEach(ghost => {
        const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
        const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
        const rad = TILE_SIZE / 2 - 2;

        ctx.fillStyle = ghost.isScared ? (state.powerTimer < 10 && tickCount % 4 < 2 ? '#ffffff' : '#2563eb') : ghost.color;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, rad, Math.PI, 0, false);
        // Falda ondulada fantasma
        ctx.lineTo(gx + rad, gy + rad);
        ctx.lineTo(gx + rad * 0.33, gy + rad * 0.6);
        ctx.lineTo(gx - rad * 0.33, gy + rad);
        ctx.lineTo(gx - rad, gy + rad * 0.6);
        ctx.closePath();
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 4, 3, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas
        ctx.fillStyle = ghost.isScared ? '#ef4444' : '#1e1b4b';
        ctx.beginPath();
        ctx.arc(gx - 4 + (ghost.dx * 1.5), gy - 4 + (ghost.dy * 1.5), 1.5, 0, Math.PI * 2);
        ctx.arc(gx + 4 + (ghost.dx * 1.5), gy - 4 + (ghost.dy * 1.5), 1.5, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(gameLoop);
    };

    animationFrameId = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [gameOver, gameWon, onSaveScore]);

  return (
    <div className="game-screen-container">
      {/* Barra superior de juego */}
      <div className="game-hud">
        <button onClick={onBack} className="btn-back-game flex items-center gap-1">
          <ArrowLeft size={18} /> Salir al Menú
        </button>

        <div className="hud-stat">
          <Trophy size={18} className="text-yellow-400" />
          <span>Puntos: <strong>{score}</strong></span>
          <span className="text-xs text-indigo-300 ml-2">(Récord: {currentHigh})</span>
        </div>

        <div className="flex items-center gap-2">
          {powerMode > 0 && (
            <span className="badge-power animate-pulse">
              ⚡ ¡PODER MÁGICO! ({Math.ceil(powerMode / 6)}s)
            </span>
          )}
          <div className="hud-lives flex items-center gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={20}
                className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-600'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Área del Canvas */}
      <div className="canvas-wrapper relative">
        <canvas
          ref={canvasRef}
          width={GRID_COLS * TILE_SIZE}
          height={GRID_ROWS * TILE_SIZE}
          className="game-canvas rounded-2xl shadow-2xl border-4 border-indigo-900"
        />

        {/* Modal Fin de Juego */}
        {gameOver && (
          <div className="canvas-overlay">
            <div className="overlay-box">
              <span className="text-5xl">👻</span>
              <h2 className="text-2xl font-black text-white mt-2">¡Fin del Juego!</h2>
              <p className="text-gray-300 text-sm mt-1">Los fantasmas te atraparon. ¡Gran intento!</p>
              <p className="text-xl font-bold text-yellow-400 mt-2">Puntuación: {score}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetGame} className="btn-primary flex items-center gap-2">
                  <RotateCcw size={18} /> Jugar de Nuevo
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Volver al Menú
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal Victoria */}
        {gameWon && (
          <div className="canvas-overlay">
            <div className="overlay-box border-yellow-400 bg-indigo-950">
              <span className="text-5xl">🏆</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-2">¡GANASTE CAMPEÓN!</h2>
              <p className="text-gray-200 text-sm mt-1">¡Limpiaste todo el laberinto!</p>
              <p className="text-2xl font-black text-green-400 mt-2">Puntuación Final: {score + 500}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetGame} className="btn-primary flex items-center gap-2">
                  <RotateCcw size={18} /> Jugar Otra Vez
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Menú Principal
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles táctiles en pantalla para niños o pantallas táctiles */}
      <div className="mobile-dpad">
        <p className="text-xs text-gray-400 text-center mb-2 font-medium">
          Usa las flechas del teclado (o botones aquí abajo):
        </p>
        <div className="dpad-grid">
          <div />
          <button onClick={() => handleDirectionPress(0, -1)} className="dpad-btn">▲</button>
          <div />
          <button onClick={() => handleDirectionPress(-1, 0)} className="dpad-btn">◄</button>
          <button onClick={() => handleDirectionPress(0, 1)} className="dpad-btn">▼</button>
          <button onClick={() => handleDirectionPress(1, 0)} className="dpad-btn">►</button>
        </div>
      </div>
    </div>
  );
}
