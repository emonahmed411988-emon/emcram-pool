import React from 'react';
import { ArenaDef, GameMode } from '../types/game';

export const MiniBoardIcon: React.FC<{ mode: GameMode; size?: number }> = ({
  mode,
  size = 86,
}) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 120 96" className="drop-shadow-lg shrink-0">
    {/* Tilted 3D Carrom Board */}
    <g transform="translate(60,52) rotate(-18) skewX(18)">
      {/* Side thickness */}
      <rect x="-42" y="-30" width="84" height="68" rx="8" fill="#592c12" />
      {/* Frame top */}
      <rect x="-42" y="-36" width="84" height="68" rx="8" fill="#8b4d23" stroke="#e4a96f" strokeWidth="2.5" />
      {/* Wood playing field */}
      <rect x="-34" y="-28" width="68" height="52" rx="4" fill="#e6b888" />
      {/* Corner pockets */}
      <circle cx="-29" cy="-23" r="4" fill="#18181b" />
      <circle cx="29" cy="-23" r="4" fill="#18181b" />
      <circle cx="-29" cy="19" r="4" fill="#18181b" />
      <circle cx="29" cy="19" r="4" fill="#18181b" />
      {/* Center circle */}
      <circle cx="0" cy="-2" r="12" fill="none" stroke="#9a5c28" strokeWidth="1.5" />
      {/* Pucks */}
      <circle cx="-11" cy="2" r="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      <circle cx="2" cy="-10" r="5" fill="#18181b" stroke="#52525b" strokeWidth="1.2" />
      {mode !== 'disc-pool' && (
        <circle cx="-11" cy="13" r="5" fill="#ef4444" stroke="#fca5a5" strokeWidth="1.2" />
      )}
      {mode === 'disc-pool' && (
        <circle cx="-18" cy="-8" r="5" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.2" />
      )}
    </g>

    {/* Mode signature tokens perched on board (Exact match to Screenshots 1 & 8!) */}
    {mode === 'disc-pool' && (
      <>
        {/* Red pawn top */}
        <g transform="translate(46, 22)">
          <ellipse cx="0" cy="12" rx="12" ry="6" fill="#b91c1c" />
          <path d="M-9 10 C-9 2 -5 -2 0 -2 C5 -2 9 2 9 10 Z" fill="#ef4444" />
          <circle cx="0" cy="-5" r="7" fill="#f87171" stroke="#b91c1c" strokeWidth="1.5" />
        </g>
        {/* Green pawn bottom right */}
        <g transform="translate(76, 54)">
          <ellipse cx="0" cy="14" rx="14" ry="7" fill="#15803d" />
          <path d="M-11 12 C-11 2 -6 -3 0 -3 C6 -3 11 2 11 12 Z" fill="#22c55e" />
          <circle cx="0" cy="-7" r="8.5" fill="#4ade80" stroke="#15803d" strokeWidth="1.5" />
        </g>
      </>
    )}

    {mode === 'carrom' && (
      <>
        {/* Purple pawn top */}
        <g transform="translate(46, 22)">
          <ellipse cx="0" cy="12" rx="12" ry="6" fill="#6b21a8" />
          <path d="M-9 10 C-9 2 -5 -2 0 -2 C5 -2 9 2 9 10 Z" fill="#9333ea" />
          <circle cx="0" cy="-5" r="7" fill="#c084fc" stroke="#6b21a8" strokeWidth="1.5" />
        </g>
        {/* Gold pawn bottom right */}
        <g transform="translate(76, 54)">
          <ellipse cx="0" cy="14" rx="14" ry="7" fill="#b45309" />
          <path d="M-11 12 C-11 2 -6 -3 0 -3 C6 -3 11 2 11 12 Z" fill="#f59e0b" />
          <circle cx="0" cy="-7" r="8.5" fill="#fde047" stroke="#b45309" strokeWidth="1.5" />
        </g>
      </>
    )}

    {mode === 'freestyle' && (
      <>
        {/* Green 8 & Red 2 score tiles matching Screenshot 8! */}
        <g transform="translate(26, 22) rotate(-14)">
          <rect width="26" height="26" rx="5" fill="#16a34a" stroke="#86efac" strokeWidth="2" />
          <text x="13" y="19" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">8</text>
        </g>
        <g transform="translate(64, 14) rotate(-14)">
          <rect width="26" height="26" rx="5" fill="#dc2626" stroke="#fca5a5" strokeWidth="2" />
          <text x="13" y="19" textAnchor="middle" fill="#fff" fontSize="16" fontWeight="800">2</text>
        </g>
      </>
    )}
  </svg>
);

export const ArenaLandmarkArt: React.FC<{ landmark: ArenaDef['landmark'] }> = ({ landmark }) => {
  if (landmark === 'paris') {
    // Arc de Triomphe (exact match to Screenshot 10!)
    return (
      <svg viewBox="0 0 180 96" className="w-44 h-24 drop-shadow-md">
        <ellipse cx="90" cy="88" rx="72" ry="12" fill="#4d7c0f" />
        <rect x="26" y="14" width="128" height="12" rx="2" fill="#d6cbb8" stroke="#786b59" strokeWidth="2" />
        <rect x="22" y="8" width="136" height="8" rx="2" fill="#e7dfd1" stroke="#786b59" strokeWidth="2" />
        <rect x="30" y="26" width="120" height="62" fill="#cfc3ae" stroke="#786b59" strokeWidth="2" />
        {/* Side reliefs */}
        <rect x="38" y="34" width="22" height="16" rx="2" fill="#b8aa93" />
        <rect x="120" y="34" width="22" height="16" rx="2" fill="#b8aa93" />
        {/* Center Archway */}
        <path d="M68 88 L68 56 A22 22 0 0 1 112 56 L112 88 Z" fill="#44382c" stroke="#786b59" strokeWidth="2" />
        <path d="M74 88 L74 58 A16 16 0 0 1 106 58 L106 88 Z" fill="#2c221a" />
      </svg>
    );
  }

  if (landmark === 'delhi') {
    // Lotus Temple (exact match to Screenshot 14!)
    return (
      <svg viewBox="0 0 180 96" className="w-48 h-24 drop-shadow-md">
        <defs>
          <linearGradient id="lotusG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ecfeff" />
            <stop offset="55%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
        </defs>
        <path d="M90 8 L112 72 L68 72 Z" fill="url(#lotusG)" stroke="#0369a1" strokeWidth="2" />
        <path d="M62 22 L92 78 L42 78 Z" fill="url(#lotusG)" stroke="#0369a1" strokeWidth="2" />
        <path d="M118 22 L138 78 L88 78 Z" fill="url(#lotusG)" stroke="#0369a1" strokeWidth="2" />
        <path d="M36 42 L68 84 L22 84 Z" fill="#67e8f9" stroke="#0369a1" strokeWidth="2" />
        <path d="M144 42 L158 84 L112 84 Z" fill="#67e8f9" stroke="#0369a1" strokeWidth="2" />
        <path d="M68 84 Q90 54 112 84 Z" fill="#f59e0b" stroke="#92400e" strokeWidth="2" />
      </svg>
    );
  }

  if (landmark === 'cairo') {
    return (
      <svg viewBox="0 0 180 96" className="w-44 h-24 drop-shadow-md">
        <polygon points="30,86 78,24 126,86" fill="#eab308" stroke="#854d0e" strokeWidth="2" />
        <polygon points="78,24 126,86 92,86" fill="#ca8a04" />
        <polygon points="88,86 126,40 162,86" fill="#facc15" stroke="#854d0e" strokeWidth="2" />
      </svg>
    );
  }

  // Skyline / Palace for NY, Singapore, Mumbai, Dubai, Tokyo
  return (
    <svg viewBox="0 0 180 96" className="w-44 h-24 drop-shadow-md">
      <rect x="28" y="42" width="24" height="46" rx="2" fill="#93c5fd" stroke="#1e3a8a" strokeWidth="2" />
      <rect x="58" y="22" width="28" height="66" rx="2" fill="#fde047" stroke="#854d0e" strokeWidth="2" />
      <polygon points="90,8 104,28 104,88 76,88 76,28" fill="#e2e8f0" stroke="#334155" strokeWidth="2" />
      <rect x="110" y="34" width="24" height="54" rx="2" fill="#f9a8d4" stroke="#831843" strokeWidth="2" />
      <rect x="138" y="50" width="20" height="38" rx="2" fill="#6ee7b7" stroke="#065f46" strokeWidth="2" />
    </svg>
  );
};
