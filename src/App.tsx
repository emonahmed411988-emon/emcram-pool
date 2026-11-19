import React, { useEffect } from 'react';
import { App as CapApp } from '@capacitor/app';
import { GameProvider, useGame } from './context/GameContext';
import { HomeScreen } from './components/screens/HomeScreen';
import { StageSelectScreen } from './components/screens/StageSelectScreen';
import { GameScreen } from './components/screens/GameScreen';
import { EquipmentScreen } from './components/screens/EquipmentScreen';
import { FriendsScreen } from './components/screens/FriendsScreen';
import { RoomLobbyScreen } from './components/screens/RoomLobbyScreen';
import { EventsScreen } from './components/screens/EventsScreen';
import { ShopScreen } from './components/screens/ShopScreen';
import { CreateRoomModal } from './components/modals/CreateRoomModal';
import { JoinRoomModal } from './components/modals/JoinRoomModal';
import { ProfileAccountModal } from './components/modals/ProfileAccountModal';
import { ChestOpenModal } from './components/modals/ChestOpenModal';
import { LuckyShotModal } from './components/modals/LuckyShotModal';
import { SpinWheelModal } from './components/modals/SpinWheelModal';
import {
  AddFriendModal,
  FreeRewardsModal,
  LeaderboardModal,
  MailModal,
  SettingsModal,
} from './components/modals/UtilityModals';

const AppShell: React.FC = () => {
  const {
    screen,
    activeModal,
    toastMessage,
    setActiveModal,
    setScreen,
    goToTab,
    exitMatch,
    leavePrivateRoom,
  } = useGame();

  // Native Android back button support via Capacitor
  useEffect(() => {
    let cleanup: (() => void) | undefined;
    CapApp.addListener('backButton', () => {
      if (activeModal) {
        setActiveModal(null);
      } else if (screen === 'game') {
        exitMatch();
      } else if (screen === 'room-lobby') {
        leavePrivateRoom();
      } else if (screen === 'stage-select') {
        setScreen('home');
      } else if (screen !== 'home') {
        goToTab('home');
      } else {
        CapApp.exitApp();
      }
    })
      .then((handle) => {
        cleanup = () => handle.remove();
      })
      .catch(() => {
        // Running in standard web browser
      });

    return () => {
      cleanup?.();
    };
  }, [activeModal, screen, setActiveModal, exitMatch, leavePrivateRoom, setScreen, goToTab]);

  return (
    <div className="w-full h-[100dvh] bg-[#0e0604] flex items-center justify-center overflow-hidden">
      {/* Mobile Portrait Viewport Container (Full-bleed on phones, sleek frame on desktop) */}
      <main className="relative w-full h-full sm:max-w-[430px] sm:h-[94dvh] sm:max-h-[860px] sm:rounded-[28px] sm:border-[3px] sm:border-[#6e3b1b] sm:shadow-[0_24px_80px_rgba(0,0,0,0.85)] overflow-hidden bg-[#1a0a07] flex flex-col">
        {screen === 'home' && <HomeScreen />}
        {screen === 'stage-select' && <StageSelectScreen />}
        {screen === 'game' && <GameScreen />}
        {screen === 'equipment' && <EquipmentScreen />}
        {screen === 'friends' && <FriendsScreen />}
        {screen === 'room-lobby' && <RoomLobbyScreen />}
        {screen === 'events' && <EventsScreen />}
        {screen === 'shop' && <ShopScreen />}

        {/* Global Modals */}
        {activeModal === 'create-room' && <CreateRoomModal />}
        {activeModal === 'join-room' && <JoinRoomModal />}
        {activeModal === 'profile' && <ProfileAccountModal />}
        {activeModal === 'free-rewards' && <FreeRewardsModal />}
        {activeModal === 'lucky-shot' && <LuckyShotModal />}
        {activeModal === 'spin-wheel' && <SpinWheelModal />}
        {activeModal === 'leaderboard' && <LeaderboardModal />}
        {activeModal === 'settings' && <SettingsModal />}
        {activeModal === 'add-friend' && <AddFriendModal />}
        {activeModal === 'mail' && <MailModal />}

        {/* Chest Opening Celebration Overlay */}
        <ChestOpenModal />

        {/* Floating Toast Notification */}
        {toastMessage && (
          <div className="absolute bottom-20 inset-x-5 z-[60] flex justify-center pointer-events-none">
            <div className="bg-black/85 border border-yellow-400/50 text-white text-xs font-extrabold px-4 py-2 rounded-full shadow-xl text-center animate-pop">
              {toastMessage}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export function App() {
  return (
    <GameProvider>
      <AppShell />
    </GameProvider>
  );
}

export default App;
