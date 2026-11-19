export type GameMode = 'disc-pool' | 'carrom' | 'freestyle';
export type PlayerFormat = '1v1' | '2v2';
export type NavTab = 'home' | 'friends' | 'equipment' | 'events' | 'shop';
export type ScreenId =
  | 'home'
  | 'stage-select'
  | 'game'
  | 'friends'
  | 'room-lobby'
  | 'equipment'
  | 'events'
  | 'shop';

export type Rarity = 'STANDARD' | 'RARE' | 'EPIC' | 'LEGENDARY' | 'MYTHIC';
export type EquipmentCategory = 'strikers' | 'powers' | 'pucks' | 'trails' | 'pockets';

export interface StrikerDef {
  id: string;
  name: string;
  rarity: Rarity;
  sourceLabel: string;
  baseForce: number;
  baseAim: number;
  baseTime: number;
  maxForce: number;
  maxAim: number;
  maxTime: number;
  cardsToUnlock: number;
  cardsPerLevel: number;
  upgradeCostBase: number;
  accentColor: string;
  bgGradient: [string, string];
}

export interface CosmeticDef {
  id: string;
  category: 'pucks' | 'trails' | 'pockets';
  name: string;
  rarity: Rarity;
  sourceLabel: string;
  cardsToUnlock: number;
  costCoins?: number;
  costGems?: number;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  description: string;
}

export interface PowerDef {
  id: string;
  name: string;
  unlockLevel: number;
  icon: string;
  description: string;
  bonusForce?: number;
  bonusAim?: number;
  bonusTime?: number;
  bonusCoinsPct?: number;
}

export interface ArenaDef {
  id: string;
  mode: GameMode;
  city: string;
  subtitle: string;
  landmark: 'paris' | 'delhi' | 'cairo' | 'newyork' | 'singapore' | 'mumbai' | 'dubai' | 'tokyo';
  entryFee: number;
  reward: number;
  rulesLabel: string;
  piecesPerPlayer: number;
  hasQueen: boolean;
  targetPoints?: number;
  cardGradient: [string, string];
  badgeGradient: [string, string];
  boardTheme: {
    backdropGradient: [string, string];
    cornerAccent: string;
    circleFill: string;
    woodTint: string;
    ornateCenter: boolean;
  };
  aiSkill: number; // 0.45 - 0.92
}

export interface OwnedStrikerState {
  unlocked: boolean;
  level: number;
  cards: number;
}

export interface ChestSlot {
  id: string;
  tier: 'wood' | 'silver' | 'gold' | 'legend';
  name: string;
  durationSec: number;
  unlockStartedAt: number | null; // timestamp ms
  sourceArena: string;
}

export interface FriendEntry {
  id: string;
  playerCode: string;
  username: string;
  avatarId: string;
  level: number;
  online: boolean;
  lastGiftSentAt?: number;
}

export interface GiftItem {
  id: string;
  fromName: string;
  fromAvatar: string;
  coins: number;
  claimed: boolean;
  createdAt: number;
}

export interface InboxMessage {
  id: string;
  type: 'friend-request' | 'reward' | 'system';
  title: string;
  body: string;
  fromPlayer?: FriendEntry;
  rewardCoins?: number;
  rewardGems?: number;
  read: boolean;
  createdAt: number;
}

export interface UserAccount {
  id: string;
  playerCode: string;
  username: string;
  email?: string;
  isGuest: boolean;
  avatarId: string;
  level: number;
  xp: number;
  coins: number;
  gems: number;
  collectionPower: number;
  collectionLevel: number;
  equippedStriker: string;
  equippedPuck: string;
  equippedTrail: string;
  equippedPocket: string;
  strikers: Record<string, OwnedStrikerState>;
  unlockedCosmetics: string[];
  chests: (ChestSlot | null)[];
  friends: FriendEntry[];
  gifts: GiftItem[];
  inbox: InboxMessage[];
  stats: {
    gamesPlayed: number;
    gamesWon: number;
    winStreak: number;
    bestStreak: number;
    totalCoinsWon: number;
    pucksPotted: number;
    queensCovered: number;
  };
  dailyRewards: {
    dayIndex: number; // 0..6
    lastClaimedAt: number | null;
    freeGiftLastAt: number | null;
    spinLastAt: number | null;
    luckyShotLastAt: number | null;
  };
  eventProgress: Record<string, { progress: number; claimed: boolean }>;
  settings: {
    sfx: boolean;
    vibration: boolean;
    serverUrl: string;
  };
}

export interface MatchParticipant {
  slotIndex: number; // 0 = bottom (you), 1 = top (opp1), for 2v2: 0=bottom(T0), 1=right(T1), 2=top(T0), 3=left(T1)
  team: 0 | 1;
  id: string;
  username: string;
  avatarId: string;
  level: number;
  isBot: boolean;
  isLocalHuman: boolean;
  strikerId: string;
  assignedColor?: 'black' | 'white';
}

export interface ActiveMatchConfig {
  matchId: string;
  mode: GameMode;
  format: PlayerFormat;
  arena: ArenaDef;
  isPrivateRoom: boolean;
  roomCode?: string;
  isOnlineMultiplayer: boolean;
  mySeatIndex: number;
  participants: MatchParticipant[];
  pot: number;
}

export interface RoomSlot {
  team: 0 | 1;
  seatIndex: number;
  player: {
    id: string;
    username: string;
    avatarId: string;
    level: number;
    isBot: boolean;
    isLocalHuman: boolean;
    isHost?: boolean;
  } | null;
}

export interface PrivateRoomState {
  code: string;
  format: PlayerFormat;
  mode: 'disc-pool' | 'carrom';
  isOnline: boolean;
  hostId: string;
  slots: RoomSlot[];
  chat: { id: string; sender: string; text: string; ts: number }[];
}

export interface DiscBody {
  id: string;
  kind: 'white' | 'black' | 'queen' | 'striker';
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  mass: number;
  potted: boolean;
  pottingAnim?: {
    pocketX: number;
    pocketY: number;
    progress: number;
  };
}

export interface ChatBubble {
  seatIndex: number;
  text: string;
  expiresAt: number;
}
