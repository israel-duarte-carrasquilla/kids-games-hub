import React, { useState } from 'react';
import { useStorage } from '../context/StorageContext';
import { User, LogIn, Sparkles, Plus, AlertCircle, CheckCircle2 } from 'lucide-react';

const AVATARS = ['🦊', '🦄', '🦖', '🚀', '🦁', '🐱', '🐼', '🤖', '👑', '⭐'];

export default function LoginModal({ isOpen, onClose }) {
  const { profiles, addProfile, setCurrentUser } = useStorage();
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newAge, setNewAge] = useState(7);
  const [newAvatar, setNewAvatar] = useState('🦊');
  const [showGoogleSimulation, setShowGoogleSimulation] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');

  if (!isOpen) return null;

  const handleSelectProfile = (profile) => {
    setCurrentUser(profile);
    onClose();
  };

  const handleCreateProfile = (e) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newProfile = {
      id: 'kid-' + Date.now(),
      name: newName.trim(),
      age: parseInt(newAge, 10) || 6,
      avatar: newAvatar,
      googleLinked: false,
      email: ''
    };

    addProfile(newProfile);
    setCurrentUser(newProfile);
    setIsCreatingNew(false);
    setNewName('');
    onClose();
  };

  const handleGoogleSignIn = (e) => {
    e.preventDefault();
    const cleanEmail = googleEmail.trim() || 'hijo.gamer@gmail.com';
    const inferredName = cleanEmail.split('@')[0].replace(/[._]/g, ' ');
    const capitalizedName = inferredName.charAt(0).toUpperCase() + inferredName.slice(1);

    const googleProfile = {
      id: 'google-' + Date.now(),
      name: capitalizedName || 'Jugador Google',
      age: 8,
      avatar: '🌟',
      googleLinked: true,
      email: cleanEmail
    };

    addProfile(googleProfile);
    setCurrentUser(googleProfile);
    setShowGoogleSimulation(false);
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-card">
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <span className="text-3xl">🎮</span>
            <div>
              <h2 className="modal-title">¿Quién va a jugar hoy?</h2>
              <p className="modal-subtitle">Elige tu personaje o inicia sesión para guardar tus récords</p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        {!isCreatingNew && !showGoogleSimulation && (
          <div>
            <div className="profiles-grid">
              {profiles.map(profile => (
                <button
                  key={profile.id}
                  onClick={() => handleSelectProfile(profile)}
                  className="profile-card group"
                >
                  <div className="avatar-circle">
                    <span className="text-4xl">{profile.avatar}</span>
                    {profile.googleLinked && (
                      <span className="google-badge" title="Vinculado con Google">G</span>
                    )}
                  </div>
                  <span className="profile-name">{profile.name}</span>
                  <span className="profile-age">{profile.age} años</span>
                </button>
              ))}

              <button
                onClick={() => setIsCreatingNew(true)}
                className="profile-card new-profile-btn"
              >
                <div className="avatar-circle add-circle">
                  <Plus size={32} />
                </div>
                <span className="profile-name font-bold text-indigo-600">+ Nuevo Niño</span>
                <span className="profile-age">Crear perfil</span>
              </button>
            </div>

            <div className="divider-or">
              <span>O conéctate con tu cuenta</span>
            </div>

            <button
              onClick={() => setShowGoogleSimulation(true)}
              className="google-login-btn"
            >
              <svg width="22" height="22" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3h3.88c2.27-2.09 3.66-5.17 3.66-9.09z"/>
                <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.26v3.09C3.25 21.36 7.33 24 12 24z"/>
                <path fill="#FBBC05" d="M5.28 14.32c-.25-.72-.38-1.49-.38-2.32s.13-1.6.38-2.32V6.59H1.26C.46 8.18 0 9.99 0 12s.46 3.82 1.26 5.41l4.02-3.09z"/>
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.25 2.64 1.26 6.59l4.02 3.09c.95-2.83 3.6-4.93 6.72-4.93z"/>
              </svg>
              <span>Acceder con Google</span>
            </button>
          </div>
        )}

        {/* Modal simulación / integración Google */}
        {showGoogleSimulation && (
          <form onSubmit={handleGoogleSignIn} className="new-profile-form">
            <div className="google-info-box">
              <span className="text-2xl">🌐</span>
              <div>
                <strong>Acceso con Cuenta Google para Hijos</strong>
                <p className="text-xs text-gray-600 mt-0.5">
                  Conecta la cuenta de Google para almacenar de forma individual sus logros, partidas y tiempos jugados.
                </p>
              </div>
            </div>

            <div className="form-group">
              <label>Correo de Google (o del menor):</label>
              <input
                type="email"
                placeholder="ejemplo: mateo.gaming@gmail.com"
                value={googleEmail}
                onChange={(e) => setGoogleEmail(e.target.value)}
                required
                className="input-text"
              />
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowGoogleSimulation(false)}
              >
                Volver
              </button>
              <button type="submit" className="btn-primary flex items-center gap-1">
                <CheckCircle2 size={18} /> Continuar con Google
              </button>
            </div>
          </form>
        )}

        {/* Formulario crear nuevo perfil */}
        {isCreatingNew && (
          <form onSubmit={handleCreateProfile} className="new-profile-form">
            <div className="form-group">
              <label>Nombre del Niño(a):</label>
              <input
                type="text"
                placeholder="Ej. Mateo, Sofía, Leo..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                required
                className="input-text"
                maxLength={20}
              />
            </div>

            <div className="form-group">
              <label>Edad: {newAge} años</label>
              <input
                type="range"
                min="3"
                max="14"
                value={newAge}
                onChange={(e) => setNewAge(e.target.value)}
                className="w-full accent-indigo-600"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>3 años (Peques)</span>
                <span>8 años (Media)</span>
                <span>14 años (Grandes)</span>
              </div>
            </div>

            <div className="form-group">
              <label>Elige tu Avatar favorito:</label>
              <div className="avatar-picker">
                {AVATARS.map(av => (
                  <button
                    key={av}
                    type="button"
                    onClick={() => setNewAvatar(av)}
                    className={`avatar-choice ${newAvatar === av ? 'active' : ''}`}
                  >
                    {av}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 justify-end mt-4">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsCreatingNew(false)}
              >
                Cancelar
              </button>
              <button type="submit" className="btn-primary">
                Guardar y Empezar a Jugar 🚀
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
