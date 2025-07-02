import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { FaTimes } from 'react-icons/fa';

interface JoinRoomModalProps {
  isOpen: boolean;
  onCancel: () => void;
  onJoin: (password?: string) => void;
  roomName: string;
  isJoining: boolean;
  requirePassword?: boolean;
  passwordError?: string;
  defaultUserName?: string; // <-- add this prop
}

const glassyModalStyle: React.CSSProperties = {
  background: 'rgba(24, 26, 32, 0.85)',
  backdropFilter: 'blur(16px) saturate(1.2)',
  WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
  borderRadius: '1.5rem',
  boxShadow: '0 8px 40px 0 rgba(16,24,39,0.28), 0 2px 12px 0 rgba(16,185,129,0.10)',
  border: '1.5px solid #10b981',
  animation: 'modalIn 0.22s cubic-bezier(.4,2,.6,1) both',
  maxWidth: 400,
  width: '100%',
  padding: '2.5rem 2rem 2rem 2rem',
  position: 'relative',
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
};

const modalKeyframes = `@keyframes modalIn {
  from { opacity: 0; transform: translateY(32px) scale(0.97); }
  to { opacity: 1; transform: none; }
}`;

const JoinRoomModal: React.FC<JoinRoomModalProps> = ({ isOpen, onCancel, onJoin, roomName, isJoining, requirePassword, passwordError, defaultUserName }) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (!requirePassword || password)) {
      onJoin(password);
    }
  };

  if (!isOpen || !mounted) return null;
  return ReactDOM.createPortal(
    <>
      <style>{modalKeyframes}</style>
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          margin: 0,
          padding: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          background: 'rgba(0,0,0,0.5)',
          pointerEvents: 'all',
        }}
      >
        <div style={{
          background: 'rgba(24, 26, 32, 0.85)',
          backdropFilter: 'blur(16px) saturate(1.2)',
          WebkitBackdropFilter: 'blur(16px) saturate(1.2)',
          borderRadius: '1.5rem',
          boxShadow: '0 8px 40px 0 rgba(16,24,39,0.28), 0 2px 12px 0 rgba(16,185,129,0.10)',
          border: '1.5px solid #10b981',
          animation: 'modalIn 0.22s cubic-bezier(.4,2,.6,1) both',
          maxWidth: 400,
          width: '100%',
          padding: '2.5rem 2rem 2rem 2rem',
          position: 'relative',
        }}>
          <button 
            className="modal-close-btn min-h-[44px] w-full mobile:min-h-[50px]" 
            onClick={onCancel} 
            title="Cancel"
            aria-label="Close join room dialog"
            style={{ position: 'absolute', top: 18, right: 18, background: 'none', border: 'none', color: '#bdbdbd', fontSize: 22, cursor: 'pointer', zIndex: 10 }}
          >
            <FaTimes />
          </button>
          <div className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2" style={{ color: '#fff', letterSpacing: 0.5 }}>Join Room</h2>
            <p className="text-gray-400 mb-6">
              You're about to join:
              <span className="block font-medium text-lg mt-1" style={{ color: '#10b981' }}>{roomName}</span>
            </p>
            {requirePassword && (
              <div className="mb-4 flex flex-col items-center">
                <label htmlFor="room-password" className="block text-sm font-medium text-gray-300 mb-2">Room Password</label>
                <div className="relative w-full max-w-xs">
                  <input
                    id="room-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter room password"
                    value={password}
                    onChange={handlePasswordChange}
                    onKeyDown={handleKeyDown}
                    className="input w-full mb-2 pr-12"
                    disabled={isJoining}
                    autoFocus
                    style={{ background: '#181a1b', color: '#fff', border: '1.5px solid #22242a', borderRadius: 8, padding: '0.7rem 1.1rem', fontSize: 16 }}
                  />
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-200 text-sm"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </button>
                </div>
                {passwordError && <div className="text-red-500 text-sm mt-1">{passwordError}</div>}
              </div>
            )}
            <div className="modal-actions flex flex-col gap-3 mt-4">
              <button
                className="btn btn--primary min-h-[44px] w-full mobile:min-h-[50px]"
                onClick={() => onJoin(password)}
                disabled={isJoining || (requirePassword && !password)}
                aria-busy={isJoining}
                style={{ borderRadius: 12, fontWeight: 700, fontSize: 17, background: 'linear-gradient(90deg, #10b981 80%, #1de9b6 100%)', color: '#181a1b', boxShadow: '0 2px 12px 0 rgba(16,185,129,0.17)' }}
              >
                {isJoining ? 'Joining...' : `Join ${roomName}`}
              </button>
              <button 
                className="btn btn--secondary min-h-[44px] w-full mobile:min-h-[50px]"
                onClick={async () => {
                  console.log('Cancel button clicked');
                  await onCancel();
                }}
                disabled={isJoining}
                style={{ borderRadius: 12, fontWeight: 700, fontSize: 17, background: 'rgba(24,26,32,0.7)', color: '#fff', border: '1.5px solid #22242a' }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default JoinRoomModal;
