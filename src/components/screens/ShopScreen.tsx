import React from 'react';
import { Sparkles, PackageOpen } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { BottomNav } from '../BottomNav';
import { CoinIcon, CoinStackIcon, GemIcon } from '../StrikerArt';
import { formatNumberSpaced } from '../../services/storage';

export const ShopScreen: React.FC = () => {
  const { buyShopChest, buyCoinPack, claimFreeGemPack } = useGame();

  const chests = [
    {
      tier: 'silver' as const,
      name: 'Silver Pro Chest',
      desc: 'Guaranteed Rare/Epic Striker Cards + Coins',
      gems: 10,
      gradient: ['#64748b', '#1e293b'],
      badge: 'POPULAR',
    },
    {
      tier: 'gold' as const,
      name: 'Golden Royal Chest',
      desc: 'High chance for Legendary Trace & Toran!',
      gems: 20,
      gradient: ['#d97706', '#78350f'],
      badge: 'BEST VALUE',
    },
    {
      tier: 'legend' as const,
      name: 'Mythic Legend Chest',
      desc: 'Guaranteed Mythic Astro / Pulse / Aura Cards!',
      gems: 35,
      gradient: ['#7e22ce', '#3b0764'],
      badge: 'MYTHIC',
    },
  ];

  const coinPacks = [
    { coins: 2000, gems: 5, label: 'Starter Pile' },
    { coins: 6000, gems: 12, label: 'Pro Stack' },
    { coins: 15000, gems: 25, label: 'Royal Vault' },
    { coins: 40000, gems: 50, label: 'Champion Hoard' },
  ];

  return (
    <div className="flex flex-col h-full w-full bg-gradient-to-b from-[#5e2a12] to-[#2e1207] relative overflow-hidden">
      <TopBar title="Shop" />

      <div className="flex-1 overflow-y-auto game-scroll p-3 space-y-4">
        {/* Free Bonus Banner */}
        <div className="rounded-2xl p-3.5 border-2 border-lime-400 bg-gradient-to-r from-emerald-800 to-teal-900 flex items-center justify-between gap-2 shadow-lg">
          <div>
            <div className="text-[10px] font-black text-lime-300 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> FREE DAILY REFILL
            </div>
            <div className="text-sm font-extrabold text-white">Free Coins &amp; Gems Pack</div>
            <div className="text-[11px] text-emerald-200">+1,000 Coins &amp; +15 Gems</div>
          </div>
          <button
            onClick={claimFreeGemPack}
            className="btn-green px-3.5 py-2 rounded-xl text-xs font-extrabold text-white text-stroke-sm shrink-0"
          >
            Claim Free
          </button>
        </div>

        {/* Striker Chests Section */}
        <div>
          <h2 className="text-sm font-extrabold text-yellow-300 text-stroke-sm mb-2 flex items-center gap-1.5">
            <PackageOpen className="w-4 h-4" /> Striker &amp; Equipment Chests
          </h2>
          <div className="space-y-2.5">
            {chests.map((c) => (
              <div
                key={c.tier}
                className="rounded-2xl p-3 border-2 border-yellow-300/45 flex items-center justify-between gap-3 shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${c.gradient[0]} 0%, ${c.gradient[1]} 100%)`,
                }}
              >
                <div>
                  <span className="px-2 py-0.5 rounded bg-black/35 text-[9px] font-black text-yellow-300">
                    {c.badge}
                  </span>
                  <div className="text-base font-extrabold text-white text-stroke-sm mt-0.5">
                    {c.name}
                  </div>
                  <p className="text-[11px] text-white/85">{c.desc}</p>
                </div>

                <button
                  onClick={() => buyShopChest(c.tier, c.gems)}
                  className="btn-gold px-3.5 py-2 rounded-xl text-sm font-black text-amber-950 flex items-center gap-1 shrink-0"
                >
                  <GemIcon size={18} /> {c.gems}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Coin Packs Section */}
        <div>
          <h2 className="text-sm font-extrabold text-yellow-300 text-stroke-sm mb-2 flex items-center gap-1.5">
            <CoinIcon size={16} /> Coin Packs
          </h2>
          <div className="grid grid-cols-2 gap-2.5 pb-2">
            {coinPacks.map((p) => (
              <div
                key={p.coins}
                className="wood-panel rounded-2xl p-3 flex flex-col items-center text-center justify-between gap-2"
              >
                <span className="text-[11px] font-bold text-amber-200">{p.label}</span>
                <CoinStackIcon size={54} />
                <div className="text-base font-black text-yellow-300 text-stroke-sm">
                  {formatNumberSpaced(p.coins)}
                </div>
                <button
                  onClick={() => buyCoinPack(p.coins, p.gems)}
                  className="btn-blue w-full py-1.5 rounded-xl text-xs font-extrabold text-white flex items-center justify-center gap-1"
                >
                  <GemIcon size={15} /> {p.gems} Gems
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
