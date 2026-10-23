import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Heart, ArrowUp } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/soundFX';

const CANVAS_WIDTH = 750;
const CANVAS_HEIGHT = 400;
const GRAVITY = 0.58;

// Sprites de personajes dibujados en pixel art en canvas
function drawMarioSprite(ctx, x, y, width, height, facing, isSuper, isWalking, walkFrame) {
  ctx.save();
  if (facing === 'left') {
    ctx.translate(x + width, y);
    ctx.scale(-1, 1);
    x = 0;
    y = 0;
  }

  const red = isSuper ? '#ffffff' : '#e52521';
  const blue = isSuper ? '#e52521' : '#0026ff';
  const skin = '#fcd19c';
  const brown = '#6c3000';

  // Gorra roja
  ctx.fillStyle = red;
  ctx.fillRect(x + 6, y, width - 10, 6);
  ctx.fillRect(x + 4, y + 4, width - 4, 4);

  // Cara y nariz
  ctx.fillStyle = skin;
  ctx.fillRect(x + 4, y + 8, width - 8, 8);
  ctx.fillRect(x + width - 6, y + 8, 4, 4); // Nariz saliente

  // Bigote marrón
  ctx.fillStyle = brown;
  ctx.fillRect(x + width - 10, y + 12, 8, 4);
  // Ojo
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + width - 12, y + 8, 3, 4);

  // Camisa roja y cuerpo
  ctx.fillStyle = red;
  ctx.fillRect(x + 4, y + 16, width - 8, 10);

  // Overol azul
  ctx.fillStyle = blue;
  ctx.fillRect(x + 6, y + 20, width - 12, 10);
  // Tirantes y botones amarillos
  ctx.fillStyle = '#facc15';
  ctx.fillRect(x + 8, y + 20, 3, 3);
  ctx.fillRect(x + width - 11, y + 20, 3, 3);

  // Piernas y botas animadas
  ctx.fillStyle = brown;
  if (isWalking && walkFrame % 2 === 0) {
    ctx.fillRect(x + 2, y + height - 6, 8, 6);
    ctx.fillRect(x + width - 8, y + height - 8, 8, 6);
  } else {
    ctx.fillRect(x + 4, y + height - 6, 8, 6);
    ctx.fillRect(x + width - 12, y + height - 6, 8, 6);
  }

  ctx.restore();
}

function drawGoomba(ctx, x, y, width, height, frame) {
  const brown = '#b04a00';
  const stem = '#fed7aa';
  // Sombrero de hongo
  ctx.fillStyle = brown;
  ctx.beginPath();
  ctx.arc(x + width / 2, y + 12, width / 2, Math.PI, 0);
  ctx.lineTo(x + width, y + height - 6);
  ctx.lineTo(x, y + height - 6);
  ctx.closePath();
  ctx.fill();

  // Tallo
  ctx.fillStyle = stem;
  ctx.fillRect(x + 6, y + 16, width - 12, height - 22);

  // Ojos enfadados
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x + 6, y + 12, 4, 7);
  ctx.fillRect(x + width - 10, y + 12, 4, 7);
  ctx.fillStyle = '#000000';
  ctx.fillRect(x + 8, y + 13, 2, 5);
  ctx.fillRect(x + width - 10, y + 13, 2, 5);

  // Cejas inclinadas de enfado
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.moveTo(x + 5, y + 11);
  ctx.lineTo(x + 11, y + 14);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(x + width - 5, y + 11);
  ctx.lineTo(x + width - 11, y + 14);
  ctx.stroke();

  // Pies que marchan
  ctx.fillStyle = '#000000';
  if (frame % 2 === 0) {
    ctx.fillRect(x, y + height - 6, 10, 6);
    ctx.fillRect(x + width - 8, y + height - 4, 8, 4);
  } else {
    ctx.fillRect(x + 2, y + height - 4, 8, 4);
    ctx.fillRect(x + width - 10, y + height - 6, 10, 6);
  }
}

export default function MarioGame({ onBack, onSaveScore, currentHigh = 0 }) {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [coins, setCoins] = useState(0);
  const [lives, setLives] = useState(3);
  const [world, setWorld] = useState('1-1');
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [timeLeft, setTimeLeft] = useState(400);

  const keys = useRef({ left: false, right: false, up: false });

  const gameState = useRef({
    cameraX: 0,
    walkFrame: 0,
    timer: 400,
    player: {
      x: 60,
      y: 280,
      width: 28,
      height: 38,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      invulnerable: 0,
      isSuper: false
    },
    // Bloques y tuberías estilo World 1-1
    platforms: [
      // Fila de suelo con precipicio
      { x: 0, y: 340, width: 950, height: 60, type: 'ground' },
      { x: 1040, y: 340, width: 600, height: 60, type: 'ground' }, // precipicio entre 950 y 1040
      { x: 1720, y: 340, width: 1200, height: 60, type: 'ground' },

      // Bloques interrogación y ladrillos clásicos de 1-1
      { x: 240, y: 240, width: 32, height: 32, type: 'question', hit: false, content: 'coin' },
      { x: 300, y: 240, width: 32, height: 32, type: 'brick' },
      { x: 332, y: 240, width: 32, height: 32, type: 'question', hit: false, content: 'mushroom' },
      { x: 364, y: 240, width: 32, height: 32, type: 'brick' },
      { x: 396, y: 240, width: 32, height: 32, type: 'question', hit: false, content: 'coin' },
      { x: 428, y: 240, width: 32, height: 32, type: 'brick' },

      // Bloque superior solitario
      { x: 364, y: 140, width: 32, height: 32, type: 'question', hit: false, content: 'coin' },

      // Tuberías de alturas crecientes
      { x: 540, y: 280, width: 48, height: 60, type: 'pipe' },
      { x: 740, y: 250, width: 48, height: 90, type: 'pipe' },
      { x: 900, y: 220, width: 48, height: 120, type: 'pipe' },

      // Pirámide de ladrillos
      { x: 1300, y: 308, width: 32, height: 32, type: 'brick' },
      { x: 1332, y: 308, width: 32, height: 32, type: 'brick' },
      { x: 1332, y: 276, width: 32, height: 32, type: 'brick' },
      { x: 1364, y: 308, width: 32, height: 32, type: 'brick' },
      { x: 1364, y: 276, width: 32, height: 32, type: 'brick' },
      { x: 1364, y: 244, width: 32, height: 32, type: 'brick' },

      // Escalera final hacia el asta
      { x: 2200, y: 308, width: 32, height: 32, type: 'brick' },
      { x: 2232, y: 276, width: 32, height: 64, type: 'brick' },
      { x: 2264, y: 244, width: 32, height: 96, type: 'brick' },
      { x: 2296, y: 212, width: 32, height: 128, type: 'brick' },
      { x: 2328, y: 180, width: 32, height: 160, type: 'brick' },

      // Asta de bandera y Castillo
      { x: 2460, y: 80, width: 14, height: 260, type: 'flagpole' },
      { x: 2550, y: 160, width: 150, height: 180, type: 'castle' }
    ],
    // Champiñones de poder que salen
    mushrooms: [],
    // Partículas de ladrillos rotos
    particles: [],
    // Goombas clásicos
    enemies: [
      { x: 380, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 620, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 820, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 1140, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 1190, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 1500, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 },
      { x: 1780, y: 312, width: 28, height: 28, vx: -1.2, alive: true, flatTimer: 0 }
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
      height: 38,
      vx: 0,
      vy: 0,
      isGrounded: false,
      facing: 'right',
      invulnerable: 0,
      isSuper: false
    };
    gameState.current.cameraX = 0;
    gameState.current.timer = 400;
    gameState.current.score = 0;
    gameState.current.coins = 0;
    gameState.current.lives = 3;
    gameState.current.mushrooms = [];
    gameState.current.particles = [];
    gameState.current.enemies.forEach((e, idx) => {
      e.alive = true;
      e.flatTimer = 0;
      e.x = 380 + idx * 230;
      e.vx = -1.2;
    });
    gameState.current.platforms.forEach(p => {
      if (p.type === 'question') p.hit = false;
    });

    setScore(0);
    setCoins(0);
    setLives(3);
    setTimeLeft(400);
    setGameOver(false);
    setGameWon(false);
  };

  // Controles
  useEffect(() => {
    const onKeyDown = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = true;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = true;
      if (['ArrowUp', 'KeyW', 'Space'].includes(e.code)) {
        const p = gameState.current.player;
        if (p.isGrounded) {
          p.vy = -13.2;
          p.isGrounded = false;
          sounds.playMarioJump();
        }
      }
    };

    const onKeyUp = (e) => {
      if (['ArrowLeft', 'KeyA'].includes(e.code)) keys.current.left = false;
      if (['ArrowRight', 'KeyD'].includes(e.code)) keys.current.right = false;
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
      p.vy = -13.2;
      p.isGrounded = false;
      sounds.playMarioJump();
    }
  };

  // Temporizador de nivel retro (400 segundos)
  useEffect(() => {
    if (gameOver || gameWon) return;
    const interval = setInterval(() => {
      gameState.current.timer--;
      setTimeLeft(gameState.current.timer);
      if (gameState.current.timer <= 0) {
        sounds.playDeath();
        setGameOver(true);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [gameOver, gameWon]);

  // Bucle de física auténtica
  useEffect(() => {
    let animId;
    let tick = 0;

    const loop = () => {
      const state = gameState.current;
      const ctx = canvasRef.current?.getContext('2d');
      if (!ctx) return;

      tick++;

      if (!gameOver && !gameWon) {
        const p = state.player;

        // Movimiento Horizontal con inercia
        if (keys.current.left) {
          p.vx = Math.max(p.vx - 0.45, -4.5);
          p.facing = 'left';
          if (tick % 6 === 0) state.walkFrame++;
        } else if (keys.current.right) {
          p.vx = Math.min(p.vx + 0.45, 4.5);
          p.facing = 'right';
          if (tick % 6 === 0) state.walkFrame++;
        } else {
          p.vx *= 0.8;
          if (Math.abs(p.vx) < 0.1) p.vx = 0;
        }

        // Gravedad
        p.vy += GRAVITY;
        if (p.vy > 14) p.vy = 14;

        // Actualizar X y colisiones laterales
        p.x += p.vx;
        if (p.x < 10) p.x = 10;

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

        // Actualizar Y y colisiones verticales
        p.y += p.vy;
        p.isGrounded = false;

        // Caída al precipicio
        if (p.y > 450) {
          sounds.playDeath();
          state.lives--;
          setLives(state.lives);
          if (state.lives <= 0) {
            setGameOver(true);
            onSaveScore(state.score);
          } else {
            // Respawn en plataforma segura previa
            p.x = Math.max(60, state.cameraX + 40);
            p.y = 100;
            p.vx = 0;
            p.vy = 0;
          }
        }

        state.platforms.forEach(plat => {
          if (plat.type === 'flagpole') return;
          if (
            p.x < plat.x + plat.width &&
            p.x + p.width > plat.x &&
            p.y < plat.y + plat.height &&
            p.y + p.height > plat.y
          ) {
            // Aterrizando encima
            if (p.vy > 0 && p.y + p.height - p.vy <= plat.y + 8) {
              p.y = plat.y - p.height;
              p.vy = 0;
              p.isGrounded = true;
            }
            // Cabeceando el bloque desde abajo
            else if (p.vy < 0 && p.y - p.vy >= plat.y + plat.height - 8) {
              p.y = plat.y + plat.height;
              p.vy = 1;

              if (plat.type === 'question' && !plat.hit) {
                plat.hit = true;
                if (plat.content === 'coin') {
                  state.score += 200;
                  state.coins += 1;
                  setScore(state.score);
                  setCoins(state.coins);
                  sounds.playCoin();
                } else if (plat.content === 'mushroom') {
                  state.mushrooms.push({ x: plat.x, y: plat.y - 30, vx: 1.5, vy: 0, collected: false });
                  sounds.playPowerUp();
                }
              } else if (plat.type === 'brick') {
                if (p.isSuper) {
                  // Romper ladrillo
                  sounds.playStomp();
                  state.score += 50;
                  setScore(state.score);
                } else {
                  sounds.playStomp();
                }
              }
            }
          }
        });

        // Champiñones de poder
        state.mushrooms.forEach(m => {
          if (m.collected) return;
          m.x += m.vx;
          m.y += m.vy;
          m.vy += GRAVITY * 0.5;

          // Recoger Champiñón
          if (
            p.x < m.x + 24 &&
            p.x + p.width > m.x &&
            p.y < m.y + 24 &&
            p.y + p.height > m.y
          ) {
            m.collected = true;
            p.isSuper = true;
            state.score += 1000;
            setScore(state.score);
            sounds.playPowerUp();
          }
        });

        // Bandera de llegada al castillo (Asta)
        if (p.x >= 2460) {
          sounds.playLevelComplete();
          setGameWon(true);
          confetti({ particleCount: 180, spread: 90, origin: { y: 0.5 } });
          onSaveScore(state.score + state.timer * 50);
        }

        // Invulnerabilidad
        if (p.invulnerable > 0) p.invulnerable--;

        // Goombas
        state.enemies.forEach(enemy => {
          if (!enemy.alive) {
            if (enemy.flatTimer > 0) enemy.flatTimer--;
            return;
          }

          enemy.x += enemy.vx;
          if (enemy.x < 150 || enemy.x > 2400) enemy.vx *= -1;

          // Colisión Mario vs Goomba
          if (
            p.x < enemy.x + enemy.width &&
            p.x + p.width > enemy.x &&
            p.y < enemy.y + enemy.height &&
            p.y + p.height > enemy.y
          ) {
            // Aplastado desde arriba
            if (p.vy > 0 && p.y + p.height - p.vy <= enemy.y + 14) {
              enemy.alive = false;
              enemy.flatTimer = 30; // Mostrar aplastado
              p.vy = -9;
              state.score += 200;
              setScore(state.score);
              sounds.playStomp();
            } else if (p.invulnerable <= 0) {
              // Recibe daño
              if (p.isSuper) {
                p.isSuper = false;
                p.invulnerable = 60;
                sounds.playDeath();
              } else {
                sounds.playDeath();
                state.lives--;
                setLives(state.lives);
                p.invulnerable = 60;
                p.vy = -6;
                p.vx = p.facing === 'right' ? -4 : 4;

                if (state.lives <= 0) {
                  setGameOver(true);
                  onSaveScore(state.score);
                }
              }
            }
          }
        });

        // Cámara de desplazamiento lateral continua
        const targetCamX = p.x - CANVAS_WIDTH / 3;
        state.cameraX = Math.max(0, Math.min(targetCamX, 2900 - CANVAS_WIDTH));
      }

      // ---------------- RENDERIZADO CANVAS FIEL ----------------
      const camX = state.cameraX;

      // Cielo NES Azul
      ctx.fillStyle = '#5c94fc';
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

      // Colinas verdes redondeadas con ojos clásicos
      [40, 560, 1120, 1680, 2240].forEach(hx => {
        const cx = hx - camX * 0.7;
        ctx.fillStyle = '#00a800';
        ctx.beginPath();
        ctx.arc(cx + 80, 340, 75, Math.PI, 0);
        ctx.fill();
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Ojos de las colinas
        ctx.fillStyle = '#000000';
        ctx.fillRect(cx + 60, 290, 5, 12);
        ctx.fillRect(cx + 95, 290, 5, 12);
      });

      // Nubes clásicas de 3 círculos
      [140, 480, 890, 1340, 1800, 2300].forEach(nx => {
        const cx = nx - camX * 0.4;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(cx, 80, 20, 0, Math.PI * 2);
        ctx.arc(cx + 25, 70, 30, 0, Math.PI * 2);
        ctx.arc(cx + 50, 80, 20, 0, Math.PI * 2);
        ctx.fill();
      });

      // Dibujar Suelo, Bloques y Tuberías con textura NES
      state.platforms.forEach(plat => {
        const px = plat.x - camX;
        if (px + plat.width < -60 || px > CANVAS_WIDTH + 60) return;

        if (plat.type === 'ground') {
          // Bloques de tierra estilo ladrillo marrón
          ctx.fillStyle = '#d88b28';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#000000';
          // Dibujar líneas de ladrillos en el suelo
          for (let gx = px; gx < px + plat.width; gx += 32) {
            ctx.strokeRect(gx, plat.y, 32, 16);
            ctx.strokeRect(gx, plat.y + 16, 32, 16);
          }
        } else if (plat.type === 'pipe') {
          // Tubería verde con reflejo
          ctx.fillStyle = '#00a800';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#80d010'; // brillo
          ctx.fillRect(px + 4, plat.y, 8, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.lineWidth = 2;
          ctx.strokeRect(px, plat.y, plat.width, plat.height);
          // Labio de la tubería
          ctx.fillStyle = '#00a800';
          ctx.fillRect(px - 4, plat.y, plat.width + 8, 20);
          ctx.fillStyle = '#80d010';
          ctx.fillRect(px, plat.y, 8, 20);
          ctx.strokeRect(px - 4, plat.y, plat.width + 8, 20);
        } else if (plat.type === 'question') {
          ctx.fillStyle = plat.hit ? '#8b7355' : '#fc9838';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(px, plat.y, plat.width, plat.height);
          ctx.fillStyle = '#000000';
          ctx.font = 'bold 22px monospace';
          ctx.fillText(plat.hit ? '•' : '?', px + 8, plat.y + 24);
        } else if (plat.type === 'brick') {
          ctx.fillStyle = '#b84418';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          ctx.strokeStyle = '#000000';
          ctx.strokeRect(px, plat.y, plat.width, plat.height);
          ctx.strokeRect(px, plat.y, 16, 16);
        } else if (plat.type === 'flagpole') {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(px + 4, plat.y, 6, plat.height);
          // Bandera triangular verde
          ctx.fillStyle = '#00a800';
          ctx.beginPath();
          ctx.moveTo(px + 10, plat.y + 10);
          ctx.lineTo(px + 45, plat.y + 26);
          ctx.lineTo(px + 10, plat.y + 42);
          ctx.fill();
        } else if (plat.type === 'castle') {
          ctx.fillStyle = '#a84000';
          ctx.fillRect(px, plat.y, plat.width, plat.height);
          // Almenas
          for (let b = 0; b < plat.width; b += 30) {
            ctx.fillRect(px + b, plat.y - 20, 20, 20);
          }
          // Puerta negra
          ctx.fillStyle = '#000000';
          ctx.fillRect(px + 50, plat.y + 90, 50, 90);
        }
      });

      // Dibujar Champiñón de Poder
      state.mushrooms.forEach(m => {
        if (m.collected) return;
        const mx = m.x - camX;
        ctx.fillStyle = '#e52521';
        ctx.beginPath();
        ctx.arc(mx + 12, m.y + 10, 12, Math.PI, 0);
        ctx.lineTo(mx + 24, m.y + 20);
        ctx.lineTo(mx, m.y + 20);
        ctx.closePath();
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(mx + 8, m.y + 4, 8, 8);
        ctx.fillStyle = '#fed7aa';
        ctx.fillRect(mx + 4, m.y + 16, 16, 8);
      });

      // Dibujar Goombas
      state.enemies.forEach(enemy => {
        const ex = enemy.x - camX;
        if (ex < -40 || ex > CANVAS_WIDTH + 40) return;

        if (enemy.alive) {
          drawGoomba(ctx, ex, enemy.y, enemy.width, enemy.height, Math.floor(tick / 8));
        } else if (enemy.flatTimer > 0) {
          // Goomba aplastado
          ctx.fillStyle = '#b04a00';
          ctx.fillRect(ex, enemy.y + 18, enemy.width, 10);
        }
      });

      // Dibujar Mario Pixel Art
      const p = state.player;
      const px = p.x - camX;
      if (p.invulnerable % 6 < 3) {
        const isWalking = Math.abs(p.vx) > 0.3;
        drawMarioSprite(
          ctx,
          px,
          p.y,
          p.width,
          p.height,
          p.facing,
          p.isSuper,
          isWalking,
          state.walkFrame
        );
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [gameOver, gameWon, onSaveScore]);

  return (
    <div className="game-screen-container">
      {/* HUD NES Clásico */}
      <div className="game-hud max-w-[750px]">
        <button onClick={onBack} className="btn-back-game flex items-center gap-1 font-mono">
          <ArrowLeft size={16} /> Salir
        </button>

        <div className="grid grid-cols-4 gap-4 text-xs font-mono text-center w-full max-w-lg">
          <div>
            <span className="block text-gray-400 text-[10px]">MARIO</span>
            <strong className="text-white text-sm">{String(score).padStart(6, '0')}</strong>
          </div>
          <div>
            <span className="block text-gray-400 text-[10px]">MONEDAS</span>
            <strong className="text-yellow-400 text-sm">🪙 ×{String(coins).padStart(2, '0')}</strong>
          </div>
          <div>
            <span className="block text-gray-400 text-[10px]">MUNDO</span>
            <strong className="text-white text-sm">{world}</strong>
          </div>
          <div>
            <span className="block text-gray-400 text-[10px]">TIEMPO</span>
            <strong className="text-white text-sm">{timeLeft}</strong>
          </div>
        </div>

        <div className="flex gap-1 items-center">
          <span className="text-xs font-mono font-bold text-white mr-1">×{lives}</span>
          <Heart size={18} className="text-red-500 fill-red-500" />
        </div>
      </div>

      {/* Canvas */}
      <div className="canvas-wrapper relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="game-canvas rounded-b-xl border-4 border-indigo-950 shadow-2xl"
        />

        {gameOver && (
          <div className="canvas-overlay">
            <div className="overlay-box border-red-500">
              <span className="text-5xl">🍄💀</span>
              <h2 className="text-2xl font-black text-red-500 mt-2 font-mono">GAME OVER</h2>
              <p className="text-gray-300 text-sm mt-1">Puntuación Final: {score}</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetGame} className="btn-primary flex items-center gap-2">
                  <RotateCcw size={16} /> Reintentar
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Menú Principal
                </button>
              </div>
            </div>
          </div>
        )}

        {gameWon && (
          <div className="canvas-overlay">
            <div className="overlay-box border-yellow-400">
              <span className="text-5xl">🏰✨</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-2 font-mono">STAGE CLEAR!</h2>
              <p className="text-green-300 text-sm mt-1">¡Completaste el Mundo 1-1!</p>
              <p className="text-lg font-bold text-white mt-1">Bonus de Tiempo: +{timeLeft * 50} pts</p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={resetGame} className="btn-primary">
                  Jugar de Nuevo
                </button>
                <button onClick={onBack} className="btn-secondary">
                  Volver al Catálogo
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controles para móvil/táctil */}
      <div className="mario-controls flex items-center justify-between max-w-xl mx-auto mt-4 px-4 w-full">
        <div className="flex gap-3">
          <button
            onMouseDown={() => (keys.current.left = true)}
            onMouseUp={() => (keys.current.left = false)}
            onTouchStart={() => (keys.current.left = true)}
            onTouchEnd={() => (keys.current.left = false)}
            className="action-btn px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95"
          >
            ◀ Izquierda
          </button>
          <button
            onMouseDown={() => (keys.current.right = true)}
            onMouseUp={() => (keys.current.right = false)}
            onTouchStart={() => (keys.current.right = true)}
            onTouchEnd={() => (keys.current.right = false)}
            className="action-btn px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg active:scale-95"
          >
            Derecha ▶
          </button>
        </div>

        <button
          onClick={jumpMobile}
          className="jump-btn px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-lg rounded-2xl shadow-xl active:scale-95 flex items-center gap-2"
        >
          <ArrowUp size={24} /> SALTAR (A)
        </button>
      </div>
    </div>
  );
}
