import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Heart, Volume2, VolumeX, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundFX';

const TILE_SIZE = 20;
const GRID_ROWS = 28;
const GRID_COLS = 28;

// 1 = Muro azul continuo
// 0 = Píldora amarilla (Pellet 10 pts)
// 3 = Energizer / Power Pellet (50 pts + asusta fantasmas)
// 2 = Camino vacío / Casa de fantasmas
// 4 = Puerta rosada de la casa de fantasmas
const ARCADE_PACMAN_MAP = [
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1],
  [1,3,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,3,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,1,1,0,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,1,1,1,1,1],
  [2,2,2,2,2,1,0,1,1,1,1,1,2,1,1,2,1,1,1,1,1,0,1,2,2,2,2,2],
  [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
  [2,2,2,2,2,1,0,1,1,2,1,1,1,4,4,1,1,1,2,1,1,0,1,2,2,2,2,2],
  [1,1,1,1,1,1,0,1,1,2,1,2,2,2,2,2,2,1,2,1,1,0,1,1,1,1,1,1],
  [2,2,2,2,2,2,0,2,2,2,1,2,2,2,2,2,2,1,2,2,2,0,2,2,2,2,2,2], // Túnel horizontal
  [1,1,1,1,1,1,0,1,1,2,1,2,2,2,2,2,2,1,2,1,1,0,1,1,1,1,1,1],
  [2,2,2,2,2,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,2,2,2,2,2],
  [2,2,2,2,2,1,0,1,1,2,2,2,2,2,2,2,2,2,2,1,1,0,1,2,2,2,2,2],
  [2,2,2,2,2,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,2,2,2,2,2],
  [1,1,1,1,1,1,0,1,1,2,1,1,1,1,1,1,1,1,2,1,1,0,1,1,1,1,1,1],
  [1,0,0,0,0,0,0,0,0,0,0,0,0,1,1,0,0,0,0,0,0,0,0,0,0,0,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,0,1,1,1,1,0,1,1,1,1,1,0,1,1,0,1,1,1,1,1,0,1,1,1,1,0,1],
  [1,3,0,0,1,1,0,0,0,0,0,0,0,2,2,0,0,0,0,0,0,0,1,1,0,0,3,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,1,1,0,1,1,0,1,1,0,1,1,1,1,1,1,1,1,0,1,1,0,1,1,0,1,1,1],
  [1,0,0,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,1,1,0,0,0,0,0,0,1],
  [1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]
];

// Comportamiento fiel de los 4 fantasmas arcade
const GHOST_DEFS = [
  { id: 'blinky', name: 'Blinky', color: '#ff0000', startX: 13, startY: 11, personality: 'chaser' },
  { id: 'pinky',  name: 'Pinky',  color: '#ffb8ff', startX: 14, startY: 14, personality: 'ambush' },
  { id: 'inky',   name: 'Inky',   color: '#00ffff', startX: 12, startY: 14, personality: 'flanker' },
  { id: 'clyde',  name: 'Clyde',  color: '#ffb852', startX: 15, startY: 14, personality: 'coward' }
];

export default function PacmanGame({ onBack, onSaveScore, currentHigh = 0 }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [frightenedTime, setFrightenedTime] = useState(0);
  const [fruitBonus, setFruitBonus] = useState(null);

  const gameState = useRef({
    map: JSON.parse(JSON.stringify(ARCADE_PACMAN_MAP)),
    pacman: { 
      x: 13.5, y: 23, 
      dx: 0, dy: 0, 
      nextDx: -1, nextDy: 0, 
      mouth: 0.2, mouthDir: 1, 
      angle: Math.PI 
    },
    ghosts: [],
    dotsLeft: 0,
    score: 0,
    level: 1,
    lives: 3,
    frightenedTimer: 0,
    ghostMultiplier: 1,
    fruit: null
  });

  const countDots = (map) => {
    let dots = 0;
    map.forEach(row => {
      row.forEach(cell => {
        if (cell === 0 || cell === 3) dots++;
      });
    });
    return dots;
  };

  const setupLevel = (lvl = 1) => {
    const freshMap = JSON.parse(JSON.stringify(ARCADE_PACMAN_MAP));
    gameState.current.map = freshMap;
    gameState.current.dotsLeft = countDots(freshMap);
    gameState.current.level = lvl;
    gameState.current.frightenedTimer = 0;
    gameState.current.ghostMultiplier = 1;
    gameState.current.fruit = { x: 13.5, y: 17, type: 'cherry', points: 100, active: true };
    setFruitBonus(gameState.current.fruit);

    // Resetear Pacman
    gameState.current.pacman = {
      x: 13.5,
      y: 23,
      dx: 0,
      dy: 0,
      nextDx: -1,
      nextDy: 0,
      mouth: 0.2,
      mouthDir: 1,
      angle: Math.PI
    };

    // Resetear Fantasmas con IA
    gameState.current.ghosts = GHOST_DEFS.map(g => ({
      ...g,
      x: g.startX,
      y: g.startY,
      dx: 0,
      dy: -1,
      isFrightened: false,
      isEaten: false,
      inHouse: g.startY > 12
    }));

    setFrightenedTime(0);
  };

  const resetFullGame = () => {
    gameState.current.score = 0;
    gameState.current.lives = 3;
    setScore(0);
    setLives(3);
    setLevel(1);
    setGameOver(false);
    setGameWon(false);
    setupLevel(1);
  };

  useEffect(() => {
    setupLevel(1);
  }, []);

  // Controles
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

  const handleMobileDir = (dx, dy) => {
    gameState.current.pacman.nextDx = dx;
    gameState.current.pacman.nextDy = dy;
  };

  // Motor de física y render
  useEffect(() => {
    let animId;
    let frame = 0;

    const loop = () => {
      const state = gameState.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      frame++;

      if (!gameOver && !gameWon) {
        // Reducir tiempo de asustados
        if (state.frightenedTimer > 0) {
          state.frightenedTimer--;
          setFrightenedTime(Math.ceil(state.frightenedTimer / 60));
          if (state.frightenedTimer === 0) {
            state.ghosts.forEach(g => {
              if (g.isFrightened) g.isFrightened = false;
            });
            state.ghostMultiplier = 1;
          }
        }

        // --- MOVIMIENTO DE PACMAN (Velocidad adaptativa por nivel) ---
        const pacSpeed = 0.16 + (state.level - 1) * 0.02;
        const p = state.pacman;

        // Intentar girar si está alineado a una celda
        const nearGridX = Math.round(p.x);
        const nearGridY = Math.round(p.y);
        const isAligned = Math.abs(p.x - nearGridX) < 0.25 && Math.abs(p.y - nearGridY) < 0.25;

        if (isAligned && (p.nextDx !== 0 || p.nextDy !== 0)) {
          const targetTile = state.map[nearGridY + p.nextDy]?.[nearGridX + p.nextDx];
          if (targetTile !== 1 && targetTile !== 4) {
            p.x = nearGridX;
            p.y = nearGridY;
            p.dx = p.nextDx;
            p.dy = p.nextDy;
            if (p.dx === 1) p.angle = 0;
            if (p.dx === -1) p.angle = Math.PI;
            if (p.dy === 1) p.angle = Math.PI * 0.5;
            if (p.dy === -1) p.angle = Math.PI * 1.5;
          }
        }

        // Mover en la dirección actual si no hay pared enfrente
        const checkTile = state.map[Math.round(p.y + p.dy * 0.55)]?.[Math.round(p.x + p.dx * 0.55)];
        if (checkTile !== 1 && checkTile !== 4) {
          p.x += p.dx * pacSpeed;
          p.y += p.dy * pacSpeed;
        }

        // Túnel horizontal envolvente (Warp Tunnel)
        if (p.x < -0.5) p.x = GRID_COLS - 0.5;
        if (p.x > GRID_COLS - 0.5) p.x = -0.5;

        // Comer puntos y energizers
        const curCellX = Math.round(p.x);
        const curCellY = Math.round(p.y);
        if (state.map[curCellY] && state.map[curCellY][curCellX] === 0) {
          state.map[curCellY][curCellX] = 2;
          state.score += 10;
          state.dotsLeft--;
          setScore(state.score);
          if (frame % 8 === 0) sounds.playWaka();
        } else if (state.map[curCellY] && state.map[curCellY][curCellX] === 3) {
          // Super Píldora
          state.map[curCellY][curCellX] = 2;
          state.score += 50;
          state.dotsLeft--;
          state.frightenedTimer = 360; // 6 segundos
          setFrightenedTime(6);
          state.ghostMultiplier = 1;
          state.ghosts.forEach(g => {
            if (!g.isEaten) g.isFrightened = true;
          });
          setScore(state.score);
          sounds.playPowerDot();
        }

        // Comer Fruta Bonus
        if (state.fruit && state.fruit.active) {
          if (Math.hypot(p.x - state.fruit.x, p.y - state.fruit.y) < 0.8) {
            state.fruit.active = false;
            state.score += state.fruit.points;
            setScore(state.score);
            sounds.playLevelComplete();
          }
        }

        // Victoria de Nivel
        if (state.dotsLeft <= 0) {
          sounds.playLevelComplete();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          const nextLvl = state.level + 1;
          setLevel(nextLvl);
          setupLevel(nextLvl);
          onSaveScore(state.score + 500);
        }

        // --- MOVIMIENTO DE FANTASMAS CON IA AUTÉNTICA ---
        const ghostSpeed = pacSpeed * 0.88;
        const validDirs = [
          { dx: 0, dy: -1 },
          { dx: 0, dy: 1 },
          { dx: -1, dy: 0 },
          { dx: 1, dy: 0 }
        ];

        state.ghosts.forEach((ghost, idx) => {
          // Salida de la casa de fantasmas
          if (ghost.inHouse) {
            ghost.y -= 0.08;
            if (ghost.y <= 11) {
              ghost.inHouse = false;
              ghost.y = 11;
            }
            return;
          }

          const gx = Math.round(ghost.x);
          const gy = Math.round(ghost.y);
          const gAligned = Math.abs(ghost.x - gx) < 0.18 && Math.abs(ghost.y - gy) < 0.18;

          if (gAligned) {
            ghost.x = gx;
            ghost.y = gy;

            // Determinar casillas accesibles sin devolverse 180°
            const possible = validDirs.filter(d => {
              if (d.dx === -ghost.dx && d.dy === -ghost.dy && (ghost.dx !== 0 || ghost.dy !== 0)) {
                return false; // No retroceder de golpe
              }
              const tile = state.map[gy + d.dy]?.[gx + d.dx];
              return tile !== 1 && tile !== 4;
            });

            if (possible.length > 0) {
              // Objetivo según personalidad
              let targetX = p.x;
              let targetY = p.y;

              if (ghost.isFrightened) {
                // Huir al azar
                const chosen = possible[Math.floor(Math.random() * possible.length)];
                ghost.dx = chosen.dx;
                ghost.dy = chosen.dy;
              } else {
                // Blinky persigue a Pacman directamente
                if (ghost.personality === 'ambush') {
                  // Pinky apunta 4 casillas adelante de Pacman
                  targetX = p.x + p.dx * 4;
                  targetY = p.y + p.dy * 4;
                } else if (ghost.personality === 'coward') {
                  // Clyde se acerca, pero si está muy cerca huye a la esquina
                  const dist = Math.hypot(ghost.x - p.x, ghost.y - p.y);
                  if (dist < 6) {
                    targetX = 0; targetY = GRID_ROWS;
                  }
                }

                // Elegir la dirección que minimice la distancia euclidiana
                possible.sort((a, b) => {
                  const distA = Math.hypot(gx + a.dx - targetX, gy + a.dy - targetY);
                  const distB = Math.hypot(gx + b.dx - targetX, gy + b.dy - targetY);
                  return distA - distB;
                });
                ghost.dx = possible[0].dx;
                ghost.dy = possible[0].dy;
              }
            }
          }

          ghost.x += ghost.dx * (ghost.isFrightened ? ghostSpeed * 0.6 : ghostSpeed);
          ghost.y += ghost.dy * (ghost.isFrightened ? ghostSpeed * 0.6 : ghostSpeed);

          // Colisión con Pacman
          const distToPacman = Math.hypot(ghost.x - p.x, ghost.y - p.y);
          if (distToPacman < 0.75) {
            if (ghost.isFrightened) {
              // Fantasma comido: 200, 400, 800, 1600 pts
              ghost.isFrightened = false;
              ghost.inHouse = true;
              ghost.x = 13.5;
              ghost.y = 14;
              const bonus = 200 * state.ghostMultiplier;
              state.score += bonus;
              state.ghostMultiplier *= 2;
              setScore(state.score);
              sounds.playEatGhost();
            } else {
              // Muerte de Pacman
              sounds.playDeath();
              state.lives--;
              setLives(state.lives);
              p.x = 13.5;
              p.y = 23;
              p.dx = 0;
              p.dy = 0;
              // Resetear posiciones de fantasmas a la casa
              state.ghosts.forEach(g => {
                g.x = g.startX;
                g.y = g.startY;
                g.inHouse = g.startY > 12;
              });

              if (state.lives <= 0) {
                setGameOver(true);
                onSaveScore(state.score);
              }
            }
          }
        });
      }

      // Animación de la boca
      const p = state.pacman;
      p.mouth += 0.05 * p.mouthDir;
      if (p.mouth > 0.45 || p.mouth < 0.05) p.mouthDir *= -1;

      // ---------------- RENDERIZADO CANVAS ARCADE ----------------
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, GRID_COLS * TILE_SIZE, GRID_ROWS * TILE_SIZE);

      // Dibujar Laberinto Fiel con Doble Línea Neón Azul
      for (let r = 0; r < GRID_ROWS; r++) {
        for (let c = 0; c < GRID_COLS; c++) {
          const tile = state.map[r][c];
          const px = c * TILE_SIZE;
          const py = r * TILE_SIZE;

          if (tile === 1) {
            // Pared Arcade azul oscuro con borde brillante
            ctx.fillStyle = '#030826';
            ctx.fillRect(px, py, TILE_SIZE, TILE_SIZE);
            ctx.strokeStyle = '#2563eb';
            ctx.lineWidth = 2.5;
            ctx.strokeRect(px + 1, py + 1, TILE_SIZE - 2, TILE_SIZE - 2);
          } else if (tile === 4) {
            // Puerta rosada de fantasmas
            ctx.fillStyle = '#ec4899';
            ctx.fillRect(px, py + 6, TILE_SIZE, 6);
          } else if (tile === 0) {
            // Bolita normal dorada / blanca
            ctx.fillStyle = '#ffb8ae';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 2.5, 0, Math.PI * 2);
            ctx.fill();
          } else if (tile === 3) {
            // Energizer titilante
            ctx.fillStyle = frame % 20 < 10 ? '#ffb8ae' : '#ff8000';
            ctx.beginPath();
            ctx.arc(px + TILE_SIZE / 2, py + TILE_SIZE / 2, 6, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // Dibujar Fruta Cereza
      if (state.fruit && state.fruit.active) {
        const fx = state.fruit.x * TILE_SIZE;
        const fy = state.fruit.y * TILE_SIZE;
        ctx.fillStyle = '#ef4444';
        ctx.beginPath();
        ctx.arc(fx - 4, fy + 4, 5, 0, Math.PI * 2);
        ctx.arc(fx + 4, fy + 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(fx - 4, fy + 2);
        ctx.quadraticCurveTo(fx, fy - 6, fx + 4, fy + 2);
        ctx.stroke();
      }

      // Dibujar Pacman Auténtico
      const pacPx = p.x * TILE_SIZE + TILE_SIZE / 2;
      const pacPy = p.y * TILE_SIZE + TILE_SIZE / 2;
      ctx.fillStyle = '#ffff00';
      ctx.beginPath();
      ctx.moveTo(pacPx, pacPy);
      ctx.arc(pacPx, pacPy, TILE_SIZE / 2 + 1, p.angle + p.mouth, p.angle + (Math.PI * 2 - p.mouth));
      ctx.closePath();
      ctx.fill();

      // Dibujar Fantasmas Arcade
      state.ghosts.forEach(ghost => {
        const gx = ghost.x * TILE_SIZE + TILE_SIZE / 2;
        const gy = ghost.y * TILE_SIZE + TILE_SIZE / 2;
        const rad = TILE_SIZE / 2;

        let gColor = ghost.color;
        if (ghost.isFrightened) {
          // Si quedan menos de 2 segundos, parpadea en blanco
          gColor = state.frightenedTimer < 120 && frame % 16 < 8 ? '#ffffff' : '#1e40af';
        }

        ctx.fillStyle = gColor;
        ctx.beginPath();
        ctx.arc(gx, gy - 2, rad, Math.PI, 0, false);
        // Falda ondulada en 3 patas
        ctx.lineTo(gx + rad, gy + rad);
        ctx.lineTo(gx + rad * 0.33, gy + rad * 0.6);
        ctx.lineTo(gx, gy + rad);
        ctx.lineTo(gx - rad * 0.33, gy + rad * 0.6);
        ctx.lineTo(gx - rad, gy + rad);
        ctx.closePath();
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(gx - 4, gy - 3, 3.5, 0, Math.PI * 2);
        ctx.arc(gx + 4, gy - 3, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Pupilas que miran en dirección del movimiento
        ctx.fillStyle = ghost.isFrightened ? '#f87171' : '#0000ff';
        ctx.beginPath();
        ctx.arc(gx - 4 + ghost.dx * 1.5, gy - 3 + ghost.dy * 1.5, 1.8, 0, Math.PI * 2);
        ctx.arc(gx + 4 + ghost.dx * 1.5, gy - 3 + ghost.dy * 1.5, 1.8, 0, Math.PI * 2);
        ctx.fill();
      });

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, onSaveScore]);

  return (
    <div className="game-screen-container">
      {/* HUD Arcade */}
      <div className="game-hud max-w-[560px]">
        <button onClick={onBack} className="btn-back-game flex items-center gap-1">
          <ArrowLeft size={16} /> Salir
        </button>

        <div className="flex items-center gap-4 text-xs font-mono">
          <div>
            <span className="text-gray-400 block text-[10px]">1UP PUNTOS</span>
            <strong className="text-white text-base">{score}</strong>
          </div>
          <div>
            <span className="text-gray-400 block text-[10px]">RÉCORD</span>
            <strong className="text-yellow-400 text-base">{Math.max(score, currentHigh)}</strong>
          </div>
          <div className="px-2 py-0.5 bg-indigo-900 rounded font-bold text-indigo-300">
            Nivel {level}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {frightenedTime > 0 && (
            <span className="text-xs bg-blue-600 text-white font-bold px-2 py-0.5 rounded animate-pulse">
              ⚡ {frightenedTime}s
            </span>
          )}
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <Heart
                key={i}
                size={18}
                className={i < lives ? 'text-red-500 fill-red-500' : 'text-gray-700'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Canvas Arcade */}
      <div className="canvas-wrapper relative">
        <canvas
          ref={canvasRef}
          width={GRID_COLS * TILE_SIZE}
          height={GRID_ROWS * TILE_SIZE}
          className="game-canvas rounded-b-xl border-4 border-indigo-950 shadow-2xl"
        />

        {gameOver && (
          <div className="canvas-overlay">
            <div className="overlay-box border-red-500">
              <span className="text-5xl">👾</span>
              <h2 className="text-2xl font-black text-red-500 mt-2 font-mono">GAME OVER</h2>
              <p className="text-gray-300 text-sm mt-1">Llegaste hasta el Nivel {level}</p>
              <p className="text-xl font-bold text-yellow-400 mt-2">Puntos: {score}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetFullGame} className="btn-primary flex items-center gap-2">
                  <RotateCcw size={16} /> Jugar de Nuevo
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Menú
                </button>
              </div>
            </div>
          </div>
        )}

        {gameWon && (
          <div className="canvas-overlay">
            <div className="overlay-box border-yellow-400">
              <span className="text-5xl">🏆</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-2 font-mono">¡NIVEL COMPLETADO!</h2>
              <p className="text-green-300 text-sm mt-1">¡Pasas al Nivel {level}!</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={() => setGameWon(false)} className="btn-primary">
                  Continuar
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles táctiles */}
      <div className="mobile-dpad">
        <div className="dpad-grid">
          <div />
          <button onClick={() => handleMobileDir(0, -1)} className="dpad-btn font-bold">▲</button>
          <div />
          <button onClick={() => handleMobileDir(-1, 0)} className="dpad-btn font-bold">◄</button>
          <button onClick={() => handleMobileDir(0, 1)} className="dpad-btn font-bold">▼</button>
          <button onClick={() => handleMobileDir(1, 0)} className="dpad-btn font-bold">►</button>
        </div>
      </div>
    </div>
  );
}
