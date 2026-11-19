import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../engine/sound';

export const JoinRoomModal: React.FC = () => {
  const { setActiveModal, joinPrivateRoom } = useGame();
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res = await joinPrivateRoom(code);
    setBusy(false);
    if (!res.ok) setError(res.error || 'Could not join room');
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/70 flex items-center justify-center p-5">
      <div className="wood-panel rounded-2xl w-full max-w-xs p-5 relative animate-pop">
        <button
          onClick={() => {
            sound.playClick();
            setActiveModal(null);
          }}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-xl font-extrabold text-yellow-300 text-stroke-sm text-center mb-1">
          Join Private Room
        </h2>
        <p className="text-xs text-amber-100/85 text-center mb-4">
          Enter the 6-character code shared by your friend
        </p>

        <form onSubmit={handleJoin} className="space-y-3">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6))}
            placeholder="e.g. 518HXP"
            className="w-full wood-recessed rounded-xl py-3 px-4 text-center text-2xl font-black tracking-[0.25em] text-white outline-none border border-[#a86939] select-text uppercase"
            autoFocus
          />

          {error && <p className="text-xs font-bold text-red-300 text-center">{error}</p>}

          <button
            type="submit"
            disabled={busy || code.length < 4}
            className="btn-gold w-full py-2.5 rounded-xl text-base font-extrabold text-amber-950 disabled:opacity-50"
          >
            {busy ? 'Joining...' : 'Join Room'}
          </button>
        </form>
      </div>
    </div>
  );
};
