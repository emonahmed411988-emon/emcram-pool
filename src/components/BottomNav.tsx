import React from 'react';
import { Home, Users, Disc, Trophy, ShoppingCart } from 'lucide-react';
import { useGame } from '../context/GameContext';
import { NavTab } from '../types/game';
import { ACTIVE_EVENTS } from '../data/events';

export const BottomNav: React.FC = () => {
  const { activeTab, goToTab, account } = useGame();

  const claimableEventsCount = ACTIVE_EVENTS.filter((ev) => {
    const p = account.eventProgress[ev.id];
    return !p?.claimed;
  }).length;

  const tabs: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; goldHighlight?: boolean }[] = [
    { id: 'home', label: 'Home', icon: <Home className="w-6 h-6" /> },
    { id: 'friends', label: 'Friends', icon: <Users className="w-6 h-6" /> },
    { id: 'equipment', label: 'Equipment', icon: <Disc className="w-6 h-6" /> },
    {
      id: 'events',
      label: 'Events',
      icon: <Trophy className="w-6 h-6" />,
      badge: claimableEventsCount > 0 ? claimableEventsCount : undefined,
      goldHighlight: true,
    },
    { id: 'shop', label: 'Shop', icon: <ShoppingCart className="w-6 h-6" /> },
  ];

  return (
    <nav className="wood-bar relative z-20 grid grid-cols-5 h-[66px] shrink-0 border-t-2 border-[#c89660]">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const isEventsGold = tab.goldHighlight && tab.badge && tab.badge > 0;
        return (
          <button
            key={tab.id}
            onClick={() => goToTab(tab.id)}
            className="relative flex flex-col items-center justify-center gap-0.5 transition-all border-r border-[#4f2811]/60 last:border-r-0"
            style={{
              background: isEventsGold
                ? 'linear-gradient(180deg, #ffe24a 0%, #f5b400 60%, #d48900 100%)'
                : isActive
                  ? 'linear-gradient(180deg, #c99768 0%, #9b673c 100%)'
                  : 'linear-gradient(180deg, #754523 0%, #562f14 100%)',
              boxShadow: isActive
                ? 'inset 0 2px 0 rgba(255,240,210,0.55)'
                : 'inset 0 2px 4px rgba(0,0,0,0.28)',
            }}
          >
            <div
              className={`relative transition-transform ${isActive ? 'scale-110 -translate-y-0.5' : ''}`}
              style={{
                color: isEventsGold ? '#6b3400' : isActive ? '#ffe6c7' : '#d2a276',
                filter: 'drop-shadow(0 2px 1px rgba(0,0,0,0.45))',
              }}
            >
              {tab.icon}
              {tab.badge && (
                <span className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 border-2 border-white text-white text-[10px] font-bold flex items-center justify-center shadow">
                  {tab.badge}
                </span>
              )}
            </div>
            <span
              className={`text-[11px] font-bold leading-none ${
                isEventsGold ? 'text-[#3b1c00]' : isActive ? 'text-white text-stroke-sm' : 'text-[#e3c3a3]'
              }`}
            >
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
