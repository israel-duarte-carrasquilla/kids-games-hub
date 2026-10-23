import React, { useState, useEffect } from 'react';
import { ArrowLeft, RotateCcw, Trophy, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

const CARDS_DATA = [
  { id: 1, symbol: '🐱', matchId: 1 },
  { id: 2, symbol: '🐱', matchId: 1 },
  { id: 3, symbol: '🐶', matchId: 2 },
  { id: 4, symbol: '🐶', matchId: 2 },
  { id: 5, symbol: '🦁', matchId: 3 },
  { id: 6, symbol: '🦁', matchId: 3 },
  { id: 7, symbol: '🐼', matchId: 4 },
  { id: 8, symbol: '🐼', matchId: 4 },
  { id: 9, symbol: '🐸', matchId: 5 },
  { id: 10, symbol: '🐸', matchId: 5 },
  { id: 11, symbol: '🦄', matchId: 6 },
  { id: 12, symbol: '🦄', matchId: 6 }
];

export default function MemoryGame({ onBack, onSaveScore, currentHigh = 0 }) {
  const [cards, setCards] = useState([]);
  const [flipped, setFlipped] = useState([]);
  const [matched, setMatched] = useState([]);
  const [moves, setMoves] = useState(0);
  const [isWon, setIsWon] = useState(false);

  const initGame = () => {
    const shuffled = [...CARDS_DATA]
      .sort(() => Math.random() - 0.5)
      .map((c, i) => ({ ...c, uniqueKey: i }));
    setCards(shuffled);
    setFlipped([]);
    setMatched([]);
    setMoves(0);
    setIsWon(false);
  };

  useEffect(() => {
    initGame();
  }, []);

  const handleCardClick = (index) => {
    if (flipped.length === 2 || flipped.includes(index) || matched.includes(cards[index].matchId)) {
      return;
    }

    const newFlipped = [...flipped, index];
    setFlipped(newFlipped);

    if (newFlipped.length === 2) {
      setMoves(m => m + 1);
      const [firstIdx, secondIdx] = newFlipped;
      if (cards[firstIdx].matchId === cards[secondIdx].matchId) {
        setMatched(prev => {
          const nextMatched = [...prev, cards[firstIdx].matchId];
          if (nextMatched.length === CARDS_DATA.length / 2) {
            setIsWon(true);
            confetti({ particleCount: 100, spread: 70 });
            const finalScore = Math.max(100, 1000 - (moves + 1) * 35);
            onSaveScore(finalScore);
          }
          return nextMatched;
        });
        setFlipped([]);
      } else {
        setTimeout(() => {
          setFlipped([]);
        }, 900);
      }
    }
  };

  return (
    <div className="game-screen-container">
      <div className="game-hud">
        <button onClick={onBack} className="btn-back-game flex items-center gap-1">
          <ArrowLeft size={18} /> Salir al Menú
        </button>

        <div className="hud-stat">
          <Trophy size={18} className="text-yellow-400" />
          <span>Intentos: <strong>{moves}</strong></span>
          <span className="text-xs text-indigo-300 ml-2">(Récord Puntos: {currentHigh})</span>
        </div>

        <button onClick={initGame} className="btn-secondary text-xs flex items-center gap-1 py-1">
          <RotateCcw size={14} /> Reiniciar
        </button>
      </div>

      <div className="memory-board-wrapper">
        <div className="memory-grid">
          {cards.map((card, idx) => {
            const isFlipped = flipped.includes(idx) || matched.includes(card.matchId);
            return (
              <button
                key={card.uniqueKey}
                onClick={() => handleCardClick(idx)}
                className={`memory-card ${isFlipped ? 'flipped' : ''}`}
              >
                <div className="memory-card-inner">
                  <div className="card-front">❓</div>
                  <div className="card-back">{card.symbol}</div>
                </div>
              </button>
            );
          })}
        </div>

        {isWon && (
          <div className="canvas-overlay">
            <div className="overlay-box border-purple-400 bg-indigo-950">
              <span className="text-5xl">🎉🌟</span>
              <h2 className="text-2xl font-black text-yellow-400 mt-2">¡EXCELENTE MEMORIA!</h2>
              <p className="text-gray-200 text-sm mt-1">¡Encontraste todas las parejitas!</p>
              <p className="text-xl font-bold text-green-400 mt-2">
                Puntos Ganados: {Math.max(100, 1000 - moves * 35)}
              </p>
              <div className="flex gap-3 justify-center mt-5">
                <button onClick={initGame} className="btn-primary flex items-center gap-2">
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
    </div>
  );
}
