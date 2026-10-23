import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { ShieldCheck, Clock, Ban, CheckCircle, Save, AlertTriangle, KeyRound, UserCheck, Lock } from 'lucide-react';

export default function AdminModal({ isOpen, onClose }) {
  const { parentalSettings, setParentalSettings, gamesMetadata, profiles, playTimeTracking } = useStorage();
  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);

  // Estados locales para la configuración
  const [globalMaxMinutes, setGlobalMaxMinutes] = useState(parentalSettings.globalMaxMinutes || 45);
  const [gameLimits, setGameLimits] = useState({ ...parentalSettings.gameLimits });
  const [blockedGames, setBlockedGames] = useState({ ...(parentalSettings.blockedGames || {}) });
  const [ageFilterEnabled, setAgeFilterEnabled] = useState(parentalSettings.ageFilterEnabled ?? true);
  const [newPin, setNewPin] = useState(parentalSettings.pin || '1234');
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!isOpen) return null;

  const handleVerifyPin = (e) => {
    e.preventDefault();
    if (pinInput === (parentalSettings.pin || '1234')) {
      setIsAuthenticated(true);
      setPinError(false);
    } else {
      setPinError(true);
    }
  };

  const handleSave = () => {
    setParentalSettings({
      pin: newPin || '1234',
      globalMaxMinutes: parseInt(globalMaxMinutes, 10) || 45,
      gameLimits,
      blockedGames,
      ageFilterEnabled
    });
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
      onClose();
    }, 1200);
  };

  const toggleBlockGame = (gameId) => {
    setBlockedGames(prev => ({
      ...prev,
      [gameId]: !prev[gameId]
    }));
  };

  const updateGameLimit = (gameId, minutes) => {
    setGameLimits(prev => ({
      ...prev,
      [gameId]: parseInt(minutes, 10) || 10
    }));
  };

  // Convertir segundos a minutos formateados
  const formatMinutes = (seconds = 0) => Math.round(seconds / 60);

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-2xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldCheck size={26} />
            </span>
            <div>
              <h2 className="modal-title">Panel de Control Parental</h2>
              <p className="modal-subtitle">Supervisión, límites de tiempo de pantalla y control de acceso</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {/* Pantalla de Bloqueo por PIN de Seguridad para padres */}
        {!isAuthenticated ? (
          <form onSubmit={handleVerifyPin} className="pin-auth-container">
            <div className="text-center my-4">
              <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Lock size={30} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Acceso Restringido a Padres</h3>
              <p className="text-sm text-gray-600 max-w-xs mx-auto mt-1">
                Ingresa el PIN de seguridad para configurar el tiempo de juego y reglas.
              </p>
              <span className="inline-block mt-2 px-2.5 py-1 bg-gray-100 text-gray-500 rounded-md text-xs font-mono">
                PIN por defecto: 1234
              </span>
            </div>

            <div className="max-w-xs mx-auto mt-4">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="Ingresa PIN (4 dígitos)"
                className="input-text text-center text-2xl tracking-widest font-mono"
                autoFocus
              />
              {pinError && (
                <p className="text-red-500 text-xs text-center mt-2 flex items-center justify-center gap-1">
                  <AlertTriangle size={14} /> PIN incorrecto. Intenta de nuevo (PIN de prueba: 1234).
                </p>
              )}

              <button type="submit" className="btn-primary w-full mt-4">
                Desbloquear Panel
              </button>
            </div>
          </form>
        ) : (
          /* Panel de Configuración Autenticado */
          <div className="admin-content-scroll">
            {/* Resumen del Día Actual */}
            <div className="admin-section">
              <h3 className="admin-section-title">📊 Tiempo de Juego Utilizado Hoy</h3>
              <div className="profiles-activity-grid">
                {profiles.map(p => {
                  const userTime = playTimeTracking?.users?.[p.id] || { totalSeconds: 0 };
                  const minutesUsed = formatMinutes(userTime.totalSeconds);
                  const isExceeded = minutesUsed >= globalMaxMinutes;
                  return (
                    <div key={p.id} className={`activity-card ${isExceeded ? 'border-red-400 bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{p.avatar}</span>
                        <div>
                          <span className="font-bold text-sm block">{p.name} ({p.age} años)</span>
                          <span className={`text-xs ${isExceeded ? 'text-red-600 font-bold' : 'text-gray-500'}`}>
                            {minutesUsed} / {globalMaxMinutes} min hoy
                          </span>
                        </div>
                      </div>
                      <div className="progress-bar-bg mt-2">
                        <div
                          className={`progress-bar-fill ${isExceeded ? 'bg-red-500' : 'bg-indigo-500'}`}
                          style={{ width: `${Math.min(100, (minutesUsed / globalMaxMinutes) * 100)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Límite Global Diario */}
            <div className="admin-section">
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-gray-800 flex items-center gap-2">
                  <Clock size={18} className="text-indigo-600" /> Límite Global Diario por Jugador:
                </label>
                <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-bold text-sm">
                  {globalMaxMinutes} Minutos al día
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="180"
                step="5"
                value={globalMaxMinutes}
                onChange={(e) => setGlobalMaxMinutes(e.target.value)}
                className="w-full accent-indigo-600 cursor-pointer"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>10 min (Poco)</span>
                <span>45 min (Recomendado)</span>
                <span>3 Horas (Fin de semana)</span>
              </div>
            </div>

            {/* Filtrado por Edad */}
            <div className="admin-section flex items-center justify-between">
              <div>
                <span className="font-bold text-gray-800 block">Filtro inteligente por edad</span>
                <span className="text-xs text-gray-500">Muestra automáticamente recomendaciones según la edad del niño seleccionado</span>
              </div>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={ageFilterEnabled}
                  onChange={(e) => setAgeFilterEnabled(e.target.checked)}
                />
                <span className="slider round"></span>
              </label>
            </div>

            {/* Límites y Bloqueo individual por Juego */}
            <div className="admin-section">
              <h3 className="admin-section-title">🎮 Límites Individuales por Juego</h3>
              <div className="space-y-3">
                {gamesMetadata.map(game => {
                  const isBlocked = blockedGames[game.id];
                  const currentLimit = gameLimits[game.id] || 20;

                  return (
                    <div key={game.id} className={`game-control-row ${isBlocked ? 'opacity-60 bg-red-50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-3">
                        <span className="text-3xl">{game.icon}</span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-gray-900 text-sm">{game.title}</span>
                            <span className="text-xs px-2 py-0.5 bg-gray-200 text-gray-700 rounded-md">
                              Recomendado: {game.minAge}+ años
                            </span>
                          </div>
                          <span className="text-xs text-gray-500">{game.category}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        {/* Selector de minutos por juego */}
                        <div className="flex items-center gap-1.5">
                          <label className="text-xs text-gray-600">Límite:</label>
                          <select
                            disabled={isBlocked}
                            value={currentLimit}
                            onChange={(e) => updateGameLimit(game.id, e.target.value)}
                            className="text-xs border rounded-lg px-2 py-1 bg-white font-medium"
                          >
                            <option value="5">5 min</option>
                            <option value="10">10 min</option>
                            <option value="15">15 min</option>
                            <option value="20">20 min</option>
                            <option value="30">30 min</option>
                            <option value="45">45 min</option>
                            <option value="60">60 min</option>
                          </select>
                        </div>

                        {/* Botón Bloquear / Desbloquear */}
                        <button
                          type="button"
                          onClick={() => toggleBlockGame(game.id)}
                          className={`btn-pill-toggle ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                        >
                          {isBlocked ? (
                            <> <CheckCircle size={14} /> Desbloquear</>
                          ) : (
                            <> <Ban size={14} /> Bloquear Juego</>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cambio de PIN */}
            <div className="admin-section">
              <label className="font-bold text-gray-800 text-xs flex items-center gap-1 mb-1">
                <KeyRound size={15} /> Cambiar PIN de Administrador (4-6 dígitos):
              </label>
              <input
                type="text"
                value={newPin}
                maxLength={6}
                onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                className="input-text text-sm font-mono max-w-[160px]"
              />
            </div>

            {/* Botones de acción */}
            <div className="modal-footer flex items-center justify-between pt-4 border-t">
              {saveSuccess ? (
                <span className="text-green-600 text-sm font-bold flex items-center gap-1">
                  <CheckCircle size={18} /> ¡Configuración guardada exitosamente!
                </span>
              ) : <div />}

              <div className="flex gap-2">
                <button type="button" className="btn-secondary" onClick={onClose}>
                  Cerrar
                </button>
                <button type="button" className="btn-primary flex items-center gap-1.5" onClick={handleSave}>
                  <Save size={16} /> Guardar Reglas
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
