export interface GameEventDef {
  id: string;
  title: string;
  subtitle: string;
  badge: string;
  target: number;
  metric: 'gamesWon' | 'pucksPotted' | 'queensCovered' | 'gamesPlayed';
  rewardCoins: number;
  rewardGems: number;
  rewardChest?: 'silver' | 'gold' | 'legend';
  gradient: [string, string];
}

export const ACTIVE_EVENTS: GameEventDef[] = [
  {
    id: 'evt-paris-cup',
    title: 'Paris Masters Challenge',
    subtitle: 'Win 3 matches in any Arena',
    badge: 'LIVE',
    target: 3,
    metric: 'gamesWon',
    rewardCoins: 1500,
    rewardGems: 10,
    rewardChest: 'gold',
    gradient: ['#d97706', '#92400e'],
  },
  {
    id: 'evt-puck-hunter',
    title: 'Puck Hunter Sprint',
    subtitle: 'Pot 15 pucks across matches',
    badge: 'DAILY',
    target: 15,
    metric: 'pucksPotted',
    rewardCoins: 800,
    rewardGems: 5,
    gradient: ['#2563eb', '#1e3a8a'],
  },
  {
    id: 'evt-queen-crown',
    title: 'Crown the Queen',
    subtitle: 'Cover the Red Queen 2 times',
    badge: 'SPECIAL',
    target: 2,
    metric: 'queensCovered',
    rewardCoins: 2000,
    rewardGems: 15,
    rewardChest: 'legend',
    gradient: ['#9333ea', '#581c87'],
  },
  {
    id: 'evt-arena-warmup',
    title: 'Arena Warmup',
    subtitle: 'Play 2 matches today',
    badge: 'HOT',
    target: 2,
    metric: 'gamesPlayed',
    rewardCoins: 500,
    rewardGems: 5,
    gradient: ['#16a34a', '#14532d'],
  },
];

export const DAILY_REWARD_TRACK = [
  { day: 1, coins: 300, gems: 0, label: '300 Coins' },
  { day: 2, coins: 500, gems: 2, label: '500 + 2 Gems' },
  { day: 3, coins: 750, gems: 0, label: '750 Coins' },
  { day: 4, coins: 1000, gems: 5, label: '1K + 5 Gems' },
  { day: 5, coins: 1500, gems: 0, label: '1.5K Coins' },
  { day: 6, coins: 2000, gems: 8, label: '2K + 8 Gems' },
  { day: 7, coins: 5000, gems: 20, label: 'MEGA 5K!' },
];

export const SPIN_SLICES = [
  { label: '250', type: 'coins' as const, amount: 250, color: '#ea580c' },
  { label: '5 💎', type: 'gems' as const, amount: 5, color: '#2563eb' },
  { label: '500', type: 'coins' as const, amount: 500, color: '#16a34a' },
  { label: '100', type: 'coins' as const, amount: 100, color: '#7c3aed' },
  { label: '1 500', type: 'coins' as const, amount: 1500, color: '#eab308' },
  { label: '10 💎', type: 'gems' as const, amount: 10, color: '#0284c7' },
  { label: '750', type: 'coins' as const, amount: 750, color: '#db2777' },
  { label: '3 000', type: 'coins' as const, amount: 3000, color: '#dc2626' },
];

export const LEADERBOARD_SEED = [
  { username: 'Dhaka_King99', country: 'BD', avatarId: 'champion', winnings: 148500, level: 24 },
  { username: 'Mumbai_Ace', country: 'IN', avatarId: 'ace', winnings: 132400, level: 21 },
  { username: 'Colombo_Crusdr', country: 'LK', avatarId: 'colombo', winnings: 98200, level: 18 },
  { username: 'Paris_Shot', country: 'FR', avatarId: 'captain', winnings: 84600, level: 16 },
  { username: 'Prabath', country: 'LK', avatarId: 'prabath', winnings: 71300, level: 15 },
  { username: 'Zara_Queen', country: 'PK', avatarId: 'mystic', winnings: 62900, level: 14 },
  { username: 'Arjun_Pro', country: 'IN', avatarId: 'gamer', winnings: 54100, level: 12 },
  { username: 'Siam_Striker', country: 'BD', avatarId: 'colombo', winnings: 41800, level: 11 },
  { username: 'Riya_Carrom', country: 'IN', avatarId: 'mystic', winnings: 29400, level: 9 },
  { username: 'Karim_Pool', country: 'BD', avatarId: 'prabath', winnings: 14200, level: 6 },
];
