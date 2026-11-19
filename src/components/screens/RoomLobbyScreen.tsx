import React, { useState } from 'react';
import { ArrowLeft, MessageSquare, Share2, Bot, User, X, Send } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { TopBar } from '../TopBar';
import { AvatarArt } from '../AvatarArt';
import { sound } from '../../engine/sound';

export const RoomLobbyScreen: React.FC = () => {
  const {
    activeRoom,
    leavePrivateRoom,
    fillRoomSlot,
    startPrivateRoomMatch,
    sendRoomChat,
    showToast,
  } = useGame();

  const [slotPicker, setSlotPicker] = useState<number | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatText, setChatText] = useState('');

  if (!activeRoom) return null;

  const team0Slots = activeRoom.slots.filter((s) => s.team === 0);
  const team1Slots = activeRoom.slots.filter((s) => s.team === 1);
  const hasAnyOpponent = team1Slots.some((s) => s.player !== null);

  const handleShareCode = () => {
    sound.playClick();
    const txt = `Join my Carrom Pool ${activeRoom.format} ${
      activeRoom.mode === 'disc-pool' ? 'Disc Pool' : 'Carrom'
    } room! Room Code: ${activeRoom.code}`;
    if (navigator.share) {
      navigator.share({ title: 'Carrom Pool Private Room', text: txt }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(activeRoom.code).catch(() => {});
      showToast(`Room Code ${activeRoom.code} copied!`);
    }
  };

  const handleQuickFillBots = () => {
    activeRoom.slots.forEach((s) => {
      if (!s.player && s.seatIndex !== 0) {
        fillRoomSlot(s.seatIndex, 'bot');
      }
    });
    showToast('Invited players joined empty slots!');
  };

  return (
    <div className="flex flex-col h-full w-full btn-crimson-bg relative overflow-hidden">
      <TopBar compactCurrencyOnly />

      {/* Room Code Header (Exact match to Screenshot 2!) */}
      <div className="px-4 pt-3 pb-2 text-center">
        <h2 className="text-lg font-extrabold text-white text-stroke-sm mb-2">Room Code</h2>
        <div className="flex items-center justify-center gap-3">
          <div className="wood-recessed px-6 py-2 rounded-xl border border-[#8f502a] text-[20px] font-black tracking-[0.18em] text-white">
            {activeRoom.code}
          </div>
          <button
            onClick={handleShareCode}
            className="btn-gold px-5 py-2 rounded-xl text-[16px] font-extrabold text-white text-stroke-sm flex items-center gap-2"
          >
            <span>Share</span>
            <Share2 className="w-4 h-4 stroke-[2.8]" />
          </button>
        </div>
        <p className="text-xs font-bold text-amber-100/90 mt-2">
          Share this code to play with your friends!
        </p>
      </div>

      {/* Team Columns + Center VS & Invite (Exact match to Screenshot 2!) */}
      <div className="flex-1 px-3 py-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
        {/* Your Team */}
        <div className="flex flex-col items-center h-full max-h-[370px]">
          <span className="text-sm font-extrabold text-white text-stroke-sm mb-1.5">Your Team</span>
          <div className="w-full flex-1 rounded-xl bg-black/25 border border-white/15 flex flex-col items-center justify-around py-3 px-2">
            {team0Slots.map((slot) => (
              <button
                key={slot.seatIndex}
                onClick={() => slot.seatIndex !== 0 && setSlotPicker(slot.seatIndex)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <AvatarArt
                  avatarId={slot.player?.avatarId || 'guest'}
                  size={74}
                  level={slot.player?.level}
                  isEmptySlot={!slot.player}
                />
                <span className="text-[11px] font-bold text-white max-w-[100px] truncate">
                  {slot.player ? slot.player.username : 'Tap to Add'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Center VS & Invite */}
        <div className="flex flex-col items-center justify-center gap-2 px-1">
          <div
            className="text-[36px] font-black italic leading-none tracking-tight"
            style={{
              background: 'linear-gradient(180deg, #fff59d 0%, #facc15 55%, #d97706 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              filter: 'drop-shadow(0 3px 0 #78350f)',
            }}
          >
            VS
          </div>
          <button
            onClick={handleQuickFillBots}
            className="btn-green px-5 py-1.5 rounded-lg text-sm font-extrabold text-white text-stroke-sm"
          >
            Invite
          </button>
          <span className="text-[9px] text-amber-200/75 text-center max-w-[80px] leading-tight">
            {activeRoom.isOnline ? 'Online Room Live' : 'Tap ? slot for Bot / Pass-n-Play'}
          </span>
        </div>

        {/* Opponents */}
        <div className="flex flex-col items-center h-full max-h-[370px]">
          <span className="text-sm font-extrabold text-white text-stroke-sm mb-1.5">Opponents</span>
          <div className="w-full flex-1 rounded-xl bg-black/25 border border-white/15 flex flex-col items-center justify-around py-3 px-2">
            {team1Slots.map((slot) => (
              <button
                key={slot.seatIndex}
                onClick={() => setSlotPicker(slot.seatIndex)}
                className="flex flex-col items-center gap-1.5 active:scale-95 transition-transform"
              >
                <AvatarArt
                  avatarId={slot.player?.avatarId || 'guest'}
                  size={74}
                  level={slot.player?.level}
                  isEmptySlot={!slot.player}
                />
                <span className="text-[11px] font-bold text-white max-w-[100px] truncate">
                  {slot.player ? slot.player.username : 'Tap to Add'}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode label + Bottom Controls (Back, Start Match, Chat) */}
      <div className="px-3 pb-4 pt-1 flex flex-col items-center gap-2.5">
        <div className="text-lg font-extrabold text-white text-stroke-sm">
          {activeRoom.mode === 'disc-pool' ? 'Disc Pool' : 'Carrom'} ({activeRoom.format})
        </div>

        <div className="w-full flex items-center justify-between gap-3">
          <button
            onClick={leavePrivateRoom}
            className="btn-orange w-12 h-11 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Leave room"
          >
            <ArrowLeft className="w-6 h-6 text-white stroke-[3]" />
          </button>

          <button
            onClick={startPrivateRoomMatch}
            className={`flex-1 max-w-[200px] h-12 rounded-xl text-[18px] font-extrabold text-stroke-sm transition-all ${
              hasAnyOpponent
                ? 'btn-green text-white'
                : 'bg-green-950/75 border-2 border-green-700/60 text-green-300/70'
            }`}
          >
            Start Match
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setChatOpen((v) => !v);
            }}
            className="btn-orange relative w-12 h-11 rounded-xl flex items-center justify-center shrink-0"
            aria-label="Room chat"
          >
            <MessageSquare className="w-6 h-6 text-white" />
            {activeRoom.chat.length > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-green-500 text-[9px] font-bold flex items-center justify-center">
                {activeRoom.chat.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Slot Assignment Picker Popup */}
      {slotPicker !== null && (
        <div className="absolute inset-0 z-40 bg-black/75 flex items-center justify-center p-5">
          <div className="wood-panel rounded-2xl p-4 w-full max-w-xs relative animate-pop space-y-2.5">
            <button
              onClick={() => setSlotPicker(null)}
              className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
            >
              <X className="w-4 h-4 text-white stroke-[3]" />
            </button>
            <h3 className="text-base font-extrabold text-yellow-300 text-center">
              Configure Player Slot
            </h3>
            <button
              onClick={() => {
                fillRoomSlot(slotPicker, 'bot');
                setSlotPicker(null);
              }}
              className="btn-green w-full py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" /> Add AI Bot Opponent / Partner
            </button>
            <button
              onClick={() => {
                fillRoomSlot(slotPicker, 'local');
                setSlotPicker(null);
              }}
              className="btn-blue w-full py-2.5 rounded-xl text-sm font-extrabold text-white flex items-center justify-center gap-2"
            >
              <User className="w-4 h-4" /> Add Local Player (Pass &amp; Play)
            </button>
            <button
              onClick={() => {
                fillRoomSlot(slotPicker, 'clear');
                setSlotPicker(null);
              }}
              className="w-full py-2 rounded-xl bg-black/40 border border-white/20 text-xs font-bold text-amber-200"
            >
              Clear Slot
            </button>
          </div>
        </div>
      )}

      {/* Room Chat Drawer */}
      {chatOpen && (
        <div className="absolute inset-x-3 bottom-20 z-40 wood-panel rounded-2xl p-3 animate-pop">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-extrabold text-yellow-300">Room Chat</span>
            <button onClick={() => setChatOpen(false)}>
              <X className="w-4 h-4 text-amber-200" />
            </button>
          </div>
          <div className="h-32 overflow-y-auto game-scroll bg-black/35 rounded-lg p-2 space-y-1 mb-2 text-xs">
            {activeRoom.chat.length === 0 ? (
              <div className="text-amber-200/60 text-center mt-8">No messages yet. Say hi!</div>
            ) : (
              activeRoom.chat.map((c) => (
                <div key={c.id}>
                  <span className="font-bold text-yellow-300">{c.sender}: </span>
                  <span className="text-white">{c.text}</span>
                </div>
              ))
            )}
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!chatText.trim()) return;
              sendRoomChat(chatText);
              setChatText('');
            }}
            className="flex gap-1.5"
          >
            <input
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder="Type message..."
              className="flex-1 wood-recessed rounded-lg px-2.5 py-1.5 text-xs text-white outline-none select-text"
            />
            <button type="submit" className="btn-green px-3 rounded-lg flex items-center justify-center">
              <Send className="w-4 h-4 text-white" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
