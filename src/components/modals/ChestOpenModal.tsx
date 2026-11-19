import React from 'react';
import { Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getStrikerDef } from '../../data/equipment';
import { CoinIcon, GemIcon, StrikerArt } from '../StrikerArt';
import { formatNumberSpaced } from '../../services/storage';

export const ChestOpenModal: React.FC = () => {
  const { chestReveal, clearChestReveal } = useGame();
  if (!chestReveal) return null;

  return (
    <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-5">
      <div className="wood-panel rounded-3xl p-5 w-full max-w-xs text-center animate-pop space-y-4">
        <div className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-400/20 border border-yellow-300/60 text-xs font-black text-yellow-300">
          <Sparkles className="w-3.5 h-3.5" /> CHEST OPENED!
        </div>

        <h2 className="text-xl font-black text-white text-stroke-md -mt-2">
          {chestReveal.chestName}
        </h2>

        {/* Coins & Gems */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="bg-black/40 border border-yellow-400/40 rounded-2xl p-3 flex flex-col items-center">
            <CoinIcon size={34} />
            <span className="text-lg font-black text-yellow-300 mt-1">
              +{formatNumberSpaced(chestReveal.coins)}
            </span>
            <span className="text-[10px] font-bold text-amber-200">Coins</span>
          </div>
          <div className="bg-black/40 border border-sky-400/40 rounded-2xl p-3 flex flex-col items-center">
            <GemIcon size={34} />
            <span className="text-lg font-black text-sky-300 mt-1">+{chestReveal.gems}</span>
            <span className="text-[10px] font-bold text-sky-200">Gems</span>
          </div>
        </div>

        {/* Striker Cards */}
        <div className="space-y-2">
          <div className="text-xs font-extrabold text-amber-200">Striker Cards Found</div>
          <div className="grid grid-cols-2 gap-2">
            {chestReveal.cards.map((c, idx) => {
              const def = getStrikerDef(c.strikerId);
              return (
                <div
                  key={`${c.strikerId}-${idx}`}
                  className="rounded-xl p-2.5 flex flex-col items-center border border-yellow-300/50 relative"
                  style={{
                    background: `linear-gradient(180deg, ${def.bgGradient[0]}, ${def.bgGradient[1]})`,
                  }}
                >
                  {c.newlyUnlocked && (
                    <span className="absolute -top-2 px-1.5 py-0.5 rounded bg-lime-500 text-[9px] font-black text-black shadow">
                      UNLOCKED!
                    </span>
                  )}
                  <StrikerArt strikerId={def.id} size={50} />
                  <div className="text-xs font-extrabold text-white mt-1">{def.name}</div>
                  <div className="text-[10px] font-black text-yellow-300">+{c.count} Cards</div>
                </div>
              );
            })}
          </div>
        </div>

        <button
          onClick={clearChestReveal}
          className="btn-green w-full py-2.5 rounded-xl text-base font-extrabold text-white text-stroke-sm"
        >
          Collect All!
        </button>
      </div>
    </div>
  );
};
