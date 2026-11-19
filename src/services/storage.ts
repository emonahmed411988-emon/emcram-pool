import { ChestSlot, UserAccount } from '../types/game';
import { STRIKERS } from '../data/equipment';

const ACTIVE_KEY = 'carrom_pool_active_account_v1';
const VAULT_KEY = 'carrom_pool_accounts_vault_v1';

interface StoredVaultEntry {
  email: string;
  passwordHash: string;
  account: UserAccount;
}

export function formatNumberSpaced(n: number): string {
  return Math.floor(n)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function simpleHash(input: string): string {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function createStarterChest(): ChestSlot {
  return {
    id: `chest-${Date.now()}`,
    tier: 'wood',
    name: 'Victory Chest',
    durationSec: 10,
    unlockStartedAt: null,
    sourceArena: 'PARIS Stage',
  };
}

export function createFreshAccount(opts?: {
  username?: string;
  email?: string;
  isGuest?: boolean;
}): UserAccount {
  const rand9 = Math.floor(100000000 + Math.random() * 899999999);
  const code6 = Math.floor(100000 + Math.random() * 899999);
  const strikers: UserAccount['strikers'] = {};
  for (const s of STRIKERS) {
    strikers[s.id] = {
      unlocked: s.id === 'blaze',
      level: 1,
      cards: 0,
    };
  }

  return {
    id: `usr_${Date.now().toString(36)}_${rand9.toString(36)}`,
    playerCode: `CP-${code6}`,
    username: opts?.username || `Guest_${rand9}`,
    email: opts?.email,
    isGuest: opts?.isGuest ?? true,
    avatarId: 'guest',
    level: 1,
    xp: 0,
    coins: 5200,
    gems: 20,
    collectionPower: 0,
    collectionLevel: 1,
    equippedStriker: 'blaze',
    equippedPuck: 'puck-classic',
    equippedTrail: 'trail-classic',
    equippedPocket: 'pocket-classic',
    strikers,
    unlockedCosmetics: ['puck-classic', 'trail-classic', 'pocket-classic'],
    chests: [createStarterChest(), null, null, null],
    friends: [],
    gifts: [
      {
        id: 'welcome-gift-1',
        fromName: 'Carrom Club',
        fromAvatar: 'champion',
        coins: 250,
        claimed: false,
        createdAt: Date.now(),
      },
    ],
    inbox: [
      {
        id: 'welcome-msg-1',
        type: 'reward',
        title: 'Welcome to Carrom Pool!',
        body: 'Claim your starter bonus coins and unlock your first Victory Chest on the Home screen.',
        rewardCoins: 500,
        rewardGems: 5,
        read: false,
        createdAt: Date.now(),
      },
    ],
    stats: {
      gamesPlayed: 0,
      gamesWon: 0,
      winStreak: 0,
      bestStreak: 0,
      totalCoinsWon: 0,
      pucksPotted: 0,
      queensCovered: 0,
    },
    dailyRewards: {
      dayIndex: 0,
      lastClaimedAt: null,
      freeGiftLastAt: null,
      spinLastAt: null,
      luckyShotLastAt: null,
    },
    eventProgress: {},
    settings: {
      sfx: true,
      vibration: true,
      serverUrl: '',
    },
  };
}

export function loadActiveAccount(): UserAccount {
  try {
    const raw = localStorage.getItem(ACTIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as UserAccount;
      if (parsed && parsed.id && parsed.strikers) {
        // Ensure any newly added strikers exist
        for (const s of STRIKERS) {
          if (!parsed.strikers[s.id]) {
            parsed.strikers[s.id] = { unlocked: s.id === 'blaze', level: 1, cards: 0 };
          }
        }
        return parsed;
      }
    }
  } catch {
    // ignore storage errors
  }
  const fresh = createFreshAccount({ isGuest: true });
  saveActiveAccount(fresh);
  return fresh;
}

export function saveActiveAccount(account: UserAccount): void {
  try {
    localStorage.setItem(ACTIVE_KEY, JSON.stringify(account));
    if (!account.isGuest && account.email) {
      const vault = loadVault();
      const idx = vault.findIndex((v) => v.email.toLowerCase() === account.email!.toLowerCase());
      if (idx >= 0) {
        vault[idx].account = account;
        localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
      }
    }
  } catch {
    // ignore quota errors
  }
}

function loadVault(): StoredVaultEntry[] {
  try {
    const raw = localStorage.getItem(VAULT_KEY);
    return raw ? (JSON.parse(raw) as StoredVaultEntry[]) : [];
  } catch {
    return [];
  }
}

export function registerLocalAccount(
  username: string,
  email: string,
  password: string,
  currentAccount?: UserAccount
): { ok: boolean; error?: string; account?: UserAccount } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanUser = username.trim();
  if (!cleanUser || cleanUser.length < 3) {
    return { ok: false, error: 'Username must be at least 3 characters.' };
  }
  if (!cleanEmail.includes('@')) {
    return { ok: false, error: 'Please enter a valid email address.' };
  }
  if (password.length < 4) {
    return { ok: false, error: 'Password must be at least 4 characters.' };
  }

  const vault = loadVault();
  if (vault.some((v) => v.email === cleanEmail)) {
    return { ok: false, error: 'An account with this email already exists.' };
  }

  // Upgrade current guest progress into registered account if guest!
  const base =
    currentAccount && currentAccount.isGuest
      ? { ...currentAccount, username: cleanUser, email: cleanEmail, isGuest: false }
      : createFreshAccount({ username: cleanUser, email: cleanEmail, isGuest: false });

  // Reward linking bonus
  if (currentAccount && currentAccount.isGuest) {
    base.coins += 1000;
    base.gems += 10;
  }

  vault.push({
    email: cleanEmail,
    passwordHash: simpleHash(password),
    account: base,
  });
  localStorage.setItem(VAULT_KEY, JSON.stringify(vault));
  saveActiveAccount(base);
  return { ok: true, account: base };
}

export function loginLocalAccount(
  email: string,
  password: string
): { ok: boolean; error?: string; account?: UserAccount } {
  const cleanEmail = email.trim().toLowerCase();
  const vault = loadVault();
  const entry = vault.find((v) => v.email === cleanEmail);
  if (!entry) {
    return { ok: false, error: 'No account found with this email.' };
  }
  if (entry.passwordHash !== simpleHash(password)) {
    return { ok: false, error: 'Incorrect password.' };
  }
  saveActiveAccount(entry.account);
  return { ok: true, account: entry.account };
}

export function listSavedLocalAccounts(): { username: string; email: string; level: number }[] {
  return loadVault().map((v) => ({
    username: v.account.username,
    email: v.email,
    level: v.account.level,
  }));
}
