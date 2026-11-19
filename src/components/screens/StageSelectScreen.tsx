import React, { useState } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Info, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getArenasByMode } from '../../data/arenas';
import { TopBar } from '../TopBar';
import { ArenaLandmarkArt, MiniBoardIcon } from '../MiniBoardIcon';
import { CoinIcon, CoinStackIcon } from '../StrikerArt';
import { AvatarArt } from '../AvatarArt';
import { BOT_PROFILES } from '../../data/avatars';
import { formatNumberSpaced } from '../../services/storage';
import { sound } from '../../engine/sound';

export const StageSelectScreen: React.FC = () => {
  const { account, selectedMode, setScreen, startArenaMatch } = useGame();
  const arenas = getArenasByMode(selectedMode);
  const [index, setIndex] = useState(0);
  const [showRules, setShowRules] = useState(false);
  const [matchingArena, setMatchingArena] = useState<(typeof arenas)[number] | null>(null);
  const [matchedBot, setMatchedBot] = useState(BOT_PROFILES[0]);

  const current = arenas[index] || arenas[0];
  const prevArena = arenas[(index - 1 + arenas.length) % arenas.length];
  const nextArena = arenas[(index + 1) % arenas.length];

  const modeTitle =
    selectedMode === 'disc-pool'
      ? 'Disc Pool'
      : selectedMode === 'carrom'
        ? 'Carrom'
        : 'Freestyle';

  const handlePlayArena = () => {
    if (account.coins < current.entryFee) {
      startArenaMatch(current); // triggers toast
      return;
    }
    sound.playClick();
    const bot = BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
    setMatchedBot(bot);
    setMatchingArena(current);
    setTimeout(() => {
      startArenaMatch(current);
      setMatchingArena(null);
    }, 1150);
  };

  return (
    <div className="flex flex-col h-full w-full btn-crimson-bg relative overflow-hidden">
      <TopBar />

      {/* Sub-header mode strip (Exact match to Screenshots 10 & 14!) */}
      <div className="relative z-10 flex items-center justify-center gap-3 py-2.5 bg-black/25 border-b border-white/10">
        <div className="absolute left-4 -top-1">
          <MiniBoardIcon mode={selectedMode} size={64} />
        </div>
        <h2 className="text-[22px] font-extrabold text-amber-100 text-stroke-md tracking-wide">
          {modeTitle}
        </h2>
      </div>

      {/* Carousel Area */}
      <div className="flex-1 relative flex items-center justify-center px-3 overflow-hidden">
        {/* Left peeking card hint */}
        {arenas.length > 1 && (
          <div
            onClick={() => {
              sound.playClick();
              setIndex((i) => (i - 1 + arenas.length) % arenas.length);
            }}
            className="hidden sm:block absolute -left-24 w-32 h-[340px] rounded-2xl opacity-55 cursor-pointer border-2 border-amber-400/50"
            style={{
              background: `linear-gradient(180deg, ${prevArena.cardGradient[0]}, ${prevArena.cardGradient[1]})`,
            }}
          />
        )}

        {/* Right peeking card hint */}
        {arenas.length > 1 && (
          <div
            onClick={() => {
              sound.playClick();
              setIndex((i) => (i + 1) % arenas.length);
            }}
            className="absolute -right-28 w-32 h-[360px] rounded-2xl opacity-75 cursor-pointer border-2 border-amber-400/60"
            style={{
              background: `linear-gradient(180deg, ${nextArena.cardGradient[0]}, ${nextArena.cardGradient[1]})`,
            }}
          />
        )}

        {/* Left Arrow */}
        {arenas.length > 1 && (
          <button
            onClick={() => {
              sound.playClick();
              setIndex((i) => (i - 1 + arenas.length) % arenas.length);
            }}
            className="absolute left-1.5 z-20 w-9 h-12 flex items-center justify-center text-yellow-400 hover:scale-110 active:scale-95 drop-shadow-lg"
            aria-label="Previous stage"
          >
            <ChevronLeft className="w-10 h-10 stroke-[3.5] fill-yellow-400/20" />
          </button>
        )}

        {/* Active Stage Card (Exact Match to Paris Stage [Img 10] & Delhi Lounge [Img 14]!) */}
        <div
          onClick={handlePlayArena}
          className="relative z-10 w-[82%] max-w-[310px] rounded-2xl p-[3px] cursor-pointer active:scale-[0.98] transition-transform animate-pop"
          style={{
            background: 'linear-gradient(180deg, #fde047 0%, #b45309 100%)',
            boxShadow: '0 14px 32px rgba(0,0,0,0.75)',
          }}
        >
          <div
            className="rounded-[14px] px-4 pt-12 pb-4 flex flex-col items-center relative"
            style={{
              background: `linear-gradient(180deg, ${current.cardGradient[0]} 0%, ${current.cardGradient[1]} 100%)`,
              boxShadow: 'inset 0 2px 8px rgba(255,255,255,0.28)',
            }}
          >
            {/* Landmark illustration floating above badge */}
            <div className="-mt-24 mb-1 flex flex-col items-center">
              <ArenaLandmarkArt landmark={current.landmark} />
              {/* City Shield Badge */}
              <div
                className="-mt-4 px-7 py-1.5 rounded-xl border-[3px] border-[#facc15] shadow-xl text-center"
                style={{
                  background: `linear-gradient(180deg, ${current.badgeGradient[0]}, ${current.badgeGradient[1]})`,
                }}
              >
                <div className="text-[28px] font-black tracking-wide leading-none text-white text-stroke-md">
                  {current.city}
                </div>
                <div
                  className={`text-[18px] leading-none mt-0.5 font-extrabold ${
                    current.subtitle === 'LOUNGE'
                      ? 'text-[#bef264] tracking-wider'
                      : 'font-script text-[#ef4444]'
                  }`}
                  style={{
                    textShadow: '0 1.5px 0 #fff, 1.5px 0 0 #fff, -1.5px 0 0 #fff, 0 3px 4px rgba(0,0,0,0.7)',
                  }}
                >
                  {current.subtitle}
                </div>
              </div>
            </div>

            {/* Rewards Ribbon */}
            <div className="w-full mt-4 relative flex justify-center">
              <div
                className="px-8 py-1 rounded-md border border-yellow-200/70 shadow-md z-10 text-sm font-extrabold text-white text-stroke-sm"
                style={{
                  background: `linear-gradient(180deg, ${current.cardGradient[0]}, ${current.cardGradient[1]})`,
                }}
              >
                Rewards
              </div>
            </div>

            {/* Rewards Box */}
            <div className="w-full -mt-2.5 pt-5 pb-3 rounded-xl bg-black/30 border border-white/15 flex flex-col items-center justify-center shadow-inner">
              <CoinStackIcon size={64} />
              <span className="text-[20px] font-extrabold text-white text-stroke-sm mt-1">
                {formatNumberSpaced(current.reward)}
              </span>
            </div>

            {/* Entry Fee Box */}
            <div className="w-full mt-3 py-2.5 px-3 rounded-xl bg-black/30 border border-white/15 flex items-center justify-center gap-2 shadow-inner">
              <span className="text-[16px] font-bold text-white text-stroke-sm">
                Entry fee: {formatNumberSpaced(current.entryFee)}
              </span>
              <CoinIcon size={22} />
            </div>

            {/* Rules Row + Blue Info Button */}
            <div className="w-full mt-3 flex items-center justify-between px-1">
              <span className="text-[13px] font-bold text-amber-100">
                Rules: <span className="text-yellow-300">{current.rulesLabel}</span>
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sound.playClick();
                  setShowRules(true);
                }}
                className="w-7 h-7 rounded-md btn-blue flex items-center justify-center"
                aria-label="Arena rules"
              >
                <Info className="w-4 h-4 text-white" />
              </button>
            </div>

            <div className="mt-3 w-full">
              <div className="btn-green w-full py-2 rounded-xl text-center text-[16px] font-extrabold text-white text-stroke-sm">
                Tap to Play
              </div>
            </div>
          </div>
        </div>

        {/* Right Arrow */}
        {arenas.length > 1 && (
          <button
            onClick={() => {
              sound.playClick();
              setIndex((i) => (i + 1) % arenas.length);
            }}
            className="absolute right-1.5 z-20 w-9 h-12 flex items-center justify-center text-yellow-400 hover:scale-110 active:scale-95 drop-shadow-lg"
            aria-label="Next stage"
          >
            <ChevronRight className="w-10 h-10 stroke-[3.5] fill-yellow-400/20" />
          </button>
        )}
      </div>

      {/* Pagination Dots + Bottom Back Button */}
      <div className="relative z-10 flex items-center justify-between px-3 pb-4 pt-1">
        <button
          onClick={() => {
            sound.playClick();
            setScreen('home');
          }}
          className="btn-orange w-12 h-11 rounded-xl flex items-center justify-center"
          aria-label="Back to home"
        >
          <ArrowLeft className="w-6 h-6 text-white stroke-[3]" />
        </button>

        <div className="flex items-center gap-1.5">
          {arenas.map((a, i) => (
            <button
              key={a.id}
              onClick={() => setIndex(i)}
              className={`h-2.5 rounded-full transition-all ${
                i === index ? 'w-6 bg-yellow-400' : 'w-2.5 bg-white/35'
              }`}
            />
          ))}
        </div>

        <div className="w-12" />
      </div>

      {/* Rules Modal */}
      {showRules && (
        <div className="absolute inset-0 z-40 bg-black/70 flex items-center justify-center p-5">
          <div className="wood-panel rounded-2xl p-4 w-full max-w-xs relative animate-pop">
            <button
              onClick={() => setShowRules(false)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow"
            >
              <X className="w-4 h-4 text-white stroke-[3]" />
            </button>
            <h3 className="text-lg font-extrabold text-yellow-300 text-stroke-sm text-center mb-2">
              {current.city} {current.subtitle} Rules
            </h3>
            <ul className="text-xs text-amber-100 space-y-2 bg-black/30 rounded-xl p-3">
              {current.mode === 'disc-pool' && (
                <>
                  <li>• Each player must pot all {current.piecesPerPlayer} of their own colored pucks first.</li>
                  <li>• Potting your puck grants a bonus turn!</li>
                  <li>• Potting the Striker is a Foul and returns 1 potted puck to the center.</li>
                </>
              )}
              {current.mode === 'carrom' && (
                <>
                  <li>• Pot all {current.piecesPerPlayer} of your pucks AND cover the Red Queen to win.</li>
                  <li>• After potting the Red Queen, you must pot one of your own pucks on the same or very next shot to cover it!</li>
                  <li>• Failing to cover returns the Queen to the center.</li>
                </>
              )}
              {current.mode === 'freestyle' && (
                <>
                  <li>• Pot ANY puck to score points: White = 20 pts, Black = 10 pts, Red Queen = 50 pts (when covered).</li>
                  <li>• First player to reach {current.targetPoints} points wins the pot!</li>
                  <li>• Striker foul deducts 10 points.</li>
                </>
              )}
            </ul>
          </div>
        </div>
      )}

      {/* Matchmaking VS Overlay */}
      {matchingArena && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 animate-pop">
          <div className="text-yellow-300 text-sm font-bold uppercase tracking-widest mb-1">
            {matchingArena.city} {matchingArena.subtitle}
          </div>
          <div className="flex items-center gap-1.5 mb-6">
            <CoinStackIcon size={40} />
            <span className="text-2xl font-black text-white text-stroke-md">
              {formatNumberSpaced(matchingArena.reward)}
            </span>
          </div>

          <div className="flex items-center justify-center gap-6 w-full">
            <div className="flex flex-col items-center gap-2">
              <AvatarArt avatarId={account.avatarId} size={74} level={account.level} />
              <span className="text-sm font-bold text-white max-w-[100px] truncate">
                {account.username}
              </span>
            </div>

            <div className="text-3xl font-black text-yellow-400 text-stroke-md italic">VS</div>

            <div className="flex flex-col items-center gap-2">
              <AvatarArt avatarId={matchedBot.avatarId} size={74} level={matchedBot.level} />
              <span className="text-sm font-bold text-white max-w-[100px] truncate">
                {matchedBot.username}
              </span>
            </div>
          </div>

          <div className="mt-7 text-xs font-bold text-amber-200 animate-pulse">
            Setting up Carrom Board...
          </div>
        </div>
      )}
    </div>
  );
};
