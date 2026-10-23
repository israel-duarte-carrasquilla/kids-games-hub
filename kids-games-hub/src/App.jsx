import React, { useState, useEffect } from 'react';
import { useStorage } from './context/StorageContext';
import LoginModal from './components/LoginModal';
import AdminModal from './components/AdminModal';
import PacmanGame from './components/PacmanGame';
import MarioGame from './components/MarioGame';
import MemoryGame from './components/MemoryGame';
import { ShieldCheck, User, LogOut, Clock, Play, Lock, Sparkles, Star, Award, Filter, RefreshCw } from 'lucide-react';
import './App.css';

export default function App() {
  const {
    currentUser,
    setCurrentUser,
    gamesMetadata,
    parentalSettings,
    playTimeTracking,
    addPlayTime,
    userProgress,
    saveScore
  } = useStorage();

  const [activeGame, setActiveGame] = useState(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [selectedAgeFilter, setSelectedAgeFilter] = useState('all'); // 'all', 'peques' (3-5), 'medios' (6-9), 'grandes' (10+)
  const [timeWarning, setTimeWarning] = useState(null);

  // Abrir login si no hay usuario al cargar
  useEffect(() => {
    if (!currentUser) {
      setIsLoginOpen(true);
    }
  }, [currentUser]);

  // Temporizador para contar el tiempo de juego por segundo y aplicar límites parentales
  useEffect(() => {
    if (!activeGame || !currentUser) return;

    const timer = setInterval(() => {
      addPlayTime(currentUser.id, activeGame, 1);

      // Comprobar límites
      const userTrack = playTimeTracking?.users?.[currentUser.id] || { totalSeconds: 0, byGame: {} };
      const currentGlobalSec = userTrack.totalSeconds || 0;
      const currentGameSec = (userTrack.byGame && userTrack.byGame[activeGame]) || 0;

      const maxGlobalSec = (parentalSettings.globalMaxMinutes || 45) * 60;
      const maxGameSec = ((parentalSettings.gameLimits && parentalSettings.gameLimits[activeGame]) || 20) * 60;

      if (currentGlobalSec >= maxGlobalSec) {
        setTimeWarning('¡Tiempo global del día completado! Es hora de descansar y hacer otras actividades 🌟');
        setActiveGame(null);
      } else if (currentGameSec >= maxGameSec) {
        setTimeWarning('¡Has alcanzado el tiempo límite para este juego hoy! Prueba otro juego de la biblioteca 🎮');
        setActiveGame(null);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [activeGame, currentUser, parentalSettings, playTimeTracking, addPlayTime]);

  const handleLaunchGame = (gameId) => {
    if (!currentUser) {
      setIsLoginOpen(true);
      return;
    }

    // Comprobar si está bloqueado por el administrador
    if (parentalSettings.blockedGames && parentalSettings.blockedGames[gameId]) {
      alert('🔒 Este juego se encuentra restringido temporalmente por el control parental.');
      return;
    }

    // Comprobar si superó el límite
    const userTrack = playTimeTracking?.users?.[currentUser.id] || { totalSeconds: 0, byGame: {} };
    const maxGlobalSec = (parentalSettings.globalMaxMinutes || 45) * 60;
    const maxGameSec = ((parentalSettings.gameLimits && parentalSettings.gameLimits[gameId]) || 20) * 60;

    if ((userTrack.totalSeconds || 0) >= maxGlobalSec) {
      alert('⏰ Has alcanzado el tiempo máximo global permitido para hoy. ¡Regresa mañana!');
      return;
    }

    if (((userTrack.byGame && userTrack.byGame[gameId]) || 0) >= maxGameSec) {
      alert('⏰ Has alcanzado el tiempo límite para este juego en particular hoy.');
      return;
    }

    setTimeWarning(null);
    setActiveGame(gameId);
  };

  const handleScoreSave = (score) => {
    if (currentUser && activeGame) {
      saveScore(currentUser.id, activeGame, score);
    }
  };

  // Filtrado de juegos por edad
  const filteredGames = gamesMetadata.filter(game => {
    // Si el usuario tiene edad y el filtro por edad inteligente está habilitado
    if (selectedAgeFilter === 'peques') return game.minAge <= 5;
    if (selectedAgeFilter === 'medios') return game.minAge <= 8 && game.maxAge >= 6;
    if (selectedAgeFilter === 'grandes') return game.minAge >= 6;
    return true;
  });

  // Estadísticas del jugador actual
  const userTrack = currentUser ? (playTimeTracking?.users?.[currentUser.id] || { totalSeconds: 0 }) : { totalSeconds: 0 };
  const userMinutesPlayed = Math.round((userTrack.totalSeconds || 0) / 60);
  const remainingGlobalMinutes = Math.max(0, (parentalSettings.globalMaxMinutes || 45) - userMinutesPlayed);

  return (
    <div className="kids-app min-h-screen">
      {/* Barra de navegación superior amigable para niños y padres */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="navbar-brand flex items-center gap-3">
            <div className="logo-badge">
              <span className="text-3xl">🚀</span>
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-black bg-gradient-to-r from-amber-500 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                KIDS GAMES HUB
              </h1>
              <p className="text-xs text-gray-500 font-semibold tracking-wide">
                Diversión Segura & Control Inteligente
              </p>
            </div>
          </div>

          <div className="navbar-actions flex items-center gap-3">
            {/* Widget de Tiempo Restante del Niño */}
            {currentUser && (
              <div className="screen-time-pill flex items-center gap-2">
                <Clock size={16} className="text-amber-500 animate-pulse" />
                <span className="text-xs font-bold text-gray-700">
                  {remainingGlobalMinutes} min restantes hoy
                </span>
              </div>
            )}

            {/* Perfil del Niño */}
            {currentUser ? (
              <div className="profile-badge-nav flex items-center gap-2" onClick={() => setIsLoginOpen(true)}>
                <span className="text-2xl">{currentUser.avatar}</span>
                <div className="text-left hidden sm:block">
                  <span className="text-xs font-bold text-gray-900 block leading-tight">{currentUser.name}</span>
                  <span className="text-[10px] text-gray-500">{currentUser.age} años {currentUser.googleLinked && '• Google'}</span>
                </div>
              </div>
            ) : (
              <button onClick={() => setIsLoginOpen(true)} className="btn-login-header">
                <User size={16} /> Elegir Jugador
              </button>
            )}

            {/* Botón Panel Parental */}
            <button
              onClick={() => setIsAdminOpen(true)}
              className="btn-admin-header flex items-center gap-1.5"
              title="Panel de Control Parental"
            >
              <ShieldCheck size={18} />
              <span className="hidden md:inline font-bold">Padres</span>
            </button>
          </div>
        </div>
      </header>

      {/* Alerta de advertencia de tiempo */}
      {timeWarning && (
        <div className="time-alert-banner">
          <span>⏰ {timeWarning}</span>
          <button onClick={() => setTimeWarning(null)} className="ml-4 font-bold underline">Entendido</button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        {/* Si hay un juego activo, mostrar su pantalla */}
        {activeGame === 'pacman' && (
          <PacmanGame
            onBack={() => setActiveGame(null)}
            onSaveScore={handleScoreSave}
            currentHigh={userProgress?.[currentUser?.id]?.pacman?.highScore || 0}
          />
        )}

        {activeGame === 'mario' && (
          <MarioGame
            onBack={() => setActiveGame(null)}
            onSaveScore={handleScoreSave}
            currentHigh={userProgress?.[currentUser?.id]?.mario?.highScore || 0}
          />
        )}

        {activeGame === 'memory-math' && (
          <MemoryGame
            onBack={() => setActiveGame(null)}
            onSaveScore={handleScoreSave}
            currentHigh={userProgress?.[currentUser?.id]?.['memory-math']?.highScore || 0}
          />
        )}

        {/* Si no hay juego activo, mostrar Catálogo y Biblioteca de Juegos */}
        {!activeGame && (
          <div className="lobby-container">
            {/* Hero Bienvenida del Niño */}
            <section className="welcome-banner">
              <div className="welcome-content">
                <span className="badge-welcome">¡HOLA {currentUser ? currentUser.name.toUpperCase() : 'CAMPEÓN'}! 🎮</span>
                <h2 className="welcome-title">¿Qué aventura quieres explorar hoy?</h2>
                <p className="welcome-desc">
                  Elige entre correr por el reino de plataformas, escapar en el laberinto fantasma o entrenar tu mente.
                </p>

                {currentUser && (
                  <div className="user-stats-strip flex flex-wrap gap-4 mt-4">
                    <div className="stat-chip">
                      <Star size={16} className="text-yellow-400 fill-yellow-400" />
                      <span>Récord Pac-Hero: <strong>{userProgress?.[currentUser.id]?.pacman?.highScore || 0}</strong> pts</span>
                    </div>
                    <div className="stat-chip">
                      <Award size={16} className="text-red-400" />
                      <span>Récord Super Jump: <strong>{userProgress?.[currentUser.id]?.mario?.highScore || 0}</strong> pts</span>
                    </div>
                  </div>
                )}
              </div>
              <div className="welcome-illustration">
                <span className="text-7xl animate-bounce">🕹️</span>
              </div>
            </section>

            {/* Filtros por Categoría de Edad */}
            <div className="filters-section flex flex-wrap items-center justify-between gap-3 my-6">
              <div className="flex items-center gap-2">
                <Filter size={18} className="text-indigo-600" />
                <span className="font-bold text-gray-800 text-sm">Filtrar por edad:</span>
              </div>

              <div className="age-filter-buttons flex gap-2">
                <button
                  onClick={() => setSelectedAgeFilter('all')}
                  className={`btn-filter ${selectedAgeFilter === 'all' ? 'active' : ''}`}
                >
                  Todos los Juegos
                </button>
                <button
                  onClick={() => setSelectedAgeFilter('peques')}
                  className={`btn-filter ${selectedAgeFilter === 'peques' ? 'active' : ''}`}
                >
                  👶 Peques (3 a 5)
                </button>
                <button
                  onClick={() => setSelectedAgeFilter('medios')}
                  className={`btn-filter ${selectedAgeFilter === 'medios' ? 'active' : ''}`}
                >
                  ⚡ Exploradores (6 a 9)
                </button>
                <button
                  onClick={() => setSelectedAgeFilter('grandes')}
                  className={`btn-filter ${selectedAgeFilter === 'grandes' ? 'active' : ''}`}
                >
                  🏆 Expertos (10+)
                </button>
              </div>
            </div>

            {/* Grid de Juegos */}
            <div className="games-grid">
              {filteredGames.map(game => {
                const isBlocked = parentalSettings?.blockedGames?.[game.id];
                const gameRecord = userProgress?.[currentUser?.id]?.[game.id]?.highScore || 0;
                const gameTimeLimit = (parentalSettings?.gameLimits?.[game.id]) || 20;

                return (
                  <div
                    key={game.id}
                    className={`game-lobby-card ${isBlocked ? 'blocked' : ''}`}
                    style={{ '--card-accent': game.themeColor }}
                  >
                    <div className="game-card-top flex justify-between items-start">
                      <span className="game-icon-bubble">{game.icon}</span>
                      <div className="flex flex-col items-end gap-1">
                        <span className="game-badge">{game.badge}</span>
                        <span className="game-age-pill">Edad: {game.minAge}+</span>
                      </div>
                    </div>

                    <div className="game-card-info mt-3">
                      <h3 className="game-title">{game.title}</h3>
                      <p className="game-category">{game.category}</p>
                      <p className="game-desc">{game.description}</p>
                    </div>

                    <div className="game-card-meta flex justify-between items-center mt-4 pt-3 border-t">
                      <span className="text-xs text-gray-500 font-medium">
                        ⏱️ Máx: {gameTimeLimit} min/día
                      </span>
                      {gameRecord > 0 && (
                        <span className="text-xs font-bold text-amber-600 flex items-center gap-1">
                          ⭐ Récord: {gameRecord}
                        </span>
                      )}
                    </div>

                    <div className="game-card-action mt-4">
                      {isBlocked ? (
                        <button disabled className="btn-play-game disabled">
                          <Lock size={16} /> Bloqueado por Padres
                        </button>
                      ) : (
                        <button
                          onClick={() => handleLaunchGame(game.id)}
                          className="btn-play-game"
                        >
                          <Play size={18} fill="currentColor" /> ¡JUGAR AHORA!
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>

      {/* Modales */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />

      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
      />
    </div>
  );
}
