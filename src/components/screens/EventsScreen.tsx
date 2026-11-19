import React from 'react';
import { Trophy, CheckCircle2, Sparkles } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { BottomNav } from '../BottomNav';
import { ACTIVE_EVENTS } from '../../data/events';
import { CoinIcon, GemIcon } from '../StrikerArt';
import { formatNumberSpaced } from '../../services/storage';

export const EventsScreen: React.FC = () => {
  const { account, claimEventReward, openModeStages } = useGame();

  return (
    <div className="flex flex-col h-full w-full btn-crimson-bg relative overflow-hidden">
      <TopBar title="Events" />

      <div className="flex-1 overflow-y-auto game-scroll p-3 space-y-3">
        {/* Hero Banner */}
        <div className="rounded-2xl p-3.5 border-2 border-yellow-400 bg-gradient-to-r from-amber-600 via-orange-600 to-rose-700 shadow-lg flex items-center justify-between">
          <div>
            <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/35 text-[10px] font-black text-yellow-300 mb-1">
              <Sparkles className="w-3 h-3" /> SEASON CHALLENGES
            </div>
            <h2 className="text-lg font-black text-white text-stroke-sm leading-tight">
              Win Chests &amp; Mythic Cards!
            </h2>
            <p className="text-[11px] text-amber-100 mt-0.5">
              Complete live goals below to unlock Astro, Pulse &amp; Aura strikers.
            </p>
          </div>
          <Trophy className="w-12 h-12 text-yellow-300 shrink-0 drop-shadow-lg" />
        </div>

        {/* Event Challenge Cards */}
        {ACTIVE_EVENTS.map((ev) => {
          const curVal = Math.min(ev.target, account.stats[ev.metric]);
          const pct = Math.round((curVal / ev.target) * 100);
          const claimed = account.eventProgress[ev.id]?.claimed;
          const canClaim = !claimed && curVal >= ev.target;

          return (
            <div
              key={ev.id}
              className="rounded-2xl p-3.5 border-2 border-white/20 shadow-lg space-y-2.5"
              style={{
                background: `linear-gradient(135deg, ${ev.gradient[0]} 0%, ${ev.gradient[1]} 100%)`,
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="px-2 py-0.5 rounded bg-black/40 text-[9px] font-black text-yellow-300 tracking-wider">
                    {ev.badge}
                  </span>
                  <h3 className="text-base font-extrabold text-white text-stroke-sm mt-1">
                    {ev.title}
                  </h3>
                  <p className="text-xs text-white/85">{ev.subtitle}</p>
                </div>

                <div className="bg-black/35 rounded-xl px-2.5 py-1.5 text-right shrink-0 space-y-0.5">
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-yellow-300">
                    <CoinIcon size={14} /> {formatNumberSpaced(ev.rewardCoins)}
                  </div>
                  <div className="flex items-center justify-end gap-1 text-xs font-extrabold text-sky-300">
                    <GemIcon size={14} /> +{ev.rewardGems}
                  </div>
                  {ev.rewardChest && (
                    <div className="text-[9px] font-black text-lime-300 uppercase">
                      + {ev.rewardChest} Chest
                    </div>
                  )}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="h-4 rounded-full bg-black/45 overflow-hidden relative flex items-center justify-center border border-white/15">
                <div
                  className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-lime-400 to-green-500 transition-all"
                  style={{ width: `${pct}%` }}
                />
                <span className="relative text-[10px] font-black text-white text-stroke-sm">
                  {curVal} / {ev.target}
                </span>
              </div>

              <div className="flex justify-end">
                {claimed ? (
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-black/35 text-xs font-extrabold text-lime-300">
                    <CheckCircle2 className="w-4 h-4" /> Completed
                  </span>
                ) : canClaim ? (
                  <button
                    onClick={() => claimEventReward(ev.id)}
                    className="btn-green px-4 py-1.5 rounded-xl text-xs font-extrabold text-white text-stroke-sm animate-glow"
                  >
                    Claim Reward!
                  </button>
                ) : (
                  <button
                    onClick={() => openModeStages(ev.metric === 'queensCovered' ? 'carrom' : 'disc-pool')}
                    className="btn-gold px-4 py-1.5 rounded-xl text-xs font-extrabold text-amber-950"
                  >
                    Play Now
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};
