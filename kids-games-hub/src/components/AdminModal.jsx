import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { 
  ShieldCheck, Clock, Ban, CheckCircle, Save, AlertTriangle, KeyRound, 
  UserCheck, Lock, Users, UserPlus, Trash2, Edit3, Award, Sparkles, RefreshCw
} from 'lucide-react';

const AVATARS = ['🦊', '🦄', '🦖', '🚀', '🦁', '🐱', '🐼', '🤖', '👑', '⭐', '👾', '🏎️'];

export default function AdminModal({ isOpen, onClose }) {
  const { 
    parentalSettings, 
    setParentalSettings, 
    gamesMetadata, 
    profiles, 
    addProfile, 
    updateProfile, 
    deleteProfile, 
    playTimeTracking,
    userProgress 
  } = useStorage();

  const [pinInput, setPinInput] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinError, setPinError] = useState(false);
  const [activeTab, setActiveTab] = useState('profiles'); // 'profiles', 'limits', 'security'

  // Formulario crear/editar perfil
  const [editingProfileId, setEditingProfileId] = useState(null);
  const [nameInput, setNameInput] = useState('');
  const [ageInput, setAgeInput] = useState(7);
  const [avatarInput, setAvatarInput] = useState('🦊');
  const [emailInput, setEmailInput] = useState('');

  // Configuración de límites
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

  const handleSaveSettings = () => {
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
    }, 2000);
  };

  const handleCreateOrUpdateProfile = (e) => {
    e.preventDefault();
    if (!nameInput.trim()) return;

    if (editingProfileId) {
      updateProfile(editingProfileId, {
        name: nameInput.trim(),
        age: parseInt(ageInput, 10) || 7,
        avatar: avatarInput,
        email: emailInput.trim(),
        googleLinked: !!emailInput.trim()
      });
      setEditingProfileId(null);
    } else {
      addProfile({
        id: 'kid-' + Date.now(),
        name: nameInput.trim(),
        age: parseInt(ageInput, 10) || 7,
        avatar: avatarInput,
        googleLinked: !!emailInput.trim(),
        email: emailInput.trim()
      });
    }

    setNameInput('');
    setAgeInput(7);
    setEmailInput('');
  };

  const startEditProfile = (profile) => {
    setEditingProfileId(profile.id);
    setNameInput(profile.name);
    setAgeInput(profile.age);
    setAvatarInput(profile.avatar);
    setEmailInput(profile.email || '');
  };

  const cancelEdit = () => {
    setEditingProfileId(null);
    setNameInput('');
    setAgeInput(7);
    setEmailInput('');
  };

  const handleDeleteProfile = (id, name) => {
    if (confirm(`¿Estás seguro de eliminar el perfil de ${name}? Se borrarán también sus récords.`)) {
      deleteProfile(id);
    }
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

  const formatMinutes = (seconds = 0) => Math.round(seconds / 60);

  return (
    <div className="modal-backdrop">
      <div className="modal-card max-w-3xl">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-100 text-indigo-700 rounded-xl">
              <ShieldCheck size={28} />
            </span>
            <div>
              <h2 className="modal-title flex items-center gap-2">
                Panel Superadministrador
                <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                  Control Total
                </span>
              </h2>
              <p className="modal-subtitle">Gestión integral de perfiles de niños, cuentas Google y reglas de tiempo</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {!isAuthenticated ? (
          <form onSubmit={handleVerifyPin} className="pin-auth-container">
            <div className="text-center my-6">
              <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-3">
                <Lock size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-800">Autenticación Superadministrador</h3>
              <p className="text-sm text-gray-600 max-w-sm mx-auto mt-1">
                Ingresa la clave maestra para administrar todos los perfiles de tus hijos y las restricciones.
              </p>
              <span className="inline-block mt-2 px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-xs font-mono font-bold">
                PIN Maestro inicial: 1234
              </span>
            </div>

            <div className="max-w-xs mx-auto">
              <input
                type="password"
                maxLength={6}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setPinError(false);
                }}
                placeholder="PIN (4 dígitos)"
                className="input-text text-center text-3xl tracking-widest font-mono"
                autoFocus
              />
              {pinError && (
                <p className="text-red-500 text-xs text-center mt-2 flex items-center justify-center gap-1 font-semibold">
                  <AlertTriangle size={14} /> PIN incorrecto. Prueba con 1234.
                </p>
              )}

              <button type="submit" className="btn-primary w-full mt-4 text-base py-3">
                Desbloquear Panel SuperAdmin
              </button>
            </div>
          </form>
        ) : (
          <div>
            {/* Pestañas de navegación interna */}
            <div className="superadmin-tabs flex gap-2 border-b pb-3 mb-4">
              <button
                onClick={() => setActiveTab('profiles')}
                className={`tab-btn flex items-center gap-2 ${activeTab === 'profiles' ? 'active' : ''}`}
              >
                <Users size={16} /> Gestionar Perfiles ({profiles.length})
              </button>
              <button
                onClick={() => setActiveTab('limits')}
                className={`tab-btn flex items-center gap-2 ${activeTab === 'limits' ? 'active' : ''}`}
              >
                <Clock size={16} /> Reglas & Tiempos de Juego
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`tab-btn flex items-center gap-2 ${activeTab === 'security' ? 'active' : ''}`}
              >
                <KeyRound size={16} /> PIN & Seguridad
              </button>
            </div>

            <div className="admin-content-scroll">
              {/* TAB 1: GESTIÓN DE PERFILES (SUPERADMINISTRADOR) */}
              {activeTab === 'profiles' && (
                <div>
                  {/* Formulario Crear / Editar */}
                  <form onSubmit={handleCreateOrUpdateProfile} className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 mb-5">
                    <h4 className="font-black text-indigo-950 text-sm flex items-center gap-1.5 mb-3">
                      {editingProfileId ? <Edit3 size={16} /> : <UserPlus size={16} />}
                      {editingProfileId ? 'Modificar Perfil de Hijo' : 'Agregar Nuevo Hijo / Jugador'}
                    </h4>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Nombre:</label>
                        <input
                          type="text"
                          required
                          value={nameInput}
                          onChange={(e) => setNameInput(e.target.value)}
                          placeholder="Ej. Mateo, Sofía..."
                          className="input-text text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Edad: {ageInput} años</label>
                        <input
                          type="number"
                          min="3"
                          max="16"
                          value={ageInput}
                          onChange={(e) => setAgeInput(e.target.value)}
                          className="input-text text-sm bg-white"
                        />
                      </div>

                      <div>
                        <label className="text-xs font-bold text-gray-700 block mb-1">Cuenta Google (opcional):</label>
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder="hijo@gmail.com"
                          className="input-text text-sm bg-white"
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <label className="text-xs font-bold text-gray-700 block mb-1.5">Avatar:</label>
                      <div className="avatar-picker flex flex-wrap gap-2">
                        {AVATARS.map(av => (
                          <button
                            key={av}
                            type="button"
                            onClick={() => setAvatarInput(av)}
                            className={`avatar-choice text-xl p-1.5 rounded-lg border ${avatarInput === av ? 'border-indigo-600 bg-white ring-2 ring-indigo-400' : 'bg-gray-100'}`}
                          >
                            {av}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-4">
                      {editingProfileId && (
                        <button type="button" onClick={cancelEdit} className="btn-secondary text-xs">
                          Cancelar
                        </button>
                      )}
                      <button type="submit" className="btn-primary text-xs flex items-center gap-1">
                        <Save size={14} /> {editingProfileId ? 'Actualizar Perfil' : 'Guardar Perfil'}
                      </button>
                    </div>
                  </form>

                  {/* Lista de Perfiles Existentes */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-gray-800 text-sm">Perfiles Registrados en la Plataforma:</h4>
                    {profiles.map(p => {
                      const userTime = playTimeTracking?.users?.[p.id] || { totalSeconds: 0 };
                      const minutesUsed = formatMinutes(userTime.totalSeconds);
                      const userScores = userProgress?.[p.id] || {};

                      return (
                        <div key={p.id} className="p-3.5 bg-white border border-gray-200 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="flex items-center gap-3">
                            <span className="text-3xl p-2 bg-indigo-50 rounded-xl border border-indigo-100">{p.avatar}</span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-extrabold text-gray-900">{p.name}</span>
                                <span className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full font-semibold">
                                  {p.age} años
                                </span>
                                {p.googleLinked && (
                                  <span className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-bold">
                                    Google: {p.email}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-4 text-xs text-gray-500 mt-1">
                                <span>⏱️ Jugado hoy: <strong>{minutesUsed} min</strong></span>
                                <span>👻 Pacman: <strong>{userScores.pacman?.highScore || 0} pts</strong></span>
                                <span>🍄 Mario: <strong>{userScores.mario?.highScore || 0} pts</strong></span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditProfile(p)}
                              className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                              title="Editar Perfil"
                            >
                              <Edit3 size={17} />
                            </button>
                            {profiles.length > 1 && (
                              <button
                                onClick={() => handleDeleteProfile(p.id, p.name)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                                title="Eliminar Perfil"
                              >
                                <Trash2 size={17} />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* TAB 2: LÍMITES Y BLOQUEOS */}
              {activeTab === 'limits' && (
                <div className="space-y-4">
                  {/* Límite Global */}
                  <div className="admin-section">
                    <div className="flex justify-between items-center mb-2">
                      <label className="font-bold text-gray-800 flex items-center gap-2">
                        <Clock size={18} className="text-indigo-600" /> Tiempo Global Diario Máximo por Niño:
                      </label>
                      <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full font-black text-sm">
                        {globalMaxMinutes} Minutos
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
                      <span>10 min</span>
                      <span>45 min (Recomendado)</span>
                      <span>180 min (Fin de semana)</span>
                    </div>
                  </div>

                  {/* Límites por juego */}
                  <div className="admin-section">
                    <h3 className="admin-section-title">🎮 Límites Específicos por Juego</h3>
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
                                    {game.minAge}+ años
                                  </span>
                                </div>
                                <span className="text-xs text-gray-500">{game.category}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
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

                              <button
                                type="button"
                                onClick={() => toggleBlockGame(game.id)}
                                className={`btn-pill-toggle ${isBlocked ? 'btn-unblock' : 'btn-block'}`}
                              >
                                {isBlocked ? (
                                  <> <CheckCircle size={14} /> Desbloquear</>
                                ) : (
                                  <> <Ban size={14} /> Bloquear</>
                                )}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={handleSaveSettings}
                    className="btn-primary w-full py-2.5 flex items-center justify-center gap-2"
                  >
                    <Save size={16} /> Guardar Cambios de Límites
                  </button>
                </div>
              )}

              {/* TAB 3: SEGURIDAD Y PIN */}
              {activeTab === 'security' && (
                <div className="space-y-4">
                  <div className="admin-section">
                    <h3 className="admin-section-title">🔒 Clave Maestra del Superadministrador</h3>
                    <p className="text-xs text-gray-600 mb-3">
                      Esta clave protege el acceso a este panel de control y evita que los niños modifiquen sus propios tiempos o desbloqueen juegos.
                    </p>
                    <div className="max-w-xs">
                      <label className="text-xs font-bold text-gray-700 block mb-1">Nuevo PIN (4 a 6 dígitos):</label>
                      <input
                        type="password"
                        maxLength={6}
                        value={newPin}
                        onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
                        className="input-text text-lg tracking-widest font-mono"
                      />
                    </div>
                    <button
                      onClick={handleSaveSettings}
                      className="btn-primary mt-4 text-xs flex items-center gap-1.5"
                    >
                      <Save size={14} /> Actualizar PIN Maestro
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notificación de guardado */}
            {saveSuccess && (
              <div className="mt-3 p-2.5 bg-green-100 text-green-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                <CheckCircle size={16} /> ¡Configuración actualizada correctamente en la plataforma!
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
