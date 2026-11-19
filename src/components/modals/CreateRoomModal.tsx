import React, { useState } from 'react';
import { Check, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { PlayerFormat } from '../../types/game';
import { MiniBoardIcon } from '../MiniBoardIcon';
import { sound } from '../../engine/sound';

export const CreateRoomModal: React.FC = () => {
  const { setActiveModal, createPrivateRoom } = useGame();
  const [format, setFormat] = useState<PlayerFormat>('2v2');
  const [mode, setMode] = useState<'disc-pool' | 'carrom'>('disc-pool');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    setCreating(true);
    await createPrivateRoom(format, mode);
    setCreating(false);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/65 backdrop-blur-[1px] flex items-center justify-center p-4">
      {/* Exact match to Screenshot 1! */}
      <div className="wood-panel rounded-2xl w-full max-w-[340px] px-4 pt-5 pb-5 relative animate-pop">
        {/* Red circular X close button */}
        <button
          onClick={() => {
            sound.playClick();
            setActiveModal(null);
          }}
          className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-gradient-to-b from-red-400 to-red-700 border-2 border-white flex items-center justify-center shadow-lg active:scale-95"
          aria-label="Close"
        >
          <X className="w-5 h-5 text-white stroke-[3.5]" />
        </button>

        {/* Select Players Section */}
        <h2 className="text-[20px] font-extrabold text-[#fef0c7] text-stroke-sm text-center mb-2.5">
          Select Players
        </h2>
        <div className="wood-recessed rounded-xl p-2.5 grid grid-cols-2 gap-2.5 mb-4">
          {(['1v1', '2v2'] as const).map((opt) => {
            const selected = format === opt;
            return (
              <button
                key={opt}
                onClick={() => {
                  sound.playClick();
                  setFormat(opt);
                }}
                className="relative h-14 rounded-xl px-3.5 flex items-center justify-between transition-all active:scale-95"
                style={{
                  background: selected
                    ? 'linear-gradient(180deg, #27b863 0%, #177844 100%)'
                    : 'linear-gradient(180deg, #a6572b 0%, #7d3a18 100%)',
                  border: selected ? '2.5px solid #4ade80' : '1.5px solid #c77c4e',
                  boxShadow: selected
                    ? '0 0 14px rgba(74,222,128,0.65), inset 0 2px 0 rgba(255,255,255,0.35)'
                    : 'inset 0 2px 0 rgba(255,220,185,0.25), 0 3px 6px rgba(0,0,0,0.4)',
                }}
              >
                <span className="text-[20px] font-black text-white text-stroke-sm">{opt}</span>
                <span
                  className={`w-7 h-7 rounded-md flex items-center justify-center border-2 ${
                    selected
                      ? 'bg-lime-500 border-lime-200 shadow'
                      : 'bg-[#5c2b12] border-[#3d1a08]'
                  }`}
                >
                  {selected && <Check className="w-5 h-5 text-white stroke-[3.5]" />}
                </span>
              </button>
            );
          })}
        </div>

        {/* Select Mode Section */}
        <h2 className="text-[20px] font-extrabold text-[#fef0c7] text-stroke-sm text-center mb-2.5">
          Select Mode
        </h2>
        <div className="wood-recessed rounded-xl p-2.5 space-y-2.5 mb-5">
          {(
            [
              { id: 'disc-pool' as const, line1: 'Play', line2: 'Disc Pool' },
              { id: 'carrom' as const, line1: 'Play', line2: 'Carrom' },
            ]
          ).map((item) => {
            const selected = mode === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  sound.playClick();
                  setMode(item.id);
                }}
                className="w-full h-[76px] rounded-xl px-3.5 flex items-center justify-between transition-all active:scale-[0.98]"
                style={{
                  background: selected
                    ? 'linear-gradient(180deg, #27b863 0%, #177844 100%)'
                    : 'linear-gradient(180deg, #a6572b 0%, #7d3a18 100%)',
                  border: selected ? '2.5px solid #4ade80' : '1.5px solid #c77c4e',
                  boxShadow: selected
                    ? '0 0 14px rgba(74,222,128,0.65), inset 0 2px 0 rgba(255,255,255,0.35)'
                    : 'inset 0 2px 0 rgba(255,220,185,0.25), 0 3px 6px rgba(0,0,0,0.4)',
                }}
              >
                <div className="text-left leading-tight">
                  <div className="text-[16px] font-extrabold text-white text-stroke-sm">
                    {item.line1}
                  </div>
                  <div className="text-[17px] font-black text-white text-stroke-sm">
                    {item.line2}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <MiniBoardIcon mode={item.id} size={74} />
                  <span
                    className={`w-7 h-7 rounded-md flex items-center justify-center border-2 shrink-0 ${
                      selected
                        ? 'bg-lime-500 border-lime-200 shadow'
                        : 'bg-[#5c2b12] border-[#3d1a08]'
                    }`}
                  >
                    {selected && <Check className="w-5 h-5 text-white stroke-[3.5]" />}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Create Room Button */}
        <div className="flex justify-center">
          <button
            onClick={handleCreate}
            disabled={creating}
            className="btn-green px-8 py-2.5 rounded-xl text-[18px] font-extrabold text-white text-stroke-sm"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </button>
        </div>
      </div>
    </div>
  );
};
