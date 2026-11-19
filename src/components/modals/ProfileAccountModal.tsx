import React, { useState } from 'react';
import { X, ShieldCheck, LogOut, Copy, Trophy, Flame } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { AVATARS } from '../../data/avatars';
import { AvatarArt } from '../AvatarArt';
import { formatNumberSpaced, listSavedLocalAccounts } from '../../services/storage';
import { sound } from '../../engine/sound';

export const ProfileAccountModal: React.FC = () => {
  const {
    account,
    setActiveModal,
    updateProfile,
    registerAccount,
    loginAccount,
    logoutToGuest,
    showToast,
  } = useGame();

  const [tab, setTab] = useState<'profile' | 'account'>('profile');
  const [authMode, setAuthMode] = useState<'register' | 'login'>('register');
  const [editName, setEditName] = useState(account.username);
  const [editAvatar, setEditAvatar] = useState(account.avatarId);

  const [regUser, setRegUser] = useState(account.isGuest ? '' : account.username);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const savedAccounts = listSavedLocalAccounts();
  const winRate =
    account.stats.gamesPlayed > 0
      ? Math.round((account.stats.gamesWon / account.stats.gamesPlayed) * 100)
      : 0;

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    const res =
      authMode === 'register'
        ? await registerAccount(regUser || editName, email, password)
        : await loginAccount(email, password);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Authentication failed');
    } else {
      setTab('profile');
      setPassword('');
    }
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl w-full max-w-[355px] max-h-[88%] flex flex-col relative animate-pop">
        <button
          onClick={() => {
            sound.playClick();
            setActiveModal(null);
          }}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-lg z-10"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        {/* Tabs */}
        <div className="grid grid-cols-2 gap-1.5 p-3 pb-0">
          <button
            onClick={() => setTab('profile')}
            className={`py-2 rounded-xl text-xs font-extrabold ${
              tab === 'profile' ? 'btn-gold text-amber-950' : 'bg-black/30 text-amber-200'
            }`}
          >
            Profile &amp; Stats
          </button>
          <button
            onClick={() => setTab('account')}
            className={`py-2 rounded-xl text-xs font-extrabold ${
              tab === 'account' ? 'btn-green text-white text-stroke-sm' : 'bg-black/30 text-amber-200'
            }`}
          >
            {account.isGuest ? 'Create / Sign In' : 'Account Sync'}
          </button>
        </div>

        <div className="p-4 overflow-y-auto game-scroll space-y-3">
          {tab === 'profile' ? (
            <>
              {/* Identity Header */}
              <div className="flex items-center gap-3 bg-black/30 rounded-xl p-3 border border-amber-500/30">
                <AvatarArt avatarId={editAvatar} size={62} level={account.level} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-base font-black text-white truncate">{account.username}</span>
                    {!account.isGuest && <ShieldCheck className="w-4 h-4 text-lime-400 shrink-0" />}
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-200 mt-0.5">
                    <span>ID: {account.playerCode}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard?.writeText(account.playerCode).catch(() => {});
                        showToast('Player ID copied!');
                      }}
                      className="text-yellow-300 hover:text-white"
                    >
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                  <span
                    className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black ${
                      account.isGuest
                        ? 'bg-amber-900 text-amber-200'
                        : 'bg-emerald-800 text-lime-200'
                    }`}
                  >
                    {account.isGuest ? 'GUEST ACCOUNT' : `LINKED • ${account.email}`}
                  </span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="wood-recessed rounded-xl p-2">
                  <div className="text-base font-black text-white">{account.stats.gamesPlayed}</div>
                  <div className="text-[10px] font-bold text-amber-200/80">Matches</div>
                </div>
                <div className="wood-recessed rounded-xl p-2">
                  <div className="text-base font-black text-lime-400 flex items-center justify-center gap-0.5">
                    <Trophy className="w-3.5 h-3.5" /> {winRate}%
                  </div>
                  <div className="text-[10px] font-bold text-amber-200/80">Win Rate</div>
                </div>
                <div className="wood-recessed rounded-xl p-2">
                  <div className="text-base font-black text-orange-400 flex items-center justify-center gap-0.5">
                    <Flame className="w-3.5 h-3.5" /> {account.stats.bestStreak}
                  </div>
                  <div className="text-[10px] font-bold text-amber-200/80">Best Streak</div>
                </div>
              </div>

              <div className="text-[11px] text-center text-amber-200 font-bold">
                Total Winnings: {formatNumberSpaced(account.stats.totalCoinsWon)} Coins • Pucks Potted:{' '}
                {account.stats.pucksPotted}
              </div>

              {/* Edit Name & Avatar */}
              <div className="space-y-2 pt-2 border-t border-white/15">
                <label className="text-xs font-extrabold text-yellow-300 block">
                  Display Name &amp; Avatar
                </label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={18}
                  className="w-full wood-recessed rounded-xl px-3 py-2 text-sm font-bold text-white outline-none border border-[#a86939] select-text"
                />
                <div className="grid grid-cols-4 gap-2 pt-1">
                  {AVATARS.map((av) => (
                    <button
                      key={av.id}
                      onClick={() => {
                        sound.playClick();
                        setEditAvatar(av.id);
                      }}
                      className={`p-1 rounded-xl flex flex-col items-center gap-0.5 border-2 ${
                        editAvatar === av.id
                          ? 'border-lime-400 bg-lime-900/40'
                          : 'border-transparent bg-black/25'
                      }`}
                    >
                      <AvatarArt avatarId={av.id} size={46} />
                      <span className="text-[9px] font-bold text-amber-100 truncate w-full text-center">
                        {av.label}
                      </span>
                    </button>
                  ))}
                </div>
                <button
                  onClick={() => updateProfile(editName, editAvatar)}
                  className="btn-green w-full py-2 rounded-xl text-sm font-extrabold text-white text-stroke-sm"
                >
                  Save Profile
                </button>
              </div>
            </>
          ) : (
            <>
              {!account.isGuest ? (
                <div className="space-y-3 text-center">
                  <div className="bg-emerald-950/70 border border-lime-400/50 rounded-xl p-3">
                    <ShieldCheck className="w-9 h-9 text-lime-400 mx-auto mb-1" />
                    <div className="text-sm font-extrabold text-white">Account Protected!</div>
                    <div className="text-xs text-lime-200 mt-0.5">{account.email}</div>
                    <p className="text-[11px] text-amber-100/80 mt-1">
                      Your coins, gems, strikers, and stats are saved safely under your account.
                    </p>
                  </div>

                  <button
                    onClick={logoutToGuest}
                    className="w-full py-2.5 rounded-xl bg-red-700/85 border border-red-400/60 text-xs font-extrabold text-white flex items-center justify-center gap-1.5"
                  >
                    <LogOut className="w-4 h-4" /> Sign Out / Switch Account
                  </button>
                </div>
              ) : (
                <>
                  <div className="bg-emerald-900/55 border border-lime-400/50 rounded-xl p-2.5 text-center">
                    <div className="text-xs font-extrabold text-lime-300">
                      Create Account Bonus: +1,000 Coins &amp; +10 Gems!
                    </div>
                    <p className="text-[10px] text-amber-100/85">
                      Saves your Guest progress and syncs with multiplayer server when connected.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      onClick={() => {
                        setAuthMode('register');
                        setError('');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-extrabold ${
                        authMode === 'register' ? 'bg-amber-500 text-amber-950' : 'bg-black/30 text-amber-200'
                      }`}
                    >
                      Create Account
                    </button>
                    <button
                      onClick={() => {
                        setAuthMode('login');
                        setError('');
                      }}
                      className={`py-1.5 rounded-lg text-xs font-extrabold ${
                        authMode === 'login' ? 'bg-amber-500 text-amber-950' : 'bg-black/30 text-amber-200'
                      }`}
                    >
                      Sign In
                    </button>
                  </div>

                  <form onSubmit={handleAuthSubmit} className="space-y-2.5">
                    {authMode === 'register' && (
                      <input
                        value={regUser}
                        onChange={(e) => setRegUser(e.target.value)}
                        placeholder="Choose Username (e.g. Dhaka_Pro)"
                        required
                        className="w-full wood-recessed rounded-xl px-3 py-2 text-xs text-white outline-none border border-[#a86939] select-text"
                      />
                    )}
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email address"
                      required
                      className="w-full wood-recessed rounded-xl px-3 py-2 text-xs text-white outline-none border border-[#a86939] select-text"
                    />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password (min 4 chars)"
                      required
                      className="w-full wood-recessed rounded-xl px-3 py-2 text-xs text-white outline-none border border-[#a86939] select-text"
                    />

                    {error && <p className="text-xs font-bold text-red-300 text-center">{error}</p>}

                    <button
                      type="submit"
                      disabled={busy}
                      className="btn-green w-full py-2.5 rounded-xl text-sm font-extrabold text-white text-stroke-sm"
                    >
                      {busy
                        ? 'Please wait...'
                        : authMode === 'register'
                          ? 'Create Account & Claim Bonus'
                          : 'Sign In'}
                    </button>
                  </form>

                  {savedAccounts.length > 0 && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-[10px] font-bold text-amber-200 mb-1">
                        Saved accounts on this device:
                      </div>
                      <div className="space-y-1">
                        {savedAccounts.map((sa) => (
                          <button
                            key={sa.email}
                            onClick={() => {
                              setAuthMode('login');
                              setEmail(sa.email);
                            }}
                            className="w-full text-left px-2.5 py-1.5 rounded-lg bg-black/30 text-[11px] flex justify-between"
                          >
                            <span className="font-bold text-white">{sa.username}</span>
                            <span className="text-amber-300">{sa.email}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
