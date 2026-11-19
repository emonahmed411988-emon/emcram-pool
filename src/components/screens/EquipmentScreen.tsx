import React, { useMemo, useState } from 'react';
import { Info, SlidersHorizontal, Zap, Check, Lock, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { BottomNav } from '../BottomNav';
import { COSMETICS, getStrikerStats, POWERS, RARITY_ORDER, STRIKERS } from '../../data/equipment';
import { EquipmentCategory, StrikerDef } from '../../types/game';
import { CoinIcon, GemIcon, StrikerArt } from '../StrikerArt';
import { formatNumberSpaced } from '../../services/storage';
import { sound } from '../../engine/sound';

type SortMode = 'rarity' | 'owned' | 'force';

export const EquipmentScreen: React.FC = () => {
  const { account, equipStriker, upgradeStriker, equipCosmetic, buyCosmetic } = useGame();
  const [category, setCategory] = useState<EquipmentCategory>('strikers');
  const [sortMode, setSortMode] = useState<SortMode>('rarity');
  const [selectedStriker, setSelectedStriker] = useState<StrikerDef | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  const sortedStrikers = useMemo(() => {
    const list = [...STRIKERS];
    if (sortMode === 'owned') {
      list.sort((a, b) => {
        const oa = account.strikers[a.id]?.unlocked ? 1 : 0;
        const ob = account.strikers[b.id]?.unlocked ? 1 : 0;
        return ob - oa || RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
      });
    } else if (sortMode === 'force') {
      list.sort((a, b) => b.baseForce - a.baseForce);
    } else {
      // Exact screenshot order: Equipped Blaze first, then Mythics (Astro, Pulse, Aura), Legendaries (Trace, Toran), etc.
      list.sort((a, b) => {
        if (a.id === account.equippedStriker) return -1;
        if (b.id === account.equippedStriker) return 1;
        return RARITY_ORDER[b.rarity] - RARITY_ORDER[a.rarity];
      });
    }
    return list;
  }, [account.equippedStriker, account.strikers, sortMode]);

  const cpInLevel = account.collectionPower % 20;
  const nextColLevel = account.collectionLevel + 1;

  const tabs: { id: EquipmentCategory; label: string }[] = [
    { id: 'strikers', label: 'Strikers' },
    { id: 'powers', label: 'Powers' },
    { id: 'pucks', label: 'Pucks' },
    { id: 'trails', label: 'Trails' },
    { id: 'pockets', label: 'Pockets' },
  ];

  const cycleSort = () => {
    sound.playClick();
    setSortMode((m) => (m === 'rarity' ? 'owned' : m === 'owned' ? 'force' : 'rarity'));
  };

  const renderStatPips = (label: string, val: number) => (
    <div className="flex items-center justify-between gap-1 text-[9px] font-bold text-amber-100">
      <span className="w-8 text-left">{label}</span>
      <div className="flex gap-[1.5px]">
        {Array.from({ length: 10 }).map((_, i) => (
          <span
            key={i}
            className={`w-[4px] h-[8px] rounded-[1px] ${
              i < val ? 'bg-lime-400 shadow-[0_0_4px_#84cc16]' : 'bg-[#2c1509]'
            }`}
          />
        ))}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full w-full bg-[#4a220e] relative overflow-hidden">
      <TopBar title="Equipment" />

      {/* Collection Power Banner (Exact match to Screenshot 11!) */}
      <div className="px-2 pt-2 pb-1.5 bg-[#361608]">
        <div className="rounded-xl border-2 border-[#d49642] bg-gradient-to-b from-[#4f260c] to-[#2e1305] px-3 py-2 flex items-center justify-between shadow-lg">
          <div className="flex-1 pr-2">
            <div className="text-[15px] font-extrabold text-[#facc15] leading-tight text-stroke-sm">
              Collection Power
            </div>
            <div className="text-[11px] font-semibold text-amber-100/90 mt-0.5">
              Upgrade to unlock powers!
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <div className="w-7 h-7 rounded-full bg-gradient-to-b from-yellow-300 to-orange-500 border-2 border-amber-900 flex items-center justify-center z-10 shadow">
                <Zap className="w-4 h-4 text-amber-950 fill-amber-950" />
              </div>
              <div className="w-24 h-4 -ml-2 bg-[#1c0c04] rounded-r-full border border-[#8a5628] overflow-hidden relative flex items-center justify-center">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-amber-400 to-yellow-300 transition-all"
                  style={{ width: `${Math.min(100, (cpInLevel / 20) * 100)}%` }}
                />
                <span className="relative z-10 text-[10px] font-extrabold text-white text-stroke-sm">
                  {cpInLevel}/20
                </span>
              </div>
            </div>

            {/* Teal Crest Level Emblem */}
            <div className="w-9 h-9 rounded-full bg-gradient-to-b from-teal-300 to-teal-700 border-2 border-cyan-100 flex items-center justify-center shadow-md">
              <span className="text-sm font-black text-white text-stroke-sm">{nextColLevel}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 5 Sub-Tabs Strip + Blue Info Button */}
      <div className="flex items-end gap-1 px-2 pt-1 bg-[#361608] border-b-2 border-[#75401d]">
        {tabs.map((t) => {
          const active = category === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                sound.playClick();
                setCategory(t.id);
              }}
              className={`flex-1 py-1.5 rounded-t-lg text-[11px] font-extrabold transition-colors border-t border-x ${
                active
                  ? 'bg-[#8f5329] text-white border-[#d6985e] -mb-[2px] pb-2'
                  : 'bg-[#5c2c13] text-amber-200/80 border-[#421e0b]'
              }`}
            >
              {t.label}
            </button>
          );
        })}
        <button
          onClick={() => setShowInfo(true)}
          className="w-7 h-7 mb-1 rounded-md btn-blue flex items-center justify-center shrink-0"
          aria-label="Equipment info"
        >
          <Info className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Main Equipment Body */}
      <div className="flex-1 overflow-y-auto game-scroll px-2.5 py-2 bg-gradient-to-b from-[#663316] to-[#3f1b09]">
        {category === 'strikers' && (
          <>
            {/* Sort Bar */}
            <div className="wood-recessed rounded-lg px-3 py-1.5 mb-2.5 flex items-center justify-between border border-[#8f542a]">
              <span className="text-xs font-bold text-amber-100">
                Sort Strikers by{' '}
                {sortMode === 'rarity' ? 'Rarity' : sortMode === 'owned' ? 'Owned' : 'Force'}
              </span>
              <button
                onClick={cycleSort}
                className="btn-orange w-8 h-7 rounded-md flex items-center justify-center"
                title="Change sort"
              >
                <SlidersHorizontal className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* 3-Column Striker Cards Grid (Exact match to Screenshot 11!) */}
            <div className="grid grid-cols-3 gap-2 pb-3">
              {sortedStrikers.map((s) => {
                const ownedState = account.strikers[s.id] || { unlocked: false, level: 1, cards: 0 };
                const isUsing = account.equippedStriker === s.id;
                const stats = getStrikerStats(s.id, ownedState.level, account.collectionLevel);
                const needed = ownedState.unlocked ? s.cardsPerLevel : s.cardsToUnlock;
                const pct = needed > 0 ? Math.min(100, (ownedState.cards / needed) * 100) : 0;

                const rarityColor =
                  s.rarity === 'MYTHIC'
                    ? 'text-yellow-300'
                    : s.rarity === 'LEGENDARY'
                      ? 'text-sky-200'
                      : s.rarity === 'EPIC'
                        ? 'text-pink-200'
                        : s.rarity === 'RARE'
                          ? 'text-emerald-200'
                          : 'text-amber-100';

                return (
                  <button
                    key={s.id}
                    onClick={() => {
                      sound.playClick();
                      setSelectedStriker(s);
                    }}
                    className="relative rounded-xl p-1.5 flex flex-col items-center justify-between text-center min-h-[192px] active:scale-[0.97] transition-transform"
                    style={{
                      background: `linear-gradient(180deg, ${s.bgGradient[0]} 0%, ${s.bgGradient[1]} 100%)`,
                      border: isUsing ? '2.5px solid #4ade80' : '1.5px solid rgba(255,255,255,0.22)',
                      boxShadow: isUsing
                        ? '0 0 12px rgba(74,222,128,0.65)'
                        : '0 4px 10px rgba(0,0,0,0.5)',
                    }}
                  >
                    {isUsing && (
                      <span className="absolute -top-2 right-1 px-1.5 py-0.5 rounded bg-green-500 text-[8px] font-black text-white shadow">
                        USING
                      </span>
                    )}

                    <div className="mt-0.5">
                      <div className="text-[13px] font-extrabold text-white leading-tight text-stroke-sm">
                        {s.name}
                      </div>
                      <div className={`text-[9px] font-extrabold tracking-wider ${rarityColor}`}>
                        {s.rarity}
                      </div>
                    </div>

                    {/* Radiant burst behind striker */}
                    <div className="relative my-1 flex items-center justify-center">
                      {!ownedState.unlocked && (
                        <div className="absolute w-16 h-16 rounded-full bg-yellow-300/35 blur-md" />
                      )}
                      <StrikerArt strikerId={s.id} size={58} />
                    </div>

                    {ownedState.unlocked ? (
                      <div className="w-full space-y-0.5 px-0.5">
                        {renderStatPips('Force', stats.force)}
                        {renderStatPips('Aim', stats.aim)}
                        {renderStatPips('Time', stats.time)}
                        <div className="flex items-center gap-1 pt-1">
                          <span className="w-4 h-4 rounded-full bg-yellow-400 border border-amber-900 text-[9px] font-black text-amber-950 flex items-center justify-center shrink-0">
                            {ownedState.level}
                          </span>
                          <div className="flex-1 h-3.5 rounded-full bg-black/55 overflow-hidden relative flex items-center justify-center">
                            <div
                              className="absolute left-0 top-0 bottom-0 bg-lime-500"
                              style={{ width: `${pct}%` }}
                            />
                            <span className="relative text-[9px] font-bold text-white">
                              {ownedState.cards}/{needed}
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full space-y-1">
                        <div className="text-[10px] font-bold text-white leading-tight">
                          Find it in chests!
                        </div>
                        <div className="text-[9px] font-semibold text-amber-200/80">
                          {s.sourceLabel}
                        </div>
                        <div className="h-3.5 rounded-full bg-black/55 overflow-hidden relative flex items-center justify-center">
                          <div
                            className="absolute left-0 top-0 bottom-0 bg-amber-400"
                            style={{ width: `${pct}%` }}
                          />
                          <span className="relative text-[9px] font-bold text-white">
                            {ownedState.cards}/{needed}
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </>
        )}

        {category === 'powers' && (
          <div className="space-y-2 pb-3">
            {POWERS.map((p) => {
              const unlocked = account.collectionLevel >= p.unlockLevel;
              return (
                <div
                  key={p.id}
                  className={`rounded-xl p-3 border flex items-center gap-3 ${
                    unlocked
                      ? 'bg-gradient-to-r from-emerald-900/80 to-emerald-800/60 border-lime-400'
                      : 'bg-black/35 border-amber-900/70 opacity-85'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-black/40 border border-yellow-400/50 flex items-center justify-center text-2xl shrink-0">
                    {p.icon}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-extrabold text-white">{p.name}</span>
                      {unlocked ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-lime-500 text-black font-black">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-950 text-amber-300 font-bold flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5" /> Power Lv.{p.unlockLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-amber-100/85 mt-0.5">{p.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {(category === 'pucks' || category === 'trails' || category === 'pockets') && (
          <div className="grid grid-cols-2 gap-2.5 pb-3">
            {COSMETICS.filter((c) => c.category === category).map((item) => {
              const owned = account.unlockedCosmetics.includes(item.id);
              const equipped =
                (category === 'pucks' && account.equippedPuck === item.id) ||
                (category === 'trails' && account.equippedTrail === item.id) ||
                (category === 'pockets' && account.equippedPocket === item.id);

              return (
                <div
                  key={item.id}
                  className={`rounded-xl p-3 flex flex-col justify-between border-2 ${
                    equipped
                      ? 'bg-[#7d421d] border-lime-400'
                      : 'bg-[#4f240e] border-[#96572b]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-white">{item.name}</span>
                      <span className="text-[9px] font-bold text-yellow-300">{item.rarity}</span>
                    </div>

                    {/* Preview Swatches */}
                    <div className="flex items-center justify-center gap-2 my-3">
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white/60 shadow-md"
                        style={{ background: item.primaryColor }}
                      />
                      <div
                        className="w-9 h-9 rounded-full border-2 border-white/60 shadow-md"
                        style={{ background: item.secondaryColor }}
                      />
                      <div
                        className="w-7 h-7 rounded-full border-2 border-white/60 shadow-md"
                        style={{ background: item.accentColor }}
                      />
                    </div>

                    <p className="text-[10px] text-amber-100/80 text-center mb-3 leading-snug">
                      {item.description}
                    </p>
                  </div>

                  {owned ? (
                    <button
                      onClick={() => equipCosmetic(item.id, category)}
                      className={`w-full py-1.5 rounded-lg text-xs font-extrabold flex items-center justify-center gap-1 ${
                        equipped ? 'bg-green-700/60 text-lime-200' : 'btn-green text-white'
                      }`}
                    >
                      {equipped ? (
                        <>
                          <Check className="w-3.5 h-3.5" /> Equipped
                        </>
                      ) : (
                        'Use'
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => buyCosmetic(item.id)}
                      className="btn-gold w-full py-1.5 rounded-lg text-xs font-extrabold text-amber-950 flex items-center justify-center gap-1"
                    >
                      {item.costCoins ? (
                        <>
                          <CoinIcon size={15} /> {formatNumberSpaced(item.costCoins)}
                        </>
                      ) : (
                        <>
                          <GemIcon size={15} /> {item.costGems}
                        </>
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Striker Inspect / Equip / Upgrade Modal */}
      {selectedStriker && (() => {
        const st = account.strikers[selectedStriker.id] || { unlocked: false, level: 1, cards: 0 };
        const stats = getStrikerStats(selectedStriker.id, st.level, account.collectionLevel);
        const needed = st.unlocked ? selectedStriker.cardsPerLevel : selectedStriker.cardsToUnlock;
        const cost = st.unlocked ? selectedStriker.upgradeCostBase * st.level : 0;
        const isUsing = account.equippedStriker === selectedStriker.id;

        return (
          <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-5">
            <div className="wood-panel rounded-2xl p-4 w-full max-w-xs relative animate-pop">
              <button
                onClick={() => setSelectedStriker(null)}
                className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white stroke-[3]" />
              </button>

              <div className="flex flex-col items-center">
                <span className="text-[10px] font-black tracking-widest text-yellow-300">
                  {selectedStriker.rarity}
                </span>
                <h3 className="text-xl font-black text-white text-stroke-sm">{selectedStriker.name}</h3>
                <div className="my-3">
                  <StrikerArt strikerId={selectedStriker.id} size={90} />
                </div>

                <div className="w-full bg-black/35 rounded-xl p-3 space-y-1.5 mb-3">
                  {renderStatPips('Force', stats.force)}
                  {renderStatPips('Aim', stats.aim)}
                  {renderStatPips('Time', stats.time)}
                  <div className="text-[11px] text-amber-200 pt-1 text-center font-bold">
                    Level {st.level} • Cards: {st.cards}/{needed}
                  </div>
                </div>

                <div className="flex gap-2 w-full">
                  {st.unlocked && (
                    <button
                      onClick={() => {
                        equipStriker(selectedStriker.id);
                        setSelectedStriker(null);
                      }}
                      disabled={isUsing}
                      className={`flex-1 py-2 rounded-xl text-sm font-extrabold ${
                        isUsing ? 'bg-green-900/60 text-green-300' : 'btn-green text-white text-stroke-sm'
                      }`}
                    >
                      {isUsing ? 'Equipped' : 'Equip'}
                    </button>
                  )}

                  <button
                    onClick={() => upgradeStriker(selectedStriker.id)}
                    className="btn-gold flex-1 py-2 rounded-xl text-xs font-extrabold text-amber-950 flex items-center justify-center gap-1"
                  >
                    {st.unlocked ? (
                      <>
                        Upgrade <CoinIcon size={14} /> {formatNumberSpaced(cost)}
                      </>
                    ) : (
                      `Unlock (${st.cards}/${needed})`
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {showInfo && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-5">
          <div className="wood-panel rounded-2xl p-4 w-full max-w-xs relative animate-pop">
            <button
              onClick={() => setShowInfo(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white stroke-[3]" />
            </button>
            <h3 className="text-base font-extrabold text-yellow-300 mb-2">Equipment Stats</h3>
            <p className="text-xs text-amber-100 leading-relaxed">
              • <b>Force</b>: Increases maximum striker shot velocity.<br />
              • <b>Aim</b>: Extends the white dotted aim trajectory guide line.<br />
              • <b>Time</b>: Gives extra seconds on your turn timer.<br />
              • Open Victory Chests & Shop Chests to collect Mythic & Legendary striker cards and boost Collection Power!
            </p>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
