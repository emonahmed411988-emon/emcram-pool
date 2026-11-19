export interface AvatarDef {
  id: string;
  label: string;
  bg: [string, string];
  skin?: string;
  hair?: string;
  shirt?: string;
  style: 'guest' | 'royal' | 'festive' | 'champion' | 'gamer' | 'mystic' | 'captain' | 'ace';
}

export const AVATARS: AvatarDef[] = [
  { id: 'guest', label: 'Classic', bg: ['#38bdf8', '#1d4ed8'], style: 'guest' },
  { id: 'colombo', label: 'Crusader', bg: ['#7c2d12', '#c2410c'], skin: '#d89b6e', hair: '#1e1b4b', shirt: '#4f46e5', style: 'royal' },
  { id: 'prabath', label: 'Festive', bg: ['#065f46', '#10b981'], skin: '#b9774b', hair: '#1c1917', shirt: '#f59e0b', style: 'festive' },
  { id: 'champion', label: 'Striker King', bg: ['#581c87', '#9333ea'], skin: '#e6b28a', hair: '#27272a', shirt: '#eab308', style: 'champion' },
  { id: 'gamer', label: 'Neon Pro', bg: ['#0f172a', '#0284c7'], skin: '#f0c4a0', hair: '#0ea5e9', shirt: '#1e293b', style: 'gamer' },
  { id: 'mystic', label: 'Lotus Queen', bg: ['#831843', '#db2777'], skin: '#c9885b', hair: '#18181b', shirt: '#ec4899', style: 'mystic' },
  { id: 'captain', label: 'Paris Ace', bg: ['#1e3a8a', '#3b82f6'], skin: '#f2ccb0', hair: '#78350f', shirt: '#dc2626', style: 'captain' },
  { id: 'ace', label: 'Golden Tiger', bg: ['#78350f', '#f59e0b'], skin: '#d49464', hair: '#1c1917', shirt: '#16a34a', style: 'ace' },
];

export const BOT_PROFILES = [
  { username: 'Colombo_Crusdr', avatarId: 'colombo', level: 4, strikerId: 'blaze' },
  { username: 'Prabath', avatarId: 'prabath', level: 6, strikerId: 'ember' },
  { username: 'Dhaka_King99', avatarId: 'champion', level: 8, strikerId: 'titan' },
  { username: 'Paris_Shot', avatarId: 'captain', level: 5, strikerId: 'blaze' },
  { username: 'Mumbai_Ace', avatarId: 'ace', level: 11, strikerId: 'toran' },
  { username: 'Riya_Carrom', avatarId: 'mystic', level: 7, strikerId: 'vortex' },
  { username: 'Arjun_Pro', avatarId: 'gamer', level: 12, strikerId: 'trace' },
  { username: 'Siam_Striker', avatarId: 'colombo', level: 9, strikerId: 'astro' },
  { username: 'Zara_Queen', avatarId: 'mystic', level: 10, strikerId: 'aura' },
  { username: 'Karim_Pool', avatarId: 'prabath', level: 3, strikerId: 'blaze' },
];

export const QUICK_CHAT_PHRASES = [
  'Good luck! 🍀',
  'Nice shot! 🔥',
  'Well played! 👏',
  'Oops! 😅',
  'Close one! 😱',
  'Watch this! 😎',
  'Thanks! 🙏',
  'Rematch? 🎯',
];
