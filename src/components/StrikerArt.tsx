import React from 'react';

export const GemIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg width={size} height={size} viewBox="0 0 36 36" className={`shrink-0 drop-shadow ${className}`}>
    <defs>
      <linearGradient id="gemTop" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="45%" stopColor="#38bdf8" />
        <stop offset="100%" stopColor="#1d4ed8" />
      </linearGradient>
    </defs>
    <polygon points="18,3 31,13 26,31 10,31 5,13" fill="url(#gemTop)" stroke="#0f2b75" strokeWidth="1.8" />
    <polygon points="18,3 24,13 18,22 12,13" fill="#bae6fd" opacity="0.8" />
    <polygon points="18,22 31,13 26,31" fill="#1e40af" opacity="0.55" />
    <polygon points="18,22 5,13 10,31" fill="#2563eb" opacity="0.55" />
    <circle cx="14" cy="10" r="2.2" fill="#ffffff" opacity="0.9" />
  </svg>
);

export const CoinIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 24,
  className = '',
}) => (
  <svg width={size} height={size} viewBox="0 0 36 36" className={`shrink-0 drop-shadow ${className}`}>
    <defs>
      <radialGradient id="coinGold" cx="35%" cy="30%" r="70%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="55%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </radialGradient>
    </defs>
    <circle cx="18" cy="18" r="15.5" fill="url(#coinGold)" stroke="#78350f" strokeWidth="2" />
    <circle cx="18" cy="18" r="11.5" fill="none" stroke="#fef9c3" strokeWidth="1.5" opacity="0.7" />
    {/* Crown icon inside coin */}
    <path
      d="M11 22 L12.5 14 L15.8 17.5 L18 12.5 L20.2 17.5 L23.5 14 L25 22 Z"
      fill="#fef08a"
      stroke="#92400e"
      strokeWidth="1.1"
      strokeLinejoin="round"
    />
  </svg>
);

export const CoinStackIcon: React.FC<{ size?: number }> = ({ size = 48 }) => (
  <svg width={size} height={size * 0.85} viewBox="0 0 80 68" className="drop-shadow-lg">
    {/* Back stack */}
    {[44, 38, 32, 26, 20].map((y, i) => (
      <g key={i}>
        <ellipse cx="40" cy={y + 4} rx="18" ry="7.5" fill="#92400e" />
        <ellipse cx="40" cy={y} rx="18" ry="7.5" fill="#fbbf24" stroke="#b45309" strokeWidth="1.2" />
        <ellipse cx="40" cy={y} rx="13" ry="5" fill="none" stroke="#fef08a" strokeWidth="1" opacity="0.6" />
      </g>
    ))}
    {/* Left stack */}
    {[52, 46, 40, 34].map((y, i) => (
      <g key={`l-${i}`}>
        <ellipse cx="22" cy={y + 4} rx="16" ry="6.8" fill="#92400e" />
        <ellipse cx="22" cy={y} rx="16" ry="6.8" fill="#f59e0b" stroke="#92400e" strokeWidth="1.2" />
      </g>
    ))}
    {/* Front leaning coin */}
    <circle cx="56" cy="46" r="16" fill="#f59e0b" stroke="#78350f" strokeWidth="2" />
    <circle cx="56" cy="46" r="12" fill="#fbbf24" stroke="#fef08a" strokeWidth="1.4" />
    <path d="M49 50 L51 42 L54 45 L56 40 L58 45 L61 42 L63 50 Z" fill="#fef08a" stroke="#92400e" strokeWidth="1" />
  </svg>
);

export const StrikerArt: React.FC<{ strikerId: string; size?: number }> = ({
  strikerId,
  size = 66,
}) => {
  const uid = `st-${strikerId}-${size}`;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" className="drop-shadow-lg shrink-0">
      <defs>
        <radialGradient id={`${uid}-blaze`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="75%" stopColor="#f5e6d3" />
          <stop offset="100%" stopColor="#cfb38e" />
        </radialGradient>
        <radialGradient id={`${uid}-dark`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#334155" />
          <stop offset="100%" stopColor="#090d16" />
        </radialGradient>
        <radialGradient id={`${uid}-trace`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </radialGradient>
        <radialGradient id={`${uid}-toran`} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#7f1d1d" />
        </radialGradient>
      </defs>

      {strikerId === 'blaze' && (
        <>
          <circle cx="50" cy="50" r="45" fill={`url(#${uid}-blaze)`} stroke="#a67c52" strokeWidth="4" />
          <circle cx="50" cy="50" r="38" fill="none" stroke="#e2c39d" strokeWidth="2" />
          <g transform="translate(50,50)" stroke="#ea580c" strokeWidth="2.2" fill="none">
            {Array.from({ length: 10 }).map((_, i) => (
              <ellipse key={i} cx="0" cy="-16" rx="7" ry="15" transform={`rotate(${i * 36})`} />
            ))}
            <circle cx="0" cy="0" r="7" />
          </g>
        </>
      )}

      {strikerId === 'astro' && (
        <>
          <circle cx="50" cy="50" r="45" fill={`url(#${uid}-dark)`} stroke="#94a3b8" strokeWidth="4" />
          <circle cx="50" cy="50" r="34" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
          <polygon points="50,18 58,46 50,82 42,46" fill="#e2e8f0" />
          <polygon points="18,50 46,44 82,50 46,56" fill="#94a3b8" opacity="0.8" />
          <circle cx="50" cy="50" r="6" fill="#38bdf8" />
        </>
      )}

      {strikerId === 'pulse' && (
        <>
          <circle cx="50" cy="50" r="45" fill={`url(#${uid}-dark)`} stroke="#38bdf8" strokeWidth="4" />
          <circle cx="50" cy="50" r="37" fill="none" stroke="#1d4ed8" strokeWidth="3" />
          <polyline
            points="16,50 32,50 39,26 48,74 58,34 65,50 84,50"
            fill="none"
            stroke="#60a5fa"
            strokeWidth="4.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}

      {strikerId === 'aura' && (
        <>
          <circle cx="50" cy="50" r="45" fill="#181216" stroke="#52525b" strokeWidth="4" />
          <circle cx="50" cy="50" r="36" fill="none" stroke="#3f3f46" strokeWidth="2" />
          <g transform="translate(50,50)" fill="#b91c1c" stroke="#f87171" strokeWidth="1.2">
            {Array.from({ length: 5 }).map((_, i) => (
              <ellipse key={i} cx="0" cy="-16" rx="9" ry="16" transform={`rotate(${i * 72})`} />
            ))}
            <circle cx="0" cy="0" r="5" fill="#fbbf24" />
          </g>
        </>
      )}

      {strikerId === 'trace' && (
        <>
          <circle cx="50" cy="50" r="45" fill={`url(#${uid}-trace)`} stroke="#67e8f9" strokeWidth="4" />
          <g stroke="#a5f3fc" strokeWidth="2.5" fill="none" strokeLinecap="round">
            <path d="M30 76 L30 42 L38 34 L38 22" />
            <path d="M50 80 L50 32" />
            <path d="M70 76 L70 46 L62 38 L62 24" />
          </g>
          <circle cx="38" cy="22" r="3.5" fill="#ecfeff" />
          <circle cx="50" cy="30" r="4" fill="#ecfeff" />
          <circle cx="62" cy="24" r="3.5" fill="#ecfeff" />
        </>
      )}

      {strikerId === 'toran' && (
        <>
          <circle cx="50" cy="50" r="45" fill={`url(#${uid}-toran)`} stroke="#f59e0b" strokeWidth="4.5" />
          <g transform="translate(50,50)">
            {Array.from({ length: 8 }).map((_, i) => (
              <path
                key={i}
                d="M0,-8 L8,-26 L0,-36 L-8,-26 Z"
                fill="#fbbf24"
                stroke="#7f1d1d"
                strokeWidth="1.5"
                transform={`rotate(${i * 45})`}
              />
            ))}
            <circle cx="0" cy="0" r="10" fill="#fef08a" stroke="#b45309" strokeWidth="2" />
          </g>
        </>
      )}

      {!['blaze', 'astro', 'pulse', 'aura', 'trace', 'toran'].includes(strikerId) && (
        <>
          <circle
            cx="50"
            cy="50"
            r="45"
            fill={strikerId === 'vortex' ? '#701a75' : strikerId === 'ember' ? '#c2410c' : '#854d0e'}
            stroke="#fde047"
            strokeWidth="4"
          />
          <circle cx="50" cy="50" r="28" fill="none" stroke="#fef08a" strokeWidth="3" strokeDasharray="8 5" />
          <polygon points="50,24 58,42 76,50 58,58 50,76 42,58 24,50 42,42" fill="#fde047" />
        </>
      )}
    </svg>
  );
};
