import React, { createContext, useContext, useState, useEffect } from 'react';

// Estructura de almacenamiento local para progreso, configuración parental y perfiles
const StorageContext = createContext(null);

const DEFAULT_GAMES_METADATA = [
  {
    id: 'pacman',
    title: 'Pac-Hero: Aventura Fantasma',
    category: 'Arcade / Lógica',
    minAge: 4,
    maxAge: 12,
    icon: '👻',
    badge: 'Retro Favorito',
    description: 'Come todas las bolitas doradas y frutas mágicas mientras esquivas a los traviesos fantasmas.',
    themeColor: '#f59e0b',
    tags: ['4+ años', 'Reflejos', 'Laberinto']
  },
  {
    id: 'mario',
    title: 'Super Jump: Reino Champiñón',
    category: 'Plataformas / Aventura',
    minAge: 6,
    maxAge: 14,
    icon: '🍄',
    badge: 'Aventura Clásica',
    description: 'Corre, salta sobre obstáculos, golpea bloques misteriosos y recolecta monedas doradas.',
    themeColor: '#ef4444',
    tags: ['6+ años', 'Plataformas', 'Acción']
  },
  {
    id: 'memory-math',
    title: 'Memo-Mágico & Números',
    category: 'Educativo / Memoria',
    minAge: 3,
    maxAge: 8,
    icon: '🧠',
    badge: 'Para Peques',
    description: 'Encuentra las parejas de cartas iguales y entrena tu memoria y agilidad mental.',
    themeColor: '#8b5cf6',
    tags: ['3+ años', 'Concentración', 'Puzzles']
  }
];

export function StorageProvider({ children }) {
  // Usuario actual logueado
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('kids_hub_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Lista de perfiles de niños registrados
  const [profiles, setProfiles] = useState(() => {
    const saved = localStorage.getItem('kids_hub_profiles');
    return saved ? JSON.parse(saved) : [
      { id: 'kid-1', name: 'Mateo', age: 7, avatar: '🦊', googleLinked: false, email: '' },
      { id: 'kid-2', name: 'Sofía', age: 10, avatar: '🦄', googleLinked: false, email: '' },
      { id: 'kid-3', name: 'Lucas', age: 4, avatar: '🦖', googleLinked: false, email: '' }
    ];
  });

  // Reglas del Panel Administrador / Parental
  // globalMaxMinutes: tiempo total diario permitido
  // gameLimits: tiempo por juego en minutos
  // blockedGames: array con IDs de juegos deshabilitados por el padre
  const [parentalSettings, setParentalSettings] = useState(() => {
    const saved = localStorage.getItem('kids_hub_parental_settings');
    return saved ? JSON.parse(saved) : {
      pin: '1234',
      globalMaxMinutes: 45,
      gameLimits: {
        pacman: 20,
        mario: 25,
        'memory-math': 30
      },
      blockedGames: {},
      ageFilterEnabled: true
    };
  });

  // Registro de tiempo jugado por jugador y por juego (en segundos hoy)
  const [playTimeTracking, setPlayTimeTracking] = useState(() => {
    const saved = localStorage.getItem('kids_hub_play_time');
    const today = new Date().toISOString().split('T')[0];
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.date === today) {
        return parsed;
      }
    }
    return { date: today, users: {} };
  });

  // Progreso y récords por jugador
  const [userProgress, setUserProgress] = useState(() => {
    const saved = localStorage.getItem('kids_hub_progress');
    return saved ? JSON.parse(saved) : {
      // { [userId]: { pacman: { highScore: 120, stars: 2 }, mario: { highScore: 340, level: 2 } } }
    };
  });

  // Sincronizar en localStorage
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('kids_hub_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('kids_hub_user');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('kids_hub_profiles', JSON.stringify(profiles));
  }, [profiles]);

  useEffect(() => {
    localStorage.setItem('kids_hub_parental_settings', JSON.stringify(parentalSettings));
  }, [parentalSettings]);

  useEffect(() => {
    localStorage.setItem('kids_hub_play_time', JSON.stringify(playTimeTracking));
  }, [playTimeTracking]);

  useEffect(() => {
    localStorage.setItem('kids_hub_progress', JSON.stringify(userProgress));
  }, [userProgress]);

  // Actualizar tiempo jugado (en segundos)
  const addPlayTime = (userId, gameId, secondsToAdd) => {
    setPlayTimeTracking(prev => {
      const today = new Date().toISOString().split('T')[0];
      const usersData = { ...(prev.date === today ? prev.users : {}) };
      const userRecord = usersData[userId] || { totalSeconds: 0, byGame: {} };
      
      const newTotal = (userRecord.totalSeconds || 0) + secondsToAdd;
      const newGameTotal = ((userRecord.byGame && userRecord.byGame[gameId]) || 0) + secondsToAdd;

      usersData[userId] = {
        ...userRecord,
        totalSeconds: newTotal,
        byGame: {
          ...(userRecord.byGame || {}),
          [gameId]: newGameTotal
        }
      };

      return {
        date: today,
        users: usersData
      };
    });
  };

  // Guardar puntuación y récord de un juego
  const saveScore = (userId, gameId, score, extraData = {}) => {
    setUserProgress(prev => {
      const userGames = prev[userId] || {};
      const currentGame = userGames[gameId] || { highScore: 0, gamesPlayed: 0 };
      const newHigh = Math.max(currentGame.highScore, score);

      return {
        ...prev,
        [userId]: {
          ...userGames,
          [gameId]: {
            ...currentGame,
            highScore: newHigh,
            lastScore: score,
            gamesPlayed: (currentGame.gamesPlayed || 0) + 1,
            lastPlayed: new Date().toISOString(),
            ...extraData
          }
        }
      };
    });
  };

  // Crear o vincular perfil
  const addProfile = (profile) => {
    setProfiles(prev => [...prev, profile]);
  };

  const updateProfile = (id, updated) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...updated } : p));
  };

  const deleteProfile = (id) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  };

  return (
    <StorageContext.Provider value={{
      currentUser,
      setCurrentUser,
      profiles,
      addProfile,
      updateProfile,
      deleteProfile,
      parentalSettings,
      setParentalSettings,
      playTimeTracking,
      addPlayTime,
      userProgress,
      saveScore,
      gamesMetadata: DEFAULT_GAMES_METADATA
    }}>
      {children}
    </StorageContext.Provider>
  );
}

export function useStorage() {
  return useContext(StorageContext);
}
