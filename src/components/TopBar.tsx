import React from 'react';
import { Settings, Mail, Plus } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { formatNumberSpaced } from '../services/storage';
import { AvatarArt } from './AvatarArt';
import { CoinIcon, GemIcon } from './StrikerArt';
import { sound } from '../engine/sound';

interface TopBarProps {
  title?: string;
  compactCurrencyOnly?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ title, compactCurrencyOnly = false }) => {
  const { account, setActiveModal, goToTab } = useGame();
  const unreadMail = account.inbox.filter((m) => !m.read).length;

  return (
    <header className="wood-bar relative z-20 flex items-center justify-between px-2.5 py-2 shrink-0">
      {/* Left Side: Either Screen Title OR Avatar+Settings+Mail */}
      {compactCurrencyOnly ? (
        <div />
      ) : title ? (
        <h1 className="text-[22px] font-bold tracking-wide text-white text-stroke-md pl-1">
          {title}
        </h1>
      ) : (
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('profile');
            }}
            className="active:scale-95 transition-transform"
            aria-label="Open Profile"
          >
            <AvatarArt avatarId={account.avatarId} size={42} level={account.level} />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('settings');
            }}
            className="w-9 h-9 rounded-full flex items-center justify-center bg-[#7b4a26] border-2 border-[#c99562] shadow-inner active:scale-95"
            aria-label="Settings"
          >
            <Settings className="w-5 h-5 text-[#f7dec0]" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setActiveModal('mail');
            }}
            className="relative w-9 h-9 rounded-full flex items-center justify-center bg-[#7b4a26] border-2 border-[#c99562] shadow-inner active:scale-95"
            aria-label="Inbox"
          >
            <Mail className="w-5 h-5 text-[#f7dec0]" />
            {unreadMail > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 border border-white text-[10px] font-bold flex items-center justify-center">
                {unreadMail}
              </span>
            )}
          </button>
        </div>
      )}

      {/* Right Side: Gems & Coins recessed wooden counters + glossy green + */}
      <div className="flex items-center gap-2">
        {/* Gems */}
        <button
          onClick={() => goToTab('shop')}
          className="wood-recessed flex items-center h-8 rounded-full pl-1 pr-1 gap-1.5 border border-[#a97444] active:scale-95 transition-transform"
        >
          <GemIcon size={24} className="-ml-1" />
          <span className="text-sm font-bold text-white min-w-[34px] text-center tracking-tight">
            {formatNumberSpaced(account.gems)}
          </span>
          <span className="w-6 h-6 rounded-full btn-green flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white stroke-[3.5]" />
          </span>
        </button>

        {/* Coins */}
        <button
          onClick={() => goToTab('shop')}
          className="wood-recessed flex items-center h-8 rounded-full pl-1 pr-1 gap-1.5 border border-[#a97444] active:scale-95 transition-transform"
        >
          <CoinIcon size={24} className="-ml-1" />
          <span className="text-sm font-bold text-white min-w-[48px] text-center tracking-tight">
            {formatNumberSpaced(account.coins)}
          </span>
          <span className="w-6 h-6 rounded-full btn-green flex items-center justify-center">
            <Plus className="w-3.5 h-3.5 text-white stroke-[3.5]" />
          </span>
        </button>
      </div>
    </header>
  );
};
