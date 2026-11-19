import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ActiveMatchConfig,
  ArenaDef,
  ChestSlot,
  FriendEntry,
  GameMode,
  MatchParticipant,
  NavTab,
  PlayerFormat,
  PrivateRoomState,
  ScreenId,
  UserAccount,
} from '../types/game';
import {
  createFreshAccount,
  generateRoomCode,
  loadActiveAccount,
  loginLocalAccount,
  registerLocalAccount,
  saveActiveAccount,
} from '../services/storage';
import { multiplayer } from '../services/multiplayer';
import { BOT_PROFILES } from '../data/avatars';
import { COSMETICS, getStrikerDef, STRIKERS } from '../data/equipment';
import { ACTIVE_EVENTS, DAILY_REWARD_TRACK } from '../data/events';
import { getArenasByMode } from '../data/arenas';
import { sound } from '../engine/sound';

export interface ChestRewardReveal {
  chestName: string;
  tier: ChestSlot['tier'];
  coins: number;
  gems: number;
  cards: { strikerId: string; count: number; newlyUnlocked: boolean }[];
}

export type ActiveModal =
  | null
  | 'create-room'
  | 'join-room'
  | 'profile'
  | 'settings'
  | 'free-rewards'
  | 'lucky-shot'
  | 'spin-wheel'
  | 'leaderboard'
  | 'add-friend'
  | 'mail';

interface GameContextValue {
  account: UserAccount;
  screen: ScreenId;
  activeTab: NavTab;
  selectedMode: GameMode;
  activeModal: ActiveModal;
  activeRoom: PrivateRoomState | null;
  activeMatch: ActiveMatchConfig | null;
  chestReveal: ChestRewardReveal | null;
  toastMessage: string | null;
  serverConnected: boolean;

  setScreen: (s: ScreenId) => void;
  goToTab: (tab: NavTab) => void;
  openModeStages: (mode: GameMode) => void;
  setActiveModal: (m: ActiveModal) => void;
  showToast: (msg: string) => void;
  clearChestReveal: () => void;

  // Economy & Account
  updateProfile: (username: string, avatarId: string) => void;
  registerAccount: (username: string, email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  loginAccount: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logoutToGuest: () => void;
  updateSettings: (partial: Partial<UserAccount['settings']>) => void;
  resetProgress: () => void;

  // Equipment
  equipStriker: (id: string) => void;
  upgradeStriker: (id: string) => void;
  equipCosmetic: (id: string, category: 'pucks' | 'trails' | 'pockets') => void;
  buyCosmetic: (id: string) => void;

  // Chests & Rewards
  startChestUnlock: (slotIndex: number) => void;
  openChestNow: (slotIndex: number, useGems?: boolean) => void;
  buyShopChest: (tier: ChestSlot['tier'], gemCost: number) => void;
  buyCoinPack: (coins: number, gemCost: number) => void;
  claimFreeGemPack: () => void;
  claimDailyReward: () => void;
  claimHourlyGift: () => void;
  grantSpinReward: (type: 'coins' | 'gems', amount: number) => void;
  grantLuckyShotReward: (coins: number, gems: number, chestTier?: ChestSlot['tier']) => void;
  claimEventReward: (eventId: string) => void;

  // Friends & Inbox
  addFriendByName: (nameOrCode: string) => void;
  sendGiftToFriend: (friendId: string) => void;
  claimFriendGift: (giftId: string) => void;
  claimInboxMessage: (msgId: string) => void;

  // Rooms & Matches
  createPrivateRoom: (format: PlayerFormat, mode: 'disc-pool' | 'carrom') => Promise<void>;
  joinPrivateRoom: (code: string) => Promise<{ ok: boolean; error?: string }>;
  fillRoomSlot: (seatIndex: number, type: 'bot' | 'local' | 'clear') => void;
  sendRoomChat: (text: string) => void;
  leavePrivateRoom: () => void;
  startPrivateRoomMatch: () => void;
  startArenaMatch: (arena: ArenaDef) => boolean;
  completeMatch: (result: {
    won: boolean;
    pucksPotted: number;
    queensCovered: number;
  }) => void;
  exitMatch: () => void;
}

const GameContext = createContext<GameContextValue | null>(null);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [account, setAccount] = useState<UserAccount>(() => loadActiveAccount());
  const [screen, setScreen] = useState<ScreenId>('home');
  const [activeTab, setActiveTab] = useState<NavTab>('home');
  const [selectedMode, setSelectedMode] = useState<GameMode>('disc-pool');
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const [activeRoom, setActiveRoom] = useState<PrivateRoomState | null>(null);
  const [activeMatch, setActiveMatch] = useState<ActiveMatchConfig | null>(null);
  const [chestReveal, setChestReveal] = useState<ChestRewardReveal | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [serverConnected, setServerConnected] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
  }, []);

  useEffect(() => {
    if (!toastMessage) return;
    const t = setTimeout(() => setToastMessage(null), 2600);
    return () => clearTimeout(t);
  }, [toastMessage]);

  // Persist account & apply sound settings
  useEffect(() => {
    saveActiveAccount(account);
    sound.enabled = account.settings.sfx;
    sound.vibrationEnabled = account.settings.vibration;
  }, [account]);

  // Optional Socket.IO connection if user configured a server URL
  useEffect(() => {
    const url = account.settings.serverUrl;
    if (!url) {
      multiplayer.disconnect();
      setServerConnected(false);
      return;
    }
    const sock = multiplayer.connect(url);
    if (!sock) return;
    const onConn = () => setServerConnected(true);
    const onDisc = () => setServerConnected(false);
    const onRoomUpd = (room: PrivateRoomState) => setActiveRoom(room);
    const onMatchStart = (cfg: ActiveMatchConfig) => {
      setActiveMatch(cfg);
      setScreen('game');
    };
    sock.on('connect', onConn);
    sock.on('disconnect', onDisc);
    sock.on('room:updated', onRoomUpd);
    sock.on('match:started', onMatchStart);
    return () => {
      sock.off('connect', onConn);
      sock.off('disconnect', onDisc);
      sock.off('room:updated', onRoomUpd);
      sock.off('match:started', onMatchStart);
    };
  }, [account.settings.serverUrl]);

  const mutateAccount = useCallback((updater: (prev: UserAccount) => UserAccount) => {
    setAccount((prev) => {
      const next = updater(prev);
      if (next.settings.serverUrl && !next.isGuest) {
        multiplayer.syncProfileRemote(next.settings.serverUrl, next);
      }
      return next;
    });
  }, []);

  const goToTab = useCallback((tab: NavTab) => {
    sound.playClick();
    setActiveTab(tab);
    setScreen(tab);
  }, []);

  const openModeStages = useCallback((mode: GameMode) => {
    sound.playClick();
    setSelectedMode(mode);
    setScreen('stage-select');
  }, []);

  // ================= PROFILE & AUTH =================
  const updateProfile = useCallback(
    (username: string, avatarId: string) => {
      const clean = username.trim().slice(0, 18);
      if (!clean) return;
      mutateAccount((prev) => ({ ...prev, username: clean, avatarId }));
      showToast('Profile updated!');
    },
    [mutateAccount, showToast]
  );

  const registerAccount = useCallback(
    async (username: string, email: string, password: string) => {
      const localRes = registerLocalAccount(username, email, password, account);
      if (!localRes.ok || !localRes.account) {
        return { ok: false, error: localRes.error };
      }
      if (account.settings.serverUrl) {
        await multiplayer.registerRemote(account.settings.serverUrl, {
          username,
          email,
          password,
          account: localRes.account,
        });
      }
      setAccount(localRes.account);
      sound.playCoin();
      showToast('Account created! +1,000 Coins & +10 Gems bonus');
      return { ok: true };
    },
    [account, showToast]
  );

  const loginAccount = useCallback(
    async (email: string, password: string) => {
      if (account.settings.serverUrl) {
        const remoteRes = await multiplayer.loginRemote(account.settings.serverUrl, {
          email,
          password,
        });
        if (remoteRes.ok && remoteRes.account) {
          saveActiveAccount(remoteRes.account);
          setAccount(remoteRes.account);
          showToast(`Welcome back, ${remoteRes.account.username}!`);
          return { ok: true };
        }
      }
      const localRes = loginLocalAccount(email, password);
      if (!localRes.ok || !localRes.account) {
        return { ok: false, error: localRes.error };
      }
      setAccount(localRes.account);
      showToast(`Signed in as ${localRes.account.username}`);
      return { ok: true };
    },
    [account.settings.serverUrl, showToast]
  );

  const logoutToGuest = useCallback(() => {
    const guest = createFreshAccount({ isGuest: true });
    saveActiveAccount(guest);
    setAccount(guest);
    showToast('Switched to new Guest account');
  }, [showToast]);

  const updateSettings = useCallback(
    (partial: Partial<UserAccount['settings']>) => {
      mutateAccount((prev) => ({ ...prev, settings: { ...prev.settings, ...partial } }));
    },
    [mutateAccount]
  );

  const resetProgress = useCallback(() => {
    const fresh = createFreshAccount({ isGuest: true });
    saveActiveAccount(fresh);
    setAccount(fresh);
    setActiveModal(null);
    setScreen('home');
    setActiveTab('home');
    showToast('Progress reset to fresh starter profile');
  }, [showToast]);

  // ================= EQUIPMENT =================
  const equipStriker = useCallback(
    (id: string) => {
      sound.playClick();
      mutateAccount((prev) => {
        if (!prev.strikers[id]?.unlocked) return prev;
        return { ...prev, equippedStriker: id };
      });
      showToast(`Equipped ${getStrikerDef(id).name}!`);
    },
    [mutateAccount, showToast]
  );

  const upgradeStriker = useCallback(
    (id: string) => {
      const def = getStrikerDef(id);
      mutateAccount((prev) => {
        const st = prev.strikers[id];
        if (!st) return prev;
        const neededCards = st.unlocked ? def.cardsPerLevel : def.cardsToUnlock;
        const cost = st.unlocked ? def.upgradeCostBase * st.level : 0;
        if (st.cards < neededCards) {
          showToast(`Need ${neededCards - st.cards} more cards from Chests!`);
          return prev;
        }
        if (prev.coins < cost) {
          showToast('Not enough Coins to upgrade!');
          return prev;
        }
        sound.playChestOpen();
        const nextCP = prev.collectionPower + (st.unlocked ? 8 : 15);
        const nextColLevel = 1 + Math.floor(nextCP / 20);
        showToast(st.unlocked ? `${def.name} upgraded to Level ${st.level + 1}!` : `${def.name} Unlocked!`);
        return {
          ...prev,
          coins: prev.coins - cost,
          collectionPower: nextCP,
          collectionLevel: nextColLevel,
          strikers: {
            ...prev.strikers,
            [id]: {
              unlocked: true,
              level: st.unlocked ? st.level + 1 : 1,
              cards: st.cards - neededCards,
            },
          },
        };
      });
    },
    [mutateAccount, showToast]
  );

  const equipCosmetic = useCallback(
    (id: string, category: 'pucks' | 'trails' | 'pockets') => {
      sound.playClick();
      mutateAccount((prev) => {
        if (!prev.unlockedCosmetics.includes(id)) return prev;
        if (category === 'pucks') return { ...prev, equippedPuck: id };
        if (category === 'trails') return { ...prev, equippedTrail: id };
        return { ...prev, equippedPocket: id };
      });
    },
    [mutateAccount]
  );

  const buyCosmetic = useCallback(
    (id: string) => {
      const item = COSMETICS.find((c) => c.id === id);
      if (!item) return;
      mutateAccount((prev) => {
        if (prev.unlockedCosmetics.includes(id)) return prev;
        if (item.costCoins && prev.coins < item.costCoins) {
          showToast('Not enough Coins!');
          return prev;
        }
        if (item.costGems && prev.gems < item.costGems) {
          showToast('Not enough Gems!');
          return prev;
        }
        sound.playCoin();
        const nextCP = prev.collectionPower + 10;
        showToast(`Unlocked ${item.name}!`);
        return {
          ...prev,
          coins: prev.coins - (item.costCoins || 0),
          gems: prev.gems - (item.costGems || 0),
          collectionPower: nextCP,
          collectionLevel: 1 + Math.floor(nextCP / 20),
          unlockedCosmetics: [...prev.unlockedCosmetics, id],
          equippedPuck: item.category === 'pucks' ? id : prev.equippedPuck,
          equippedTrail: item.category === 'trails' ? id : prev.equippedTrail,
          equippedPocket: item.category === 'pockets' ? id : prev.equippedPocket,
        };
      });
    },
    [mutateAccount, showToast]
  );

  // ================= CHESTS & REWARDS =================
  const generateChestRewards = (
    tier: ChestSlot['tier'],
    chestName: string,
    prevAccount: UserAccount
  ): { updated: UserAccount; reveal: ChestRewardReveal } => {
    const mult = tier === 'legend' ? 5 : tier === 'gold' ? 3 : tier === 'silver' ? 1.8 : 1;
    const coins = Math.round((250 + Math.random() * 250) * mult);
    const gems = tier === 'wood' ? 2 : Math.round((4 + Math.random() * 6) * mult);

    const pool =
      tier === 'legend'
        ? STRIKERS.filter((s) => s.rarity === 'MYTHIC' || s.rarity === 'LEGENDARY')
        : tier === 'gold'
          ? STRIKERS.filter((s) => s.rarity !== 'STANDARD')
          : STRIKERS;

    const pickedCount = tier === 'legend' ? 3 : 2;
    const cards: ChestRewardReveal['cards'] = [];
    const nextStrikers = { ...prevAccount.strikers };
    let bonusCP = 4;

    for (let i = 0; i < pickedCount; i++) {
      const def = pool[Math.floor(Math.random() * pool.length)];
      const qty = tier === 'legend' ? 3 + Math.floor(Math.random() * 3) : 2 + Math.floor(Math.random() * 3);
      const cur = nextStrikers[def.id] || { unlocked: false, level: 1, cards: 0 };
      const newCards = cur.cards + qty;
      const newlyUnlocked = !cur.unlocked && newCards >= def.cardsToUnlock;
      nextStrikers[def.id] = {
        unlocked: cur.unlocked || newlyUnlocked,
        level: cur.level,
        cards: newlyUnlocked ? newCards - def.cardsToUnlock : newCards,
      };
      if (newlyUnlocked) bonusCP += 15;
      cards.push({ strikerId: def.id, count: qty, newlyUnlocked });
    }

    const nextCP = prevAccount.collectionPower + bonusCP;
    const updated: UserAccount = {
      ...prevAccount,
      coins: prevAccount.coins + coins,
      gems: prevAccount.gems + gems,
      collectionPower: nextCP,
      collectionLevel: 1 + Math.floor(nextCP / 20),
      strikers: nextStrikers,
    };

    return {
      updated,
      reveal: { chestName, tier, coins, gems, cards },
    };
  };

  const startChestUnlock = useCallback(
    (slotIndex: number) => {
      sound.playClick();
      mutateAccount((prev) => {
        const slot = prev.chests[slotIndex];
        if (!slot || slot.unlockStartedAt) return prev;
        const nextChests = [...prev.chests];
        nextChests[slotIndex] = { ...slot, unlockStartedAt: Date.now() };
        showToast(`Unlocking ${slot.name} (${slot.durationSec}s)...`);
        return { ...prev, chests: nextChests };
      });
    },
    [mutateAccount, showToast]
  );

  const openChestNow = useCallback(
    (slotIndex: number, useGems = false) => {
      mutateAccount((prev) => {
        const slot = prev.chests[slotIndex];
        if (!slot) return prev;
        const elapsed = slot.unlockStartedAt ? (Date.now() - slot.unlockStartedAt) / 1000 : 0;
        const ready = slot.unlockStartedAt !== null && elapsed >= slot.durationSec;
        if (!ready) {
          if (!useGems) return prev;
          if (prev.gems < 5) {
            showToast('Need 5 Gems to unlock instantly!');
            return prev;
          }
        }
        sound.playChestOpen();
        const afterGem = ready ? prev : { ...prev, gems: prev.gems - 5 };
        const { updated, reveal } = generateChestRewards(slot.tier, slot.name, afterGem);
        const nextChests = [...updated.chests];
        nextChests[slotIndex] = null;
        setChestReveal(reveal);
        return { ...updated, chests: nextChests };
      });
    },
    [mutateAccount, showToast]
  );

  const buyShopChest = useCallback(
    (tier: ChestSlot['tier'], gemCost: number) => {
      mutateAccount((prev) => {
        if (prev.gems < gemCost) {
          showToast('Not enough Gems!');
          return prev;
        }
        sound.playChestOpen();
        const name =
          tier === 'legend'
            ? 'Mythic Legend Chest'
            : tier === 'gold'
              ? 'Golden Royal Chest'
              : 'Silver Pro Chest';
        const { updated, reveal } = generateChestRewards(tier, name, {
          ...prev,
          gems: prev.gems - gemCost,
        });
        setChestReveal(reveal);
        return updated;
      });
    },
    [mutateAccount, showToast]
  );

  const buyCoinPack = useCallback(
    (coins: number, gemCost: number) => {
      mutateAccount((prev) => {
        if (prev.gems < gemCost) {
          showToast('Not enough Gems!');
          return prev;
        }
        sound.playCoin();
        showToast(`Purchased +${coins.toLocaleString()} Coins!`);
        return { ...prev, gems: prev.gems - gemCost, coins: prev.coins + coins };
      });
    },
    [mutateAccount, showToast]
  );

  const claimFreeGemPack = useCallback(() => {
    sound.playCoin();
    mutateAccount((prev) => ({ ...prev, gems: prev.gems + 15, coins: prev.coins + 1000 }));
    showToast('Free Starter Refill: +1,000 Coins & +15 Gems!');
  }, [mutateAccount, showToast]);

  const claimDailyReward = useCallback(() => {
    mutateAccount((prev) => {
      const last = prev.dailyRewards.lastClaimedAt;
      if (last && Date.now() - last < 12 * 3600 * 1000) {
        showToast('Daily reward already claimed! Come back later.');
        return prev;
      }
      const reward = DAILY_REWARD_TRACK[prev.dailyRewards.dayIndex % DAILY_REWARD_TRACK.length];
      sound.playCoin();
      showToast(`Day ${reward.day} Claimed! +${reward.coins} Coins${reward.gems ? ` & +${reward.gems} Gems` : ''}`);
      return {
        ...prev,
        coins: prev.coins + reward.coins,
        gems: prev.gems + reward.gems,
        dailyRewards: {
          ...prev.dailyRewards,
          dayIndex: (prev.dailyRewards.dayIndex + 1) % DAILY_REWARD_TRACK.length,
          lastClaimedAt: Date.now(),
        },
      };
    });
  }, [mutateAccount, showToast]);

  const claimHourlyGift = useCallback(() => {
    mutateAccount((prev) => {
      const last = prev.dailyRewards.freeGiftLastAt;
      if (last && Date.now() - last < 60 * 1000 * 10) {
        showToast('Next Free Gift ready in a few minutes!');
        return prev;
      }
      sound.playCoin();
      showToast('Free Gift Box Opened! +350 Coins & +3 Gems');
      return {
        ...prev,
        coins: prev.coins + 350,
        gems: prev.gems + 3,
        dailyRewards: { ...prev.dailyRewards, freeGiftLastAt: Date.now() },
      };
    });
  }, [mutateAccount, showToast]);

  const grantSpinReward = useCallback(
    (type: 'coins' | 'gems', amount: number) => {
      sound.playCoin();
      mutateAccount((prev) => ({
        ...prev,
        coins: type === 'coins' ? prev.coins + amount : prev.coins,
        gems: type === 'gems' ? prev.gems + amount : prev.gems,
        dailyRewards: { ...prev.dailyRewards, spinLastAt: Date.now() },
      }));
      showToast(`Spin & Win! +${amount} ${type === 'coins' ? 'Coins' : 'Gems'}`);
    },
    [mutateAccount, showToast]
  );

  const grantLuckyShotReward = useCallback(
    (coins: number, gems: number, chestTier?: ChestSlot['tier']) => {
      sound.playChestOpen();
      mutateAccount((prev) => {
        let next: UserAccount = {
          ...prev,
          coins: prev.coins + coins,
          gems: prev.gems + gems,
          dailyRewards: { ...prev.dailyRewards, luckyShotLastAt: Date.now() },
        };
        if (chestTier) {
          const { updated, reveal } = generateChestRewards(chestTier, 'Lucky Shot Bullseye Chest', next);
          setChestReveal(reveal);
          next = updated;
        }
        return next;
      });
      if (!chestTier && (coins > 0 || gems > 0)) {
        showToast(`Lucky Shot Reward! +${coins} Coins${gems ? ` +${gems} Gems` : ''}`);
      }
    },
    [mutateAccount, showToast]
  );

  const claimEventReward = useCallback(
    (eventId: string) => {
      const ev = ACTIVE_EVENTS.find((e) => e.id === eventId);
      if (!ev) return;
      mutateAccount((prev) => {
        const state = prev.eventProgress[eventId] || { progress: 0, claimed: false };
        if (state.claimed) return prev;
        const metricVal = prev.stats[ev.metric];
        if (metricVal < ev.target) {
          showToast(`Progress: ${metricVal}/${ev.target} — keep playing to claim!`);
          return prev;
        }
        sound.playChestOpen();
        let next: UserAccount = {
          ...prev,
          coins: prev.coins + ev.rewardCoins,
          gems: prev.gems + ev.rewardGems,
          eventProgress: {
            ...prev.eventProgress,
            [eventId]: { progress: metricVal, claimed: true },
          },
        };
        if (ev.rewardChest) {
          const { updated, reveal } = generateChestRewards(ev.rewardChest, `${ev.title} Chest`, next);
          setChestReveal(reveal);
          next = updated;
        } else {
          showToast(`Claimed +${ev.rewardCoins} Coins & +${ev.rewardGems} Gems!`);
        }
        return next;
      });
    },
    [mutateAccount, showToast]
  );

  // ================= FRIENDS & INBOX =================
  const addFriendByName = useCallback(
    (nameOrCode: string) => {
      const clean = nameOrCode.trim();
      if (!clean) return;
      mutateAccount((prev) => {
        if (prev.friends.some((f) => f.username.toLowerCase() === clean.toLowerCase())) {
          showToast('Already in your Friends list!');
          return prev;
        }
        const matchedBot = BOT_PROFILES.find(
          (b) => b.username.toLowerCase() === clean.toLowerCase()
        );
        const newFriend: FriendEntry = {
          id: `fr_${Date.now().toString(36)}`,
          playerCode: `CP-${Math.floor(100000 + Math.random() * 899999)}`,
          username: matchedBot ? matchedBot.username : clean,
          avatarId: matchedBot ? matchedBot.avatarId : 'colombo',
          level: matchedBot ? matchedBot.level : Math.floor(2 + Math.random() * 12),
          online: true,
        };
        sound.playCoin();
        showToast(`${newFriend.username} added to Friends!`);
        return { ...prev, friends: [newFriend, ...prev.friends] };
      });
    },
    [mutateAccount, showToast]
  );

  const sendGiftToFriend = useCallback(
    (friendId: string) => {
      sound.playCoin();
      mutateAccount((prev) => ({
        ...prev,
        coins: prev.coins + 50,
        friends: prev.friends.map((f) =>
          f.id === friendId ? { ...f, lastGiftSentAt: Date.now() } : f
        ),
      }));
      showToast('Free Coin Gift sent! (+50 Coins Friendship Bonus)');
    },
    [mutateAccount, showToast]
  );

  const claimFriendGift = useCallback(
    (giftId: string) => {
      sound.playCoin();
      mutateAccount((prev) => {
        const g = prev.gifts.find((x) => x.id === giftId);
        if (!g || g.claimed) return prev;
        showToast(`Claimed +${g.coins} Coins from ${g.fromName}!`);
        return {
          ...prev,
          coins: prev.coins + g.coins,
          gifts: prev.gifts.map((x) => (x.id === giftId ? { ...x, claimed: true } : x)),
        };
      });
    },
    [mutateAccount, showToast]
  );

  const claimInboxMessage = useCallback(
    (msgId: string) => {
      sound.playCoin();
      mutateAccount((prev) => {
        const m = prev.inbox.find((x) => x.id === msgId);
        if (!m || m.read) return prev;
        showToast(
          `Claimed ${m.rewardCoins ? `+${m.rewardCoins} Coins` : ''} ${m.rewardGems ? `+${m.rewardGems} Gems` : ''}`
        );
        return {
          ...prev,
          coins: prev.coins + (m.rewardCoins || 0),
          gems: prev.gems + (m.rewardGems || 0),
          inbox: prev.inbox.map((x) => (x.id === msgId ? { ...x, read: true } : x)),
        };
      });
    },
    [mutateAccount, showToast]
  );

  // ================= PRIVATE ROOMS & ARENA MATCHES =================
  const createPrivateRoom = useCallback(
    async (format: PlayerFormat, mode: 'disc-pool' | 'carrom') => {
      sound.playClick();
      const me = {
        id: account.id,
        username: account.username,
        avatarId: account.avatarId,
        level: account.level,
      };

      const onlineRoom = await multiplayer.createOnlineRoom(format, mode, me);
      if (onlineRoom) {
        setActiveRoom(onlineRoom);
      } else {
        const code = generateRoomCode();
        const slots: PrivateRoomState['slots'] =
          format === '2v2'
            ? [
                { team: 0, seatIndex: 0, player: { ...me, isBot: false, isLocalHuman: true, isHost: true } },
                { team: 1, seatIndex: 1, player: null },
                { team: 0, seatIndex: 2, player: null },
                { team: 1, seatIndex: 3, player: null },
              ]
            : [
                { team: 0, seatIndex: 0, player: { ...me, isBot: false, isLocalHuman: true, isHost: true } },
                { team: 1, seatIndex: 1, player: null },
              ];
        setActiveRoom({
          code,
          format,
          mode,
          isOnline: false,
          hostId: account.id,
          slots,
          chat: [],
        });
      }
      setActiveModal(null);
      setScreen('room-lobby');
    },
    [account]
  );

  const joinPrivateRoom = useCallback(
    async (code: string) => {
      const clean = code.trim().toUpperCase();
      if (clean.length < 4) return { ok: false, error: 'Enter a valid 6-character Room Code' };
      const me = {
        id: account.id,
        username: account.username,
        avatarId: account.avatarId,
        level: account.level,
      };
      const resp = await multiplayer.joinOnlineRoom(clean, me);
      if (resp.ok && resp.room) {
        setActiveRoom(resp.room);
        setActiveModal(null);
        setScreen('room-lobby');
        return { ok: true };
      }
      // Graceful offline/local room join simulation if server isn't configured
      if (!account.settings.serverUrl) {
        const hostBot = BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
        setActiveRoom({
          code: clean,
          format: '1v1',
          mode: 'disc-pool',
          isOnline: false,
          hostId: account.id,
          slots: [
            { team: 0, seatIndex: 0, player: { ...me, isBot: false, isLocalHuman: true, isHost: true } },
            {
              team: 1,
              seatIndex: 1,
              player: {
                id: 'room_friend_1',
                username: hostBot.username,
                avatarId: hostBot.avatarId,
                level: hostBot.level,
                isBot: true,
                isLocalHuman: false,
              },
            },
          ],
          chat: [{ id: 'sys-1', sender: 'System', text: `Joined room ${clean} (Offline Practice Mode — set Server URL in Settings for live LAN/Online rooms)`, ts: Date.now() }],
        });
        setActiveModal(null);
        setScreen('room-lobby');
        return { ok: true };
      }
      return { ok: false, error: resp.error || 'Could not join room' };
    },
    [account]
  );

  const fillRoomSlot = useCallback((seatIndex: number, type: 'bot' | 'local' | 'clear') => {
    sound.playClick();
    setActiveRoom((prev) => {
      if (!prev) return prev;
      const nextSlots = prev.slots.map((s) => {
        if (s.seatIndex !== seatIndex || seatIndex === 0) return s;
        if (type === 'clear') return { ...s, player: null };
        if (type === 'local') {
          return {
            ...s,
            player: {
              id: `local_${seatIndex}`,
              username: `Player ${seatIndex + 1}`,
              avatarId: seatIndex === 2 ? 'captain' : 'gamer',
              level: 1,
              isBot: false,
              isLocalHuman: true,
            },
          };
        }
        const bot = BOT_PROFILES[(seatIndex * 3 + Math.floor(Math.random() * 4)) % BOT_PROFILES.length];
        return {
          ...s,
          player: {
            id: `bot_${seatIndex}_${Date.now()}`,
            username: bot.username,
            avatarId: bot.avatarId,
            level: bot.level,
            isBot: true,
            isLocalHuman: false,
          },
        };
      });
      return { ...prev, slots: nextSlots };
    });
  }, []);

  const sendRoomChat = useCallback(
    (text: string) => {
      const clean = text.trim();
      if (!clean || !activeRoom) return;
      if (activeRoom.isOnline) {
        multiplayer.getSocket()?.emit('room:chat', {
          code: activeRoom.code,
          sender: account.username,
          text: clean,
        });
      } else {
        setActiveRoom((prev) =>
          prev
            ? {
                ...prev,
                chat: [...prev.chat, { id: `${Date.now()}`, sender: account.username, text: clean, ts: Date.now() }],
              }
            : prev
        );
      }
    },
    [activeRoom, account.username]
  );

  const leavePrivateRoom = useCallback(() => {
    sound.playClick();
    setActiveRoom(null);
    setScreen('friends');
    setActiveTab('friends');
  }, []);

  const startPrivateRoomMatch = useCallback(() => {
    if (!activeRoom) return;
    sound.playClick();
    const arena = getArenasByMode(activeRoom.mode)[0];
    const participants: MatchParticipant[] = activeRoom.slots.map((slot, idx) => {
      if (slot.player) {
        return {
          slotIndex: slot.seatIndex,
          team: slot.team,
          id: slot.player.id,
          username: slot.player.username,
          avatarId: slot.player.avatarId,
          level: slot.player.level,
          isBot: slot.player.isBot,
          isLocalHuman: slot.player.isLocalHuman,
          strikerId: slot.seatIndex === 0 ? account.equippedStriker : 'blaze',
        };
      }
      const fallbackBot = BOT_PROFILES[idx % BOT_PROFILES.length];
      return {
        slotIndex: slot.seatIndex,
        team: slot.team,
        id: `auto_bot_${idx}`,
        username: fallbackBot.username,
        avatarId: fallbackBot.avatarId,
        level: fallbackBot.level,
        isBot: true,
        isLocalHuman: false,
        strikerId: fallbackBot.strikerId,
      };
    });

    const mySeat = Math.max(
      0,
      participants.findIndex((p) => p.id === account.id)
    );

    const cfg: ActiveMatchConfig = {
      matchId: `rm_${Date.now()}`,
      mode: activeRoom.mode,
      format: activeRoom.format,
      arena,
      isPrivateRoom: true,
      roomCode: activeRoom.code,
      isOnlineMultiplayer: activeRoom.isOnline,
      mySeatIndex: mySeat,
      participants,
      pot: 400,
    };

    if (activeRoom.isOnline) {
      multiplayer.getSocket()?.emit('room:start', { code: activeRoom.code, matchConfig: cfg });
    }
    setActiveMatch(cfg);
    setScreen('game');
  }, [activeRoom, account]);

  const startArenaMatch = useCallback(
    (arena: ArenaDef): boolean => {
      if (account.coins < arena.entryFee) {
        showToast(`Need ${arena.entryFee} Coins to enter ${arena.city} ${arena.subtitle}!`);
        return false;
      }
      sound.playClick();
      mutateAccount((prev) => ({ ...prev, coins: prev.coins - arena.entryFee }));

      const bot = BOT_PROFILES[Math.floor(Math.random() * BOT_PROFILES.length)];
      const cfg: ActiveMatchConfig = {
        matchId: `m_${Date.now()}`,
        mode: arena.mode,
        format: '1v1',
        arena,
        isPrivateRoom: false,
        isOnlineMultiplayer: false,
        mySeatIndex: 0,
        pot: arena.reward,
        participants: [
          {
            slotIndex: 0,
            team: 0,
            id: account.id,
            username: account.username,
            avatarId: account.avatarId,
            level: account.level,
            isBot: false,
            isLocalHuman: true,
            strikerId: account.equippedStriker,
          },
          {
            slotIndex: 1,
            team: 1,
            id: `bot_${Date.now()}`,
            username: bot.username,
            avatarId: bot.avatarId,
            level: bot.level,
            isBot: true,
            isLocalHuman: false,
            strikerId: bot.strikerId,
          },
        ],
      };

      setActiveMatch(cfg);
      setScreen('game');
      return true;
    },
    [account, mutateAccount, showToast]
  );

  const completeMatch = useCallback(
    ({ won, pucksPotted, queensCovered }: { won: boolean; pucksPotted: number; queensCovered: number }) => {
      if (!activeMatch) return;
      const potBonus =
        won && !activeMatch.isPrivateRoom
          ? Math.round(activeMatch.pot * (account.collectionLevel >= 5 ? 1.1 : 1))
          : won && activeMatch.isPrivateRoom
            ? 200
            : 0;

      mutateAccount((prev) => {
        const nextXp = prev.xp + (won ? 45 : 15);
        const xpForNext = prev.level * 100;
        const levelUp = nextXp >= xpForNext;
        const nextStreak = won ? prev.stats.winStreak + 1 : 0;

        // Award Victory Chest in an empty slot on win!
        const nextChests = [...prev.chests];
        if (won) {
          const emptyIdx = nextChests.findIndex((c) => c === null);
          if (emptyIdx >= 0) {
            const tier: ChestSlot['tier'] =
              activeMatch.arena.entryFee >= 2000
                ? 'gold'
                : activeMatch.arena.entryFee >= 500
                  ? 'silver'
                  : 'wood';
            nextChests[emptyIdx] = {
              id: `ch_${Date.now()}`,
              tier,
              name: tier === 'gold' ? 'Gold Chest' : tier === 'silver' ? 'Silver Chest' : 'Victory Chest',
              durationSec: tier === 'gold' ? 45 : tier === 'silver' ? 25 : 10,
              unlockStartedAt: null,
              sourceArena: `${activeMatch.arena.city} ${activeMatch.arena.subtitle}`,
            };
          }
        }

        return {
          ...prev,
          coins: prev.coins + potBonus,
          level: levelUp ? prev.level + 1 : prev.level,
          xp: levelUp ? nextXp - xpForNext : nextXp,
          chests: nextChests,
          stats: {
            gamesPlayed: prev.stats.gamesPlayed + 1,
            gamesWon: prev.stats.gamesWon + (won ? 1 : 0),
            winStreak: nextStreak,
            bestStreak: Math.max(prev.stats.bestStreak, nextStreak),
            totalCoinsWon: prev.stats.totalCoinsWon + potBonus,
            pucksPotted: prev.stats.pucksPotted + pucksPotted,
            queensCovered: prev.stats.queensCovered + queensCovered,
          },
        };
      });
    },
    [activeMatch, account.collectionLevel, mutateAccount]
  );

  const exitMatch = useCallback(() => {
    sound.playClick();
    const wasPrivate = activeMatch?.isPrivateRoom;
    setActiveMatch(null);
    if (wasPrivate && activeRoom) {
      setScreen('room-lobby');
    } else {
      setScreen('home');
      setActiveTab('home');
    }
  }, [activeMatch, activeRoom]);

  return (
    <GameContext.Provider
      value={{
        account,
        screen,
        activeTab,
        selectedMode,
        activeModal,
        activeRoom,
        activeMatch,
        chestReveal,
        toastMessage,
        serverConnected,
        setScreen,
        goToTab,
        openModeStages,
        setActiveModal,
        showToast,
        clearChestReveal: () => setChestReveal(null),
        updateProfile,
        registerAccount,
        loginAccount,
        logoutToGuest,
        updateSettings,
        resetProgress,
        equipStriker,
        upgradeStriker,
        equipCosmetic,
        buyCosmetic,
        startChestUnlock,
        openChestNow,
        buyShopChest,
        buyCoinPack,
        claimFreeGemPack,
        claimDailyReward,
        claimHourlyGift,
        grantSpinReward,
        grantLuckyShotReward,
        claimEventReward,
        addFriendByName,
        sendGiftToFriend,
        claimFriendGift,
        claimInboxMessage,
        createPrivateRoom,
        joinPrivateRoom,
        fillRoomSlot,
        sendRoomChat,
        leavePrivateRoom,
        startPrivateRoomMatch,
        startArenaMatch,
        completeMatch,
        exitMatch,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error('useGame must be used inside GameProvider');
  return ctx;
}
