import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Heart, ArrowUp } from 'lucide-react';
import confetti from 'canvas-confetti';

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.55;

export default function MarioGame({ onBack, onSaveScore, currentHigh = 0 }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);

  // Teclas presionadas
  const keys = useRef({ left: false, right: false, up: false });

  // Estado del juego en ref
  const gameState = useRef({
    cameraX: 0,
    player: {
      x: 60,
      y: 280,
      width: 28,
      height: 36,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      invulnerable: 0
    },
    // Plataformas y tuberías
    platforms: [
      { x: 0, y: 340, width: 2600, height: 60, type: 'ground' }, // Suelo largo
      // Bloques flotantes misteriosos y ladrillos
      { x: 200, y: 240, width: 36, height: 36, type: 'question', hit: false, content: 'coin' },
      { x: 236, y: 240, width: 36, height: 36, type: 'brick' },
      { x: 272, y: 240, width: 36, height: 36, type: 'question', hit: false, content: 'coin' },
      { x: 308, y: 240, width: 36, height: 36, type: 'brick' },
      { x: 344, y: 240, width: 36, height: 36, type: 'question', hit: false, content: 'star' },
      // Tubería verde 1
      { x: 450, y: 280, width: 50, height: 60, type: 'pipe' },
      // Tubería verde 2 más alta
      { x: 700, y: 250, width: 50, height: 90, type: 'pipe' },
      // Escalera de bloques
      { x: 900, y: 300, width: 36, height: 40, type: 'brick' },
      { x: 936, y: 260, width: 36, height: 80, type: 'brick' },
      { x: 972, y: 220, width: 36, height: 120, type: 'brick' },
      // Isla aérea con monedas flotantes
      { x: 1150, y: 200, width: 140, height: 30, type: 'brick' },
      { x: 1400, y: 260, width: 50, height: 80, type: 'pipe' },
      { x: 1650, y: 230, width: 120, height: 30, type: 'brick' },
      // Castillo final
      { x: 2200, y: 160, width: 140, height: 180, type: 'castle' },
      { x: 2150, y: 120, width: 16, height: 220, type: 'flagpole' }
    ],
    // Monedas flotantes
    coinsList: [
      { x: 238, y: 190, collected: false },
      { x: 310, y: 190, collected: false },
      { x: 580, y: 300, collected: false },
      { x: 620, y: 300, collected: false },
      { x: 1180, y: 155, collected: false },
      { x: 1230, y: 155, collected: false },
      { x: 1680, y: 185, collected: false },
      { x: 1720, y: 185, collected: false }
    ],
    // Enemigos estilo Goomba
    enemies: [
      { x: 380, y: 312, width: 28, height: 28, vx: -1.2, alive: true },
      { x: 600, y: 312, width: 28, height: 28, vx: -1.2, alive: true },
      { x: 820, y: 312, width: 28, height: 28, vx: 1.2, alive: true },
      { x: 1080, y: 312, width: 28, height: 28, vx: -1.5, alive: true },
      { x: 1500, y: 312, width: 28, height: 28, vx: -1.5, alive: true }
    ],
    score: 0,
    coins: 0,
    lives: 3
  });

  const resetGame = () => {
    gameState.current.player = {
      x: 60,
      y: 280,
      width: 28,
      height: 36,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      invulnerable: 0
    };
    gameState.current.cameraX = 0;
    gameState.current.score = 0;
    gameState.current.coins = 0;
    gameState.current.lives = 3;
    gameState.current.coinsList.forEach(c => (c.collected = false));
    gameState.current.enemies.forEach((e, idx) => {
      e.alive = true;
      e.x = 380 + idx * 250;
      e.vx = idx % 2 === 0 ? -1.2 : 1.2;
    });
    gameState.current.platforms.forEach(p => {
      if (p.type === 'question') p.hit = false;
    });

    setScore(0);
    setCoins(0);
    setLives(3);
    setGameOver(false);
    setGameWon(false);
  };

  // Controles
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        keys.current.up = true;
        // Salto directo
        const p = gameState.current.player;
        if (p.isGrounded) {
          p.vy = -12.5;
          p.isGrounded = false;
        }
      }
    };

    const onKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) keys.current.up = false;
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);

  const jumpMobile = () => {
    const p = gameState.current.player;
    if (p.isGrounded) {
      p.vy = -12.5;
      p.isGrounded = false;
    }
  };

  // Bucle de física y render
  useEffect(() => {
    let animId;

    const loop = () => {
      const state = gameState.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      if (!gameOver && !gameWon) {
        const p = state.player;

        // Movimiento Horizontal
        if (keys.current.left) {
          p.vx = -4.2;
          p.facing = 'left';
        } else if (keys.current.right) {
          p.vx = 4.2;
          p.facing = 'right';
        } else {
          p.vx *= 0.78; // fricción
        }

        // Aplicar gravedad
        p.vy += GRAVITY;
        if (p.vy > 14) p.vy = 14;

        // Actualizar X
        p.x += p.vx;
        if (p.x < 10) p.x = 10;

        // Colisión horizontal con plataformas sólidas
        state.platforms.forEach(plat => {
          if (plat.type === 'flagpole') return;
          if (
            p.x < plat.x + plat.width &&
            p.x + p.width > plat.x &&
            p.y < plat.y + plat.height &&
            p.y + p.height > plat.y
          ) {
            if (p.vx > 0) p.x = plat.x - p.width;
            else if (p.vx < 0) p.x = plat.x + plat.width;
          }
        });

        // Actualizar Y
        p.y += p.vy;
        p.isGrounded = false;

        // Colisión vertical con plataformas sólidas
        state.platforms.forEach(plat => {
          if (plat.type === 'flagpole') return;
          if (
            p.x < plat.x + plat.width &&
            p.x + p.width > plat.x &&
            p.y < plat.y + plat.height &&
            p.y + p.height > plat.y
          ) {
            // Cayendo sobre la plataforma
            if (p.vy > 0 && p.y + p.height - p.vy <= plat.y + 6) {
              p.y = plat.y - p.height;
              p.vy = 0;
              p.isGrounded = true;
            }
            // Chocando desde abajo (golpear bloque con la cabeza)
            else if (p.vy < 0 && p.y - p.vy >= plat.y + plat.height - 6) {
              p.y = plat.y + plat.height;
              p.vy = 1;
              if (plat.type === 'question' && !plat.hit) {
                plat.hit = true;
                state.score += 100;
                state.coins += 1;
                setScore(state.score);
                setCoins(state.coins);
              } else if (plat.type === 'brick') {
                state.score += 20;
                setScore(state.score);
              }
            }
          }
        });

        // Bandera de victoria
        if (p.x >= 2150) {
          setGameWon(true);
          confetti({ particleCount: 150, spread: 80, origin: { y: 0.5 } });
          onSaveScore(state.score + 1000);
        }

        // Monedas recolectadas
        state.coinsList.forEach(coin => {
          if (!coin.collected) {
            if (
              p.x < coin.x + 20 &&
              p.x + p.width > coin.x &&
              p.y < coin.y + 20 &&
              p.y + p.height > coin.y
            ) {
              coin.collected = true;
              state.coins += 1;
              state.score += 50;
              setCoins(state.coins);
              setScore(state.score);
            }
          }
        });

        // Invulnerabilidad post-daño
        if (p.invulnerable > 0) p.invulnerable--;

        // Movimiento de enemigos
        state.enemies.forEach(enemy => {
          if (!enemy.alive) return;
          enemy.x += enemy.vx;

          // Rebotar en tuberías o distancias
          if (enemy.x < 200 || enemy.x > 2100) enemy.vx *= -1;

          // Colisión Mario con enemigo
          if (
            p.x < enemy.x + enemy.width &&
            p.x + p.width > enemy.x &&
            p.y < enemy.y + enemy.height &&
            p.y + p.height > enemy.y
          ) {
            // Salto sobre la cabeza del enemigo (aplastarlo)
            if (p.vy > 0 && p.y + p.height - p.vy <= enemy.y + 12) {
              enemy.alive = false;
              p.vy = -8.5; // rebote alegre
              state.score += 150;
              setScore(state.score);
            } else if (p.invulnerable <= 0) {
              // Recibe daño
              state.lives--;
              setLives(state.lives);
              p.invulnerable = 60; // 1 segundo
              p.vy = -6;
              p.vx = p.facing === 'right' ? -4 : 4;

              if (state.lives <= 0) {
                setGameOver(true);
                onSaveScore(state.score);
              }
            }
          }
        });

        // Cámara de desplazamiento lateral suave
        const targetCamX = p.x - CANVAS_WIDTH / 3;
        state.cameraX = Math.max(0, Math.min(targetCamX, 2600 - CANVAS_WIDTH));
      }

      // ---------------- RENDERIZADO ----------------
      const camX = state.cameraX;

      // Cielo azul estilo Mario
      ctx.fillStyle = '#60a5fa';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Nubes decorativas y colinas de fondo
      ctx.fillStyle = '#ffffff';
      [150, 450, 800, 1200, 1600, 2000].forEach(cloudX => {
        const drawX = cloudX - camX * 0.4;
        ctx.beginPath();
        ctx.arc(drawX, 70, 24, 0, Math.PI * 2);
        ctx.arc(drawX + 25, 60, 32, 0, Math.PI * 2);
        ctx.arc(drawX + 50, 70, 24, 0, Math.PI * 2);
        ctx.fill();
      });

      // Colinas verdes suaves
      ctx.fillStyle = '#22c55e';
      [50, 600, 1100, 1750].forEach(hillX => {
        const drawX = hillX - camX * 0.6;
        ctx.beginPath();
        ctx.arc(drawX, 350, 80, Math.PI, 0);
        ctx.fill();
      });

      // Dibujar Plataformas, Bloques y Tuberías
      state.platforms.forEach(plat => {
        const px = plat.x - camX;
        if (px + plat.width < -50 || px > CANVAS_WIDTH + 50) return; // Fuera de pantalla

        if (plat.type === 'ground') {
          // Suelo verde con tierra marrón
          ctx.fillStyle = '#16a34a';
          ctx.fillRect(px, plat.y, plat.width, 14);
          ctx.fillStyle = '#92400e';
          ctx.fillRect(px, plat.y + 14, plat.width, plat.height - 14);
        } else if (plat.type === 'pipe') {
          // Tubería verde icónica
          ctx.fillStyle = '#15803d';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          // Borde superior más ancho de la tubería
          ctx.fillStyle = '#22c55e';
          ctx.fillRect(px - 4, plat.y, plat.width + 8, 16);
          ctx.strokeStyle = '#052e16';
          ctx.strokeRect(px - 4, plat.y, plat.width + 8, 16);
        } else if (plat.type === 'question') {
          // Bloque con interrogación ?
          ctx.fillStyle = plat.hit ? '#9ca3af' : '#f59e0b';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#78350f';
          ctx.strokeRect(px, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#ffffff';
          ctx.font = 'bold 20px monospace';
          ctx.fillText(plat.hit ? '•' : '?', px + 10, plat.y + 25);
        } else if (plat.type === 'brick') {
          // Bloque de ladrillo
          ctx.fillStyle = '#b45309';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#451a03';
          ctx.strokeRect(px, plat.y, plat.width, plat.height);
        } else if (plat.type === 'flagpole') {
          // Asta de la bandera
          ctx.fillStyle = '#f8fafc';
          ctx.fillRect(px + 6, plat.y, 4, plat.height);
          // Bandera roja
          ctx.fillStyle = '#ef4444';
          ctx.beginPath();
          ctx.moveTo(px + 10, plat.y + 10);
          ctx.lineTo(px + 45, plat.y + 25);
          ctx.lineTo(px + 10, plat.y + 40);
          ctx.fill();
        } else if (plat.type === 'castle') {
          // Castillo de llegada
          ctx.fillStyle = '#64748b';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          // Puerta del castillo
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(px + 45, plat.y + 100, 50, 80);
        }
      });

      // Monedas flotantes animadas
      state.coinsList.forEach(coin => {
        if (coin.collected) return;
        const cx = coin.x - camX;
        ctx.fillStyle = '#fbbf24';
        ctx.shadowColor = '#f59e0b';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.ellipse(cx + 10, coin.y + 10, 8, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // Dibujar Enemigos (Goombas)
      state.enemies.forEach(enemy => {
        if (!enemy.alive) return;
        const ex = enemy.x - camX;
        ctx.fillStyle = '#7c2d12';
        // Cabeza hongo
        ctx.beginPath();
        ctx.arc(ex + enemy.width / 2, enemy.y + 12, 14, Math.PI, 0);
        ctx.lineTo(ex + enemy.width, enemy.y + enemy.height);
        ctx.lineTo(ex, enemy.y + enemy.height);
        ctx.closePath();
        ctx.fill();

        // Ojos
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(ex + 4, enemy.y + 10, 4, 7);
        ctx.fillRect(ex + 18, enemy.y + 10, 4, 7);
        ctx.fillStyle = '#000000';
        ctx.fillRect(ex + 6, enemy.y + 12, 2, 4);
        ctx.fillRect(ex + 18, enemy.y + 12, 2, 4);
      });

      // Dibujar Jugador (Héroe Tipo Mario)
      const p = state.player;
      const px = p.x - camX;

      if (p.invulnerable % 8 < 4) {
        // Overol azul
        ctx.fillStyle = '#2563eb';
        ctx.fillRect(px + 4, p.y + 16, p.width - 8, 16);

        // Camisa roja
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 2, p.y + 10, p.width - 4, 8);

        // Cabeza / Cara
        ctx.fillStyle = '#fed7aa';
        ctx.beginPath();
        ctx.arc(px + p.width / 2, p.y + 8, 9, 0, Math.PI * 2);
        ctx.fill();

        // Gorra roja con visera
        ctx.fillStyle = '#ef4444';
        ctx.fillRect(px + 2, p.y - 2, p.width - 4, 6);
        if (p.facing === 'right') {
          ctx.fillRect(px + 12, p.y + 1, 14, 4); // visera a la derecha
        } else {
          ctx.fillRect(px - 2, p.y + 1, 14, 4); // visera a la izquierda
        }

        // Zapatos marrones
        ctx.fillStyle = '#78350f';
        ctx.fillRect(px + 2, p.y + p.height - 5, 10, 5);
        ctx.fillRect(px + 16, p.y + p.height - 5, 10, 5);
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, onSaveScore]);

  return (
    <div className="game-screen-container">
      {/* HUD Superior */}
      <div className="game-hud">
        <button onClick={onBack} className="btn-back-game flex items-center gap-1">
          <ArrowLeft size={18} /> Salir al Menú
        </button>

        <div className="flex items-center gap-6">
          <div className="hud-stat">
            <Trophy size={18} className="text-yellow-400" />
            <span>Puntos: <strong>{score}</strong></span>
            <span className="text-xs text-indigo-300 ml-1">(Récord: {currentHigh})</span>
          </div>

          <div className="hud-stat text-yellow-400 font-bold">
            🪙 {coins}
          </div>
        </div>

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

      {/* Pantalla del Juego */}
      <div className="canvas-wrapper relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas rounded-2xl shadow-2xl border-4 border-indigo-900"
        />

        {/* Game Over */}
        {gameOver && (
          <div className="canvas-overlay">
            <div className="overlay-box">
              <span className="text-5xl">🐢</span>
              <h2 className="text-2xl font-black text-white mt-2">¡Oh no! Te caíste</h2>
              <p className="text-gray-300 text-sm mt-1">¡Buen intento! Puedes volver a probar cuando quieras.</p>
              <p className="text-xl font-bold text-yellow-400 mt-2">Puntos: {score} | Monedas: {coins}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetGame} className="btn-primary flex items-center gap-2">
                  <RotateCcw size={18} /> Reintentar Nivel
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Menú de Juegos
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Ganó */}
        {gameWon && (
          <div className="canvas-overlay">
            <div className="overlay-box border-yellow-400 bg-indigo-950">
              <span className="text-5xl">🏰🎉</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-2">¡LLEGASTE AL CASTILLO!</h2>
              <p className="text-gray-200 text-sm mt-1">¡Completaste la súper misión!</p>
              <p className="text-2xl font-black text-green-400 mt-2">Puntuación Total: {score + 1000}</p>
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

      {/* Controles táctiles / accesibles */}
      <div className="mario-controls flex items-center justify-between max-w-xl mx-auto mt-4 px-4">
        <div className="flex gap-3">
          <button
            onMouseDown={() => (keys.current.left = true)}
            onMouseUp={() => (keys.current.left = false)}
            onTouchStart={() => (keys.current.left = true)}
            onTouchEnd={() => (keys.current.left = false)}
            className="action-btn px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95"
          >
            ◀ Izquierda (A)
          </button>
          <button
            onMouseDown={() => (keys.current.right = true)}
            onMouseUp={() => (keys.current.right = false)}
            onTouchStart={() => (keys.current.right = true)}
            onTouchEnd={() => (keys.current.right = false)}
            className="action-btn px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95"
          >
            Derecha (D) ▶
          </button>
        </div>

        <button
          onClick={jumpMobile}
          className="jump-btn px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl active:scale-95 flex items-center gap-2"
        >
          <ArrowUp size={24} /> ¡SALTAR!
        </button>
      </div>
    </div>
  );
}
