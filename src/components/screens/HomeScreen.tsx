import React, { useEffect, useState } from 'react';
import { Gift, Target, BarChart3, Clock } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { BottomNav } from '../BottomNav';
import { MiniBoardIcon } from '../MiniBoardIcon';
import { CoinIcon, GemIcon } from '../StrikerArt';
import { ChestSlot } from '../../types/game';
import { sound } from '../../engine/sound';

const ChestArt: React.FC<{ tier: ChestSlot['tier'] }> = ({ tier }) => {
  const trim =
    tier === 'legend'
      ? '#a855f7'
      : tier === 'gold'
        ? '#facc15'
        : tier === 'silver'
          ? '#94a3b8'
          : '#22c55e';
  const body =
    tier === 'legend'
      ? '#4c1d95'
      : tier === 'gold'
        ? '#b45309'
        : tier === 'silver'
          ? '#475569'
          : '#a1622a';

  return (
    <svg viewBox="0 0 80 68" className="w-16 h-14 drop-shadow-md">
      {/* Lid */}
      <path d="M8 26 L14 10 L66 10 L72 26 Z" fill={body} stroke="#f5d08a" strokeWidth="2.5" />
      <rect x="14" y="13" width="52" height="10" rx="2" fill={trim} opacity="0.85" />
      {/* Base */}
      <rect x="10" y="26" width="60" height="34" rx="4" fill={body} stroke="#f5d08a" strokeWidth="2.5" />
      <rect x="14" y="30" width="52" height="26" rx="2" fill="#7c4217" opacity="0.5" />
      {/* Gold metal straps */}
      <rect x="20" y="10" width="7" height="50" fill="#eab308" stroke="#78350f" strokeWidth="1" />
      <rect x="53" y="10" width="7" height="50" fill="#eab308" stroke="#78350f" strokeWidth="1" />
      {/* Center keyhole clasp */}
      <rect x="33" y="22" width="14" height="18" rx="3" fill="#fde047" stroke="#78350f" strokeWidth="2" />
      <rect x="36" y="25" width="8" height="12" rx="1.5" fill={trim} />
      <circle cx="40" cy="30" r="2" fill="#18181b" />
      <rect x="39" y="30" width="2" height="4" fill="#18181b" />
    </svg>
  );
};

export const HomeScreen: React.FC = () => {
  const {
    account,
    openModeStages,
    setActiveModal,
    startChestUnlock,
    openChestNow,
    claimHourlyGift,
  } = useGame();

  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(id);
  }, []);

  // Live Leaderboard Countdown (15h 06m 39s ticking feel!)
  const secsLeft = Math.max(0, 54399 - (Math.floor(now / 1000) % 54399));
  const hrs = Math.floor(secsLeft / 3600);
  const mins = Math.floor((secsLeft % 3600) / 60);
  const secs = secsLeft % 60;
  const countdownText = `${hrs}h ${String(mins).padStart(2, '0')}m ${String(secs).padStart(2, '0')}s`;

  const freeGiftAvailable =
    !account.dailyRewards.freeGiftLastAt || now - account.dailyRewards.freeGiftLastAt > 600000;

  return (
    <div className="flex flex-col h-full w-full relative overflow-hidden">
      <TopBar />

      {/* Royal Blue Scenic Night Backdrop (Paris Eiffel Tower + Palace domes matching Screenshot 8!) */}
      <div
        className="flex-1 relative flex flex-col justify-between px-2.5 pt-2 pb-2.5 overflow-y-auto game-scroll"
        style={{
          background:
            'radial-gradient(ellipse at 50% 25%, #1655d4 0%, #0d328f 48%, #071952 100%)',
        }}
      >
        {/* Atmospheric Silhouette Layer */}
        <svg
          viewBox="0 0 400 600"
          preserveAspectRatio="xMidYMax slice"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
        >
          {/* Sparkling sky glow */}
          <circle cx="95" cy="90" r="2" fill="#93c5fd" />
          <circle cx="310" cy="70" r="2.5" fill="#bfdbfe" />
          <circle cx="240" cy="140" r="1.8" fill="#dbeafe" />
          <circle cx="60" cy="210" r="2" fill="#93c5fd" />
          {/* Eiffel Tower silhouette right */}
          <path
            d="M342 195 L348 195 L354 315 L370 430 L392 520 L368 520 C362 475 352 465 345 465 C338 465 328 475 322 520 L298 520 L320 430 L336 315 Z"
            fill="#07194a"
          />
          <rect x="320" y="390" width="50" height="8" fill="#0d2b7a" />
          <rect x="331" y="325" width="28" height="6" fill="#0d2b7a" />
          {/* Palace domes center-bottom */}
          <path
            d="M145 520 L145 435 Q185 380 225 435 L225 520 Z"
            fill="#0b2366"
          />
          <rect x="112" y="425" width="12" height="95" fill="#0b2366" />
          <rect x="246" y="425" width="12" height="95" fill="#0b2366" />
          <path d="M20 520 L20 420 L65 395 L105 430 L105 520 Z" fill="#081a4f" />
        </svg>

        {/* Top 3 Action Buttons Strip */}
        <div className="relative z-10 grid grid-cols-3 gap-1.5">
          {/* Free Rewards */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('free-rewards');
            }}
            className="btn-orange relative rounded-xl pt-3 pb-1.5 px-1.5 flex flex-col items-center justify-center"
          >
            <div className="absolute -top-2.5 flex items-center -space-x-1.5">
              <CoinIcon size={20} />
              <GemIcon size={18} />
            </div>
            <span className="absolute -top-1.5 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-white text-[10px] font-extrabold flex items-center justify-center shadow">
              5
            </span>
            <span className="text-[11px] font-extrabold leading-tight text-white text-stroke-sm">
              Free Rewards
            </span>
            <span className="text-[10px] font-bold text-[#fde047] leading-tight">
              Collect Now!
            </span>
          </button>

          {/* Lucky Shot */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('lucky-shot');
            }}
            className="btn-orange relative rounded-xl pt-3 pb-1.5 px-1.5 flex flex-col items-center justify-center"
          >
            <div className="absolute -top-2.5 w-6 h-6 rounded-full bg-amber-400 border-2 border-amber-900 flex items-center justify-center shadow">
              <Target className="w-4 h-4 text-amber-950 stroke-[2.5]" />
            </div>
            <span className="text-[12px] font-extrabold text-white text-stroke-sm leading-tight mt-0.5">
              Lucky Shot
            </span>
          </button>

          {/* Leaderboards */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('leaderboard');
            }}
            className="btn-orange relative rounded-xl pt-3 pb-1.5 px-1 flex flex-col items-center justify-center"
          >
            <div className="absolute -top-2.5 w-6 h-6 rounded-md bg-yellow-400 border-2 border-amber-900 flex items-center justify-center shadow">
              <BarChart3 className="w-4 h-4 text-amber-950 stroke-[2.5]" />
            </div>
            <span className="text-[11px] font-extrabold text-white text-stroke-sm leading-tight">
              Leaderboards
            </span>
            <span className="text-[9px] font-bold text-[#fef08a] leading-tight whitespace-nowrap">
              Ends in: {countdownText}
            </span>
          </button>
        </div>

        {/* Floating Gift Box + Hero CARROM Pool Logo + SPIN Wheel */}
        <div className="relative z-10 flex items-center justify-between px-1 my-1">
          {/* Left Gift Box */}
          <button
            onClick={claimHourlyGift}
            className="relative flex flex-col items-center active:scale-90 transition-transform animate-float"
            title="Claim Free Gift"
          >
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-sky-400 to-blue-700 border-2 border-yellow-300 shadow-lg flex items-center justify-center">
              <Gift className="w-7 h-7 text-yellow-300 drop-shadow" />
            </div>
            {freeGiftAvailable && (
              <span className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-green-500 border-2 border-white text-[10px] font-extrabold flex items-center justify-center shadow">
                1
              </span>
            )}
          </button>

          {/* Center Hero Logo (CARROM Pool with black & white pucks on top!) */}
          <div className="flex flex-col items-center -mt-1">
            <div className="flex items-center -mb-2.5 z-10">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-zinc-600 via-zinc-900 to-black border-2 border-zinc-400 shadow-lg -mr-2 flex items-center justify-center">
                <div className="w-5 h-5 rounded-full border border-zinc-500/70" />
              </div>
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white via-amber-50 to-amber-200 border-2 border-amber-300 shadow-lg flex items-center justify-center">
                <div className="w-6 h-6 rounded-full border border-amber-400/70" />
              </div>
            </div>
            <div
              className="px-5 py-1 rounded-full border-[3px] border-[#eab676] shadow-xl"
              style={{
                background: 'linear-gradient(180deg, #5e248a 0%, #3a115e 100%)',
                boxShadow: 'inset 0 2px 3px rgba(255,255,255,0.35), 0 5px 14px rgba(0,0,0,0.65)',
              }}
            >
              <span
                className="text-[22px] font-black tracking-wider block leading-none"
                style={{
                  background: 'linear-gradient(180deg, #fff5b8 0%, #f5b935 65%, #d97706 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  filter: 'drop-shadow(0 2px 0 rgba(55,15,5,0.9))',
                }}
              >
                CARROM
              </span>
            </div>
            <span
              className="font-script text-[28px] leading-none -mt-2 text-[#ff6b2b] drop-shadow"
              style={{
                textShadow:
                  '0 2px 0 #fff, 2px 0 0 #fff, -2px 0 0 #fff, 0 -1.5px 0 #fff, 0 4px 8px rgba(0,0,0,0.65)',
              }}
            >
              Pool
            </span>
          </div>

          {/* Right Spin Wheel */}
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('spin-wheel');
            }}
            className="relative flex flex-col items-center active:scale-90 transition-transform"
            title="Spin & Win"
          >
            <div className="w-12 h-12 rounded-full border-[3px] border-yellow-300 shadow-lg overflow-hidden relative bg-white">
              <svg viewBox="0 0 48 48" className="w-full h-full">
                <path d="M24,24 L24,0 A24,24 0 0,1 48,24 Z" fill="#16a34a" />
                <path d="M24,24 L48,24 A24,24 0 0,1 24,48 Z" fill="#facc15" />
                <path d="M24,24 L24,48 A24,24 0 0,1 0,24 Z" fill="#dc2626" />
                <path d="M24,24 L0,24 A24,24 0 0,1 24,0 Z" fill="#2563eb" />
                <circle cx="24" cy="24" r="6" fill="#fef08a" stroke="#78350f" strokeWidth="2" />
              </svg>
            </div>
            <span className="-mt-2 px-2 py-0.5 rounded bg-gradient-to-b from-red-500 to-red-700 border border-yellow-300 text-[10px] font-black tracking-wider text-yellow-200 shadow">
              SPIN
            </span>
          </button>
        </div>

        {/* 3 Big Mode Selection Cards (Exact colors & wooden frames from Screenshot 8!) */}
        <div className="relative z-10 flex flex-col gap-2 px-4 my-0.5">
          {/* Play Disc Pool */}
          <button
            onClick={() => openModeStages('disc-pool')}
            className="group relative rounded-2xl p-[3.5px] active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(180deg, #b56e35 0%, #6b3614 100%)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,175,0.5)',
            }}
          >
            <div
              className="rounded-xl px-4 py-2 flex items-center justify-between border border-[#60a5fa]/60"
              style={{
                background: 'linear-gradient(180deg, #1d57a8 0%, #103775 60%, #0a2454 100%)',
                boxShadow: 'inset 0 2px 6px rgba(147,197,253,0.35)',
              }}
            >
              <div className="text-left">
                <div className="text-[17px] font-extrabold leading-tight text-white text-stroke-md">
                  Play
                </div>
                <div className="text-[20px] font-black leading-tight text-white text-stroke-md">
                  Disc Pool
                </div>
              </div>
              <div className="group-hover:scale-105 transition-transform -my-3">
                <MiniBoardIcon mode="disc-pool" size={86} />
              </div>
            </div>
          </button>

          {/* Play Carrom */}
          <button
            onClick={() => openModeStages('carrom')}
            className="group relative rounded-2xl p-[3.5px] active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(180deg, #b56e35 0%, #6b3614 100%)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,175,0.5)',
            }}
          >
            <div
              className="rounded-xl px-4 py-2 flex items-center justify-between border border-[#4ade80]/60"
              style={{
                background: 'linear-gradient(180deg, #1c8546 0%, #116130 60%, #0a421f 100%)',
                boxShadow: 'inset 0 2px 6px rgba(134,239,172,0.35)',
              }}
            >
              <div className="text-left">
                <div className="text-[17px] font-extrabold leading-tight text-white text-stroke-md">
                  Play
                </div>
                <div className="text-[20px] font-black leading-tight text-white text-stroke-md">
                  Carrom
                </div>
              </div>
              <div className="group-hover:scale-105 transition-transform -my-3">
                <MiniBoardIcon mode="carrom" size={86} />
              </div>
            </div>
          </button>

          {/* Play Freestyle */}
          <button
            onClick={() => openModeStages('freestyle')}
            className="group relative rounded-2xl p-[3.5px] active:scale-[0.98] transition-transform"
            style={{
              background: 'linear-gradient(180deg, #b56e35 0%, #6b3614 100%)',
              boxShadow: '0 6px 14px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,220,175,0.5)',
            }}
          >
            <div
              className="rounded-xl px-4 py-2 flex items-center justify-between border border-[#fcd34d]/60"
              style={{
                background: 'linear-gradient(180deg, #de861c 0%, #b35a0d 60%, #8a3f06 100%)',
                boxShadow: 'inset 0 2px 6px rgba(254,240,138,0.35)',
              }}
            >
              <div className="text-left">
                <div className="text-[17px] font-extrabold leading-tight text-white text-stroke-md">
                  Play
                </div>
                <div className="text-[20px] font-black leading-tight text-white text-stroke-md">
                  Freestyle
                </div>
              </div>
              <div className="group-hover:scale-105 transition-transform -my-3">
                <MiniBoardIcon mode="freestyle" size={86} />
              </div>
            </div>
          </button>
        </div>

        {/* Bottom 4 Chest Slots Row (Matches Screenshot 8!) */}
        <div className="relative z-10 grid grid-cols-4 gap-2 pt-2">
          {account.chests.map((chest, idx) => {
            if (!chest) {
              return (
                <div
                  key={idx}
                  className="h-[92px] rounded-xl border border-blue-400/35 bg-[#091c52]/60 flex flex-col items-center justify-center text-center px-1 shadow-inner"
                >
                  <span className="text-[12px] font-bold text-blue-200/70 leading-tight">
                    Chest
                    <br />
                    Slot
                  </span>
                </div>
              );
            }

            const elapsed = chest.unlockStartedAt ? (now - chest.unlockStartedAt) / 1000 : 0;
            const remaining = Math.max(0, Math.ceil(chest.durationSec - elapsed));
            const isReady = chest.unlockStartedAt !== null && remaining <= 0;
            const isUnlocking = chest.unlockStartedAt !== null && remaining > 0;

            return (
              <button
                key={chest.id}
                onClick={() => {
                  if (isReady) openChestNow(idx, false);
                  else if (isUnlocking) openChestNow(idx, true);
                  else startChestUnlock(idx);
                }}
                className={`relative h-[92px] rounded-xl flex flex-col items-center justify-between pb-1 pt-1 px-1 transition-transform active:scale-95 ${
                  isReady ? 'animate-glow' : ''
                }`}
                style={{
                  background: isReady
                    ? 'linear-gradient(180deg, #1b8a3f 0%, #0f5425 100%)'
                    : 'linear-gradient(180deg, #915226 0%, #5c2e10 100%)',
                  border: isReady ? '2px solid #86efac' : '2px solid #d4965b',
                  boxShadow: '0 4px 10px rgba(0,0,0,0.55)',
                }}
              >
                {/* Top action banner */}
                <div
                  className={`-mt-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold leading-tight shadow ${
                    isReady
                      ? 'bg-green-500 text-white border border-green-200'
                      : isUnlocking
                        ? 'bg-amber-500 text-amber-950 border border-yellow-200'
                        : 'bg-blue-600 text-white border border-sky-300'
                  }`}
                >
                  {isReady ? 'Open Now!' : isUnlocking ? '5 💎 Open' : 'Tap to Unlock'}
                </div>

                <ChestArt tier={chest.tier} />

                <div className="flex items-center gap-0.5 text-[11px] font-extrabold text-amber-100">
                  {isUnlocking && <Clock className="w-3 h-3 text-yellow-300" />}
                  <span>
                    {isReady
                      ? 'READY!'
                      : isUnlocking
                        ? `${remaining}s`
                        : `${chest.durationSec}s`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
