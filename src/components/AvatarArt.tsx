import React from 'react';
import { AVATARS } from '../data/avatars';

interface AvatarArtProps {
  avatarId: string;
  size?: number;
  level?: number;
  timerProgress?: number | null; // 0..1 remaining turn time -> radial countdown sweep overlay!
  isEmptySlot?: boolean;
  className?: string;
}

export const AvatarArt: React.FC<AvatarArtProps> = ({
  avatarId,
  size = 48,
  level,
  timerProgress = null,
  isEmptySlot = false,
  className = '',
}) => {
  const def = AVATARS.find((a) => a.id === avatarId) || AVATARS[0];
  const gradId = `av-${avatarId}-${size}-${Math.floor(Math.random() * 9999)}`;

  // Calculate radial wedge overlay for turn countdown (exact match to Screenshots 3, 9, 13!)
  const sweepDeg = timerProgress !== null ? Math.max(0, Math.min(360, (1 - timerProgress) * 360)) : 0;

  return (
    <div
      className={`relative shrink-0 rounded-md overflow-visible ${className}`}
      style={{ width: size, height: size }}
    >
      <div
        className="w-full h-full rounded-md overflow-hidden relative"
        style={{
          border: '2px solid #d99b56',
          boxShadow: 'inset 0 1px 2px rgba(255,255,255,0.45), 0 3px 6px rgba(0,0,0,0.55)',
        }}
      >
        <svg viewBox="0 0 64 64" className="w-full h-full block">
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isEmptySlot ? '#3b82f6' : def.bg[0]} />
              <stop offset="100%" stopColor={isEmptySlot ? '#1d4ed8' : def.bg[1]} />
            </linearGradient>
          </defs>
          <rect width="64" height="64" fill={`url(#${gradId})`} />

          {/* Subtle glossy horizon light */}
          <ellipse cx="32" cy="14" rx="28" ry="14" fill="rgba(255,255,255,0.14)" />

          {isEmptySlot || def.style === 'guest' ? (
            <>
              <circle cx="32" cy="24" r="11" fill="#0d2b6b" opacity="0.85" />
              <path d="M12 60 C12 43 20 37 32 37 C44 37 52 43 52 60 Z" fill="#0d2b6b" opacity="0.85" />
              {isEmptySlot && (
                <text
                  x="32"
                  y="55"
                  textAnchor="middle"
                  fill="#ffffff"
                  fontSize="18"
                  fontWeight="800"
                  fontFamily="Fredoka, sans-serif"
                >
                  ?
                </text>
              )}
            </>
          ) : (
            <>
              {/* Stylized illustrated portrait */}
              {def.style === 'royal' && (
                <>
                  <circle cx="14" cy="14" r="2" fill="#fde047" />
                  <circle cx="52" cy="18" r="2.5" fill="#fb923c" />
                  <circle cx="48" cy="10" r="1.5" fill="#fef08a" />
                </>
              )}
              {def.style === 'festive' && (
                <>
                  <path d="M48 6 L56 26" stroke="#fde047" strokeWidth="3" strokeLinecap="round" opacity="0.7" />
                  <circle cx="12" cy="16" r="2.2" fill="#fde047" />
                </>
              )}
              {/* Shoulders / outfit */}
              <path
                d="M8 64 C10 46 20 41 32 41 C44 41 54 46 56 64 Z"
                fill={def.shirt || '#4f46e5'}
              />
              <path d="M25 41 L32 50 L39 41" fill="none" stroke="#fde047" strokeWidth="2.5" />
              {/* Neck */}
              <rect x="27" y="34" width="10" height="10" rx="4" fill={def.skin || '#d89b6e'} />
              {/* Head */}
              <ellipse cx="32" cy="25" rx="11.5" ry="13" fill={def.skin || '#d89b6e'} />
              {/* Hair */}
              <path
                d="M20 23 C20 12 26 9 32 9 C39 9 44 13 44 23 C41 17 37 15 32 15 C26 15 23 17 20 23 Z"
                fill={def.hair || '#1c1917'}
              />
              {def.style === 'champion' && (
                <path d="M22 13 L25 6 L32 10 L39 6 L42 13 Z" fill="#facc15" stroke="#92400e" strokeWidth="1" />
              )}
              {/* Eyes & Smile */}
              <circle cx="27.5" cy="25" r="1.8" fill="#18181b" />
              <circle cx="36.5" cy="25" r="1.8" fill="#18181b" />
              <path d="M27.5 31 Q32 34.5 36.5 31" fill="none" stroke="#7c2d12" strokeWidth="1.8" strokeLinecap="round" />
            </>
          )}
        </svg>

        {/* Animated Radial Turn Timer Overlay (green-yellow tint fading into red near end) */}
        {timerProgress !== null && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `conic-gradient(rgba(0,0,0,0) ${sweepDeg}deg, ${
                timerProgress > 0.3 ? 'rgba(74, 222, 128, 0.42)' : 'rgba(239, 68, 68, 0.58)'
              } ${sweepDeg}deg)`,
            }}
          />
        )}
      </div>

      {/* Golden Star Level Badge (matches Screenshot 2 & 8!) */}
      {level !== undefined && (
        <div
          className="absolute -top-2 -right-2 flex items-center justify-center pointer-events-none"
          style={{ width: Math.max(22, size * 0.48), height: Math.max(22, size * 0.48) }}
        >
          <svg viewBox="0 0 36 36" className="w-full h-full drop-shadow">
            <path
              d="M18 2 L22.5 11.5 L33 13 L25.5 20.5 L27.3 31 L18 26 L8.7 31 L10.5 20.5 L3 13 L13.5 11.5 Z"
              fill="#f5c344"
              stroke="#784209"
              strokeWidth="2.2"
              strokeLinejoin="round"
            />
          </svg>
          <span
            className="absolute text-[10px] font-extrabold text-white text-stroke-sm leading-none"
            style={{ marginTop: 1 }}
          >
            {level}
          </span>
        </div>
      )}
    </div>
  );
};
