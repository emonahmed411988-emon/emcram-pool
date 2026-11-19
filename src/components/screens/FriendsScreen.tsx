import React, { useState } from 'react';
import { Search, UserPlus, Users, Pencil, Gift, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { BottomNav } from '../BottomNav';
import { AvatarArt } from '../AvatarArt';
import { CoinIcon, GemIcon } from '../StrikerArt';
import { sound } from '../../engine/sound';

type FriendsSubTab = 'challenge' | 'gifts' | 'inbox';

export const FriendsScreen: React.FC = () => {
  const {
    account,
    setActiveModal,
    sendGiftToFriend,
    claimFriendGift,
    claimInboxMessage,
    createPrivateRoom,
    showToast,
  } = useGame();

  const [subTab, setSubTab] = useState<FriendsSubTab>('challenge');
  const [search, setSearch] = useState('');

  const unreadInbox = account.inbox.filter((m) => !m.read).length;
  const unclaimedGifts = account.gifts.filter((g) => !g.claimed).length;

  const filteredFriends = account.friends.filter((f) =>
    f.username.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleInviteShare = () => {
    sound.playClick();
    const shareText = `Play Carrom Pool with me! Add my ID: ${account.playerCode} (${account.username})`;
    if (navigator.share) {
      navigator.share({ title: 'Carrom Pool', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText).catch(() => {});
      showToast('Invite link & Player ID copied to clipboard!');
    }
  };

  return (
    <div className="flex flex-col h-full w-full btn-crimson-bg relative overflow-hidden">
      <TopBar title="Friends" />

      {/* 3 Sub-Tabs: Challenge / Gifts / Inbox (Exact match to Screenshot 6!) */}
      <div className="grid grid-cols-3 gap-1.5 px-2.5 pt-2 bg-[#4a1c12] border-b-2 border-[#753820]">
        {(
          [
            { id: 'challenge', label: 'Challenge', badge: 0 },
            { id: 'gifts', label: 'Gifts', badge: unclaimedGifts },
            { id: 'inbox', label: 'Inbox', badge: unreadInbox },
          ] as const
        ).map((tab) => {
          const active = subTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                sound.playClick();
                setSubTab(tab.id);
              }}
              className={`relative py-2 rounded-t-xl text-sm font-extrabold border-t border-x transition-colors ${
                active
                  ? 'bg-[#8f502a] text-white border-[#cf935c] -mb-[2px]'
                  : 'bg-[#4f2014] text-amber-200/80 border-[#38140b]'
              }`}
            >
              {tab.label}
              {tab.badge ? (
                <span className="absolute -top-2 -right-1 w-5 h-5 rounded-full bg-red-600 border-2 border-white text-[10px] font-black text-white flex items-center justify-center shadow">
                  {tab.id === 'inbox' ? '!' : tab.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Challenge Sub-tab (Exact layout of Screenshot 6!) */}
      {subTab === 'challenge' && (
        <>
          <div className="px-2.5 py-2.5 bg-[#663119] border-b-2 border-[#3d170a] space-y-2 shadow-md">
            {/* Private room banner + Create Room + Join Room */}
            <div className="wood-recessed rounded-xl p-2 flex items-center justify-between gap-2 border border-[#8f542a]">
              <p className="text-[11px] font-bold text-amber-100 leading-tight max-w-[105px]">
                Private room with up to 4 friends
              </p>
              <div className="flex items-center gap-1.5 flex-1">
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveModal('create-room');
                  }}
                  className="btn-green flex-1 py-2 px-2 rounded-lg text-[13px] font-extrabold text-white text-stroke-sm whitespace-nowrap"
                >
                  Create Room
                </button>
                <button
                  onClick={() => {
                    sound.playClick();
                    setActiveModal('join-room');
                  }}
                  className="btn-gold flex-1 py-2 px-2 rounded-lg text-[13px] font-extrabold text-white text-stroke-sm whitespace-nowrap"
                >
                  Join Room
                </button>
              </div>
            </div>

            {/* Search bar + Invite friends + Add Friend + Edit */}
            <div className="flex items-center gap-1.5">
              <div className="flex-1 wood-recessed rounded-lg px-2 py-1.5 flex items-center gap-1.5 border border-[#804824]">
                <Search className="w-4 h-4 text-amber-200/70 shrink-0" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search list..."
                  className="w-full bg-transparent text-xs text-white placeholder-amber-200/50 outline-none select-text"
                />
              </div>

              <button
                onClick={handleInviteShare}
                className="btn-blue px-2 py-1 rounded-lg flex items-center gap-1 text-[10px] font-extrabold text-white leading-tight shrink-0"
              >
                <Users className="w-4 h-4 shrink-0" />
                <span className="text-left">
                  Invite
                  <br />
                  friends
                </span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveModal('add-friend');
                }}
                className="btn-orange px-2.5 py-2 rounded-lg flex items-center gap-1 text-[11px] font-extrabold text-white shrink-0"
              >
                <UserPlus className="w-4 h-4 shrink-0" />
                <span>Add Friend</span>
              </button>

              <button
                onClick={() => {
                  sound.playClick();
                  setActiveModal('profile');
                }}
                className="btn-blue w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                title="Edit Profile"
              >
                <Pencil className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>

          {/* Friends List Area */}
          <div className="flex-1 overflow-y-auto game-scroll p-3">
            {filteredFriends.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center px-6">
                <p className="text-[20px] font-extrabold text-white text-stroke-md leading-snug">
                  You still haven&apos;t added any
                  <br />
                  friends!
                </p>
                <p className="text-xs text-amber-200/75 mt-2">
                  Tap <b>Add Friend</b> above or create a Private Room to invite players.
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFriends.map((f) => (
                  <div
                    key={f.id}
                    className="rounded-xl bg-[#541911]/90 border border-[#a85c34] p-2.5 flex items-center justify-between gap-2 shadow"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <AvatarArt avatarId={f.avatarId} size={44} level={f.level} />
                      <div className="min-w-0">
                        <div className="text-sm font-extrabold text-white truncate">{f.username}</div>
                        <div className="flex items-center gap-1.5 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-green-400" />
                          <span className="text-green-300 font-semibold">Online</span>
                          <span className="text-amber-200/60">• {f.playerCode}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() => sendGiftToFriend(f.id)}
                        className="btn-gold px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-amber-950 flex items-center gap-1"
                      >
                        <Gift className="w-3.5 h-3.5" /> Gift
                      </button>
                      <button
                        onClick={() => createPrivateRoom('1v1', 'disc-pool')}
                        className="btn-green px-2.5 py-1.5 rounded-lg text-[11px] font-extrabold text-white text-stroke-sm"
                      >
                        Challenge
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Gifts Sub-Tab */}
      {subTab === 'gifts' && (
        <div className="flex-1 overflow-y-auto game-scroll p-3 space-y-2.5">
          <div className="text-xs font-bold text-amber-200/80 mb-1">
            Free Coin Gifts from Friends & Club
          </div>
          {account.gifts.map((g) => (
            <div
              key={g.id}
              className="rounded-xl bg-[#541911]/90 border border-[#a85c34] p-3 flex items-center justify-between gap-2"
            >
              <div className="flex items-center gap-2.5">
                <AvatarArt avatarId={g.fromAvatar} size={42} />
                <div>
                  <div className="text-sm font-extrabold text-white">{g.fromName}</div>
                  <div className="flex items-center gap-1 text-xs font-bold text-yellow-300">
                    <CoinIcon size={15} /> +{g.coins} Free Coins
                  </div>
                </div>
              </div>
              <button
                onClick={() => claimFriendGift(g.id)}
                disabled={g.claimed}
                className={`px-3 py-1.5 rounded-lg text-xs font-extrabold ${
                  g.claimed
                    ? 'bg-black/35 text-amber-200/50'
                    : 'btn-green text-white text-stroke-sm'
                }`}
              >
                {g.claimed ? 'Claimed' : 'Collect'}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Inbox Sub-Tab */}
      {subTab === 'inbox' && (
        <div className="flex-1 overflow-y-auto game-scroll p-3 space-y-2.5">
          {account.inbox.map((m) => (
            <div
              key={m.id}
              className="rounded-xl bg-[#541911]/90 border border-[#a85c34] p-3 space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-sm font-extrabold text-yellow-300">{m.title}</div>
                  <p className="text-xs text-amber-100/90 mt-0.5 leading-snug">{m.body}</p>
                </div>
                {!m.read && <span className="w-2.5 h-2.5 rounded-full bg-red-500 shrink-0 mt-1" />}
              </div>

              {(m.rewardCoins || m.rewardGems) && (
                <div className="flex items-center justify-between pt-1 border-t border-white/10">
                  <div className="flex items-center gap-3 text-xs font-extrabold text-white">
                    {m.rewardCoins && (
                      <span className="flex items-center gap-1">
                        <CoinIcon size={16} /> +{m.rewardCoins}
                      </span>
                    )}
                    {m.rewardGems && (
                      <span className="flex items-center gap-1">
                        <GemIcon size={16} /> +{m.rewardGems}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => claimInboxMessage(m.id)}
                    disabled={m.read}
                    className={`px-3 py-1 rounded-lg text-xs font-extrabold flex items-center gap-1 ${
                      m.read ? 'bg-black/30 text-amber-200/60' : 'btn-green text-white text-stroke-sm'
                    }`}
                  >
                    {m.read ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Claimed
                      </>
                    ) : (
                      'Claim'
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <BottomNav />
    </div>
  );
};
