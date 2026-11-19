import React, { useMemo, useState } from 'react';
import { X, Volume2, VolumeX, Smartphone, Server, Check, UserPlus, Trash2, Trophy } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { DAILY_REWARD_TRACK, LEADERBOARD_SEED } from '../../data/events';
import { BOT_PROFILES } from '../../data/avatars';
import { CoinIcon, GemIcon } from '../StrikerArt';
import { AvatarArt } from '../AvatarArt';
import { formatNumberSpaced } from '../../services/storage';
import { sound } from '../../engine/sound';

export const FreeRewardsModal: React.FC = () => {
  const { account, setActiveModal, claimDailyReward, claimFreeGemPack } = useGame();
  const curDay = account.dailyRewards.dayIndex;

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[345px] relative animate-pop space-y-3">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-xl font-black text-yellow-300 text-stroke-sm text-center">
          Free Daily Rewards
        </h2>

        <div className="grid grid-cols-3 gap-2">
          {DAILY_REWARD_TRACK.map((item, i) => {
            const claimed = i < curDay;
            const isToday = i === curDay;
            return (
              <div
                key={item.day}
                className={`rounded-xl p-2 text-center border-2 flex flex-col items-center justify-between ${
                  i === 6 ? 'col-span-3 flex-row px-4 py-2.5' : ''
                } ${
                  isToday
                    ? 'bg-emerald-800/80 border-lime-400 animate-glow'
                    : claimed
                      ? 'bg-black/35 border-white/10 opacity-65'
                      : 'bg-[#5c2c12] border-[#a86939]'
                }`}
              >
                <span className="text-[10px] font-black text-amber-200">DAY {item.day}</span>
                <div className="flex items-center justify-center gap-1 my-1">
                  <CoinIcon size={20} />
                  {item.gems > 0 && <GemIcon size={18} />}
                </div>
                <span className="text-[11px] font-extrabold text-white">{item.label}</span>
              </div>
            );
          })}
        </div>

        <button
          onClick={claimDailyReward}
          className="btn-green w-full py-2.5 rounded-xl text-sm font-extrabold text-white text-stroke-sm"
        >
          Collect Day {curDay + 1} Reward
        </button>

        <button
          onClick={claimFreeGemPack}
          className="btn-gold w-full py-2 rounded-xl text-xs font-extrabold text-amber-950"
        >
          Instant Bonus Refill (+1,000 Coins &amp; +15 Gems)
        </button>
      </div>
    </div>
  );
};

export const LeaderboardModal: React.FC = () => {
  const { account, setActiveModal } = useGame();

  const rows = useMemo(() => {
    const merged = [
      ...LEADERBOARD_SEED,
      {
        username: account.username,
        country: 'YOU',
        avatarId: account.avatarId,
        winnings: account.stats.totalCoinsWon,
        level: account.level,
      },
    ];
    merged.sort((a, b) => b.winnings - a.winnings);
    return merged;
  }, [account]);

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[350px] max-h-[82%] flex flex-col relative animate-pop">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-3">
          <Trophy className="w-5 h-5 text-yellow-300" />
          <h2 className="text-xl font-black text-yellow-300 text-stroke-sm">Weekly League</h2>
        </div>

        <div className="flex-1 overflow-y-auto game-scroll space-y-1.5 pr-1">
          {rows.map((r, idx) => {
            const isMe = r.country === 'YOU';
            return (
              <div
                key={`${r.username}-${idx}`}
                className={`rounded-xl px-2.5 py-2 flex items-center justify-between border ${
                  isMe
                    ? 'bg-emerald-900/75 border-lime-400'
                    : 'bg-black/30 border-white/10'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span
                    className={`w-6 text-center text-sm font-black ${
                      idx === 0
                        ? 'text-yellow-300'
                        : idx === 1
                          ? 'text-zinc-200'
                          : idx === 2
                            ? 'text-amber-400'
                            : 'text-amber-200/70'
                    }`}
                  >
                    #{idx + 1}
                  </span>
                  <AvatarArt avatarId={r.avatarId} size={36} level={r.level} />
                  <div className="min-w-0">
                    <div className="text-xs font-extrabold text-white truncate">{r.username}</div>
                    <div className="text-[10px] text-amber-200/75">{r.country}</div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-xs font-black text-yellow-300 shrink-0">
                  <CoinIcon size={15} /> {formatNumberSpaced(r.winnings)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const SettingsModal: React.FC = () => {
  const { account, serverConnected, setActiveModal, updateSettings, resetProgress } = useGame();
  const [urlInput, setUrlInput] = useState(account.settings.serverUrl);

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[340px] relative animate-pop space-y-3">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-xl font-black text-yellow-300 text-stroke-sm text-center">Settings</h2>

        <div className="space-y-2">
          <button
            onClick={() => updateSettings({ sfx: !account.settings.sfx })}
            className="w-full wood-recessed rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white"
          >
            <span className="flex items-center gap-2">
              {account.settings.sfx ? <Volume2 className="w-4 h-4 text-lime-400" /> : <VolumeX className="w-4 h-4 text-red-400" />}
              Sound Effects
            </span>
            <span className={account.settings.sfx ? 'text-lime-400' : 'text-red-400'}>
              {account.settings.sfx ? 'ON' : 'OFF'}
            </span>
          </button>

          <button
            onClick={() => updateSettings({ vibration: !account.settings.vibration })}
            className="w-full wood-recessed rounded-xl px-3.5 py-2.5 flex items-center justify-between text-xs font-extrabold text-white"
          >
            <span className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-sky-400" /> Haptic Vibration
            </span>
            <span className={account.settings.vibration ? 'text-lime-400' : 'text-red-400'}>
              {account.settings.vibration ? 'ON' : 'OFF'}
            </span>
          </button>

          <div className="wood-recessed rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between text-xs font-extrabold text-amber-100">
              <span className="flex items-center gap-1.5">
                <Server className="w-4 h-4 text-yellow-300" /> Online Multiplayer Server
              </span>
              <span
                className={`text-[10px] px-1.5 py-0.5 rounded font-black ${
                  serverConnected ? 'bg-green-600 text-white' : 'bg-zinc-700 text-zinc-200'
                }`}
              >
                {serverConnected ? 'CONNECTED' : 'OFFLINE MODE'}
              </span>
            </div>
            <input
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              placeholder="http://192.168.1.5:3001 (optional)"
              className="w-full bg-black/40 border border-amber-700/60 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none select-text"
            />
            <button
              onClick={() => {
                sound.playClick();
                updateSettings({ serverUrl: urlInput.trim() });
              }}
              className="btn-blue w-full py-1.5 rounded-lg text-xs font-extrabold text-white"
            >
              Save Server URL
            </button>
          </div>
        </div>

        <div className="pt-2 border-t border-white/15 flex gap-2">
          <button
            onClick={() => setActiveModal('profile')}
            className="btn-gold flex-1 py-2 rounded-xl text-xs font-extrabold text-amber-950"
          >
            Manage Account
          </button>
          <button
            onClick={resetProgress}
            className="px-3 py-2 rounded-xl bg-red-800/80 border border-red-400/40 text-xs font-extrabold text-white flex items-center gap-1"
          >
            <Trash2 className="w-3.5 h-3.5" /> Reset
          </button>
        </div>
      </div>
    </div>
  );
};

export const AddFriendModal: React.FC = () => {
  const { addFriendByName, setActiveModal } = useGame();
  const [name, setName] = useState('');

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[335px] relative animate-pop space-y-3">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-lg font-black text-yellow-300 text-stroke-sm text-center">
          Add Friend
        </h2>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!name.trim()) return;
            addFriendByName(name);
            setName('');
          }}
          className="flex gap-1.5"
        >
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Username or CP-ID..."
            className="flex-1 wood-recessed rounded-xl px-3 py-2 text-xs text-white outline-none border border-[#a86939] select-text"
          />
          <button type="submit" className="btn-green px-3.5 rounded-xl text-xs font-extrabold text-white">
            Add
          </button>
        </form>

        <div>
          <div className="text-[11px] font-bold text-amber-200 mb-1.5">Suggested Online Players</div>
          <div className="space-y-1.5 max-h-48 overflow-y-auto game-scroll">
            {BOT_PROFILES.slice(0, 5).map((b) => (
              <div
                key={b.username}
                className="bg-black/30 rounded-xl px-2.5 py-1.5 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <AvatarArt avatarId={b.avatarId} size={34} level={b.level} />
                  <span className="text-xs font-extrabold text-white">{b.username}</span>
                </div>
                <button
                  onClick={() => addFriendByName(b.username)}
                  className="btn-orange px-2.5 py-1 rounded-lg text-[11px] font-extrabold text-white flex items-center gap-1"
                >
                  <UserPlus className="w-3 h-3" /> Add
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export const MailModal: React.FC = () => {
  const { account, setActiveModal, claimInboxMessage } = useGame();

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[340px] relative animate-pop space-y-2.5">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <h2 className="text-lg font-black text-yellow-300 text-stroke-sm text-center">Mailbox</h2>

        <div className="space-y-2 max-h-64 overflow-y-auto game-scroll">
          {account.inbox.map((m) => (
            <div key={m.id} className="bg-black/35 rounded-xl p-3 space-y-2 border border-white/10">
              <div className="text-xs font-extrabold text-yellow-300">{m.title}</div>
              <p className="text-[11px] text-amber-100">{m.body}</p>
              {(m.rewardCoins || m.rewardGems) && (
                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2 text-xs font-bold text-white">
                    {m.rewardCoins && (
                      <span className="flex items-center gap-1">
                        <CoinIcon size={14} /> +{m.rewardCoins}
                      </span>
                    )}
                    {m.rewardGems && (
                      <span className="flex items-center gap-1">
                        <GemIcon size={14} /> +{m.rewardGems}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => claimInboxMessage(m.id)}
                    disabled={m.read}
                    className={`px-3 py-1 rounded-lg text-[11px] font-extrabold flex items-center gap-1 ${
                      m.read ? 'bg-black/40 text-amber-200/50' : 'btn-green text-white'
                    }`}
                  >
                    {m.read ? (
                      <>
                        <Check className="w-3 h-3" /> Claimed
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
      </div>
    </div>
  );
};
