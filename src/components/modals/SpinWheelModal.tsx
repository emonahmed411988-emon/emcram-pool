import React, { useState } from 'react';
import { X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { SPIN_SLICES } from '../../data/events';
import { sound } from '../../engine/sound';

export const SpinWheelModal: React.FC = () => {
  const { setActiveModal, grantSpinReward } = useGame();
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastWin, setLastWin] = useState<string | null>(null);

  const sliceAngle = 360 / SPIN_SLICES.length;

  const handleSpin = () => {
    if (spinning) return;
    sound.playClick();
    setSpinning(true);
    setLastWin(null);

    const winIndex = Math.floor(Math.random() * SPIN_SLICES.length);
    const targetSliceCenter = winIndex * sliceAngle + sliceAngle / 2;
    const extraSpins = 5 * 360;
    const nextRot = rotation + extraSpins + (360 - ((rotation + targetSliceCenter) % 360));
    setRotation(nextRot);

    setTimeout(() => {
      const prize = SPIN_SLICES[winIndex];
      grantSpinReward(prize.type, prize.amount);
      setLastWin(`You won ${prize.label} ${prize.type === 'coins' ? 'Coins' : ''}!`);
      setSpinning(false);
    }, 3600);
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="wood-panel rounded-3xl p-5 w-full max-w-[330px] relative animate-pop flex flex-col items-center space-y-3">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-2xl font-black text-yellow-300 text-stroke-md">Spin &amp; Win!</h2>

        {/* Pointer Triangle */}
        <div className="relative flex items-center justify-center my-1">
          <div className="absolute -top-3 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[22px] border-t-yellow-300 drop-shadow-lg" />

          <div
            className="w-60 h-60 rounded-full border-[6px] border-yellow-400 shadow-2xl overflow-hidden"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? 'transform 3.5s cubic-bezier(0.16, 0.9, 0.22, 1)' : 'none',
            }}
          >
            <svg viewBox="0 0 200 200" className="w-full h-full">
              {SPIN_SLICES.map((sl, i) => {
                const startA = (i * sliceAngle - 90) * (Math.PI / 180);
                const endA = ((i + 1) * sliceAngle - 90) * (Math.PI / 180);
                const x1 = 100 + 100 * Math.cos(startA);
                const y1 = 100 + 100 * Math.sin(startA);
                const x2 = 100 + 100 * Math.cos(endA);
                const y2 = 100 + 100 * Math.sin(endA);
                const midDeg = i * sliceAngle + sliceAngle / 2;
                return (
                  <g key={i}>
                    <path
                      d={`M100,100 L${x1},${y1} A100,100 0 0,1 ${x2},${y2} Z`}
                      fill={sl.color}
                      stroke="#fde047"
                      strokeWidth="1.5"
                    />
                    <text
                      x="100"
                      y="32"
                      textAnchor="middle"
                      fill="#ffffff"
                      fontSize="12"
                      fontWeight="900"
                      transform={`rotate(${midDeg} 100 100)`}
                    >
                      {sl.label}
                    </text>
                  </g>
                );
              })}
              <circle cx="100" cy="100" r="22" fill="#facc15" stroke="#78350f" strokeWidth="4" />
              <text x="100" y="104" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="900">
                SPIN
              </text>
            </svg>
          </div>
        </div>

        {lastWin && (
          <div className="text-sm font-extrabold text-lime-300 animate-pop">{lastWin}</div>
        )}

        <button
          onClick={handleSpin}
          disabled={spinning}
          className="btn-green w-full py-2.5 rounded-xl text-base font-extrabold text-white text-stroke-sm disabled:opacity-60"
        >
          {spinning ? 'Spinning...' : 'FREE SPIN'}
        </button>
      </div>
    </div>
  );
};
