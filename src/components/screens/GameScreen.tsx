import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { Menu, MessageCircle, Volume2, VolumeX, LogOut, Trophy, RotateCcw, X } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { COSMETICS, getStrikerStats } from '../../data/equipment';
import { QUICK_CHAT_PHRASES } from '../../data/avatars';
import {
  BOARD_SIZE,
  createInitialDiscs,
  findNearestValidBaselineNorm,
  getBaselineForSeat,
  getStrikerPosOnBaseline,
  isStrikerPlacementValid,
  stepPhysics,
  STRIKER_RADIUS,
} from '../../engine/physics';
import {
  AimOverlayState,
  createBoardCacheCanvas,
  Particle,
  renderBoardFrame,
} from '../../engine/boardRenderer';
import { createInitialRulesState, evaluateShot, MatchRulesState } from '../../engine/rules';
import { computeAiShot } from '../../engine/ai';
import { sound } from '../../engine/sound';
import { multiplayer, ShotPayload } from '../../services/multiplayer';
import { formatNumberSpaced } from '../../services/storage';
import { AvatarArt } from '../AvatarArt';
import { CoinIcon, CoinStackIcon, StrikerArt } from '../StrikerArt';
import { ChatBubble, DiscBody } from '../../types/game';

export const GameScreen: React.FC = () => {
  const { account, activeMatch, completeMatch, exitMatch, updateSettings } = useGame();

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sliderTrackRef = useRef<HTMLDivElement | null>(null);

  const puckSkin = useMemo(
    () => COSMETICS.find((c) => c.id === account.equippedPuck) || COSMETICS[0],
    [account.equippedPuck]
  );
  const trailSkin = useMemo(
    () => COSMETICS.find((c) => c.id === account.equippedTrail) || COSMETICS[4],
    [account.equippedTrail]
  );
  const pocketSkin = useMemo(
    () => COSMETICS.find((c) => c.id === account.equippedPocket) || COSMETICS[8],
    [account.equippedPocket]
  );

  // Core simulation refs (kept in refs for zero-lag 60fps Canvas loop)
  const bodiesRef = useRef<DiscBody[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const boardCacheRef = useRef<HTMLCanvasElement | null>(null);
  const phaseRef = useRef<'aiming' | 'moving' | 'ai-prep' | 'gameover'>('aiming');
  const pottedThisShotRef = useRef<('white' | 'black' | 'queen' | 'striker')[]>([]);
  const rulesRef = useRef<MatchRulesState | null>(null);
  const draggingAimRef = useRef(false);
  const draggingSliderRef = useRef(false);
  const sliderNormRef = useRef(0.5);
  const aimRef = useRef<AimOverlayState>({
    active: false,
    validPlacement: true,
    pullX: 0,
    pullY: 0,
    powerNorm: 0,
    aimStat: 3,
  });
  const turnDeadlineRef = useRef<number>(Date.now() + 25000);
  const turnDurationRef = useRef<number>(25000);
  const aiTimersRef = useRef<number[]>([]);
  const completedReportedRef = useRef(false);

  // React UI state synced cleanly at turn/event boundaries
  const [rulesUI, setRulesUI] = useState<MatchRulesState | null>(null);
  const [sliderNorm, setSliderNorm] = useState(0.5);
  const [turnProgress, setTurnProgress] = useState(1);
  const [topBanner, setTopBanner] = useState<string>('Pot all your pucks to win the match');
  const [chatOpen, setChatOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bubbles, setBubbles] = useState<ChatBubble[]>([]);
  const [matchKey, setMatchKey] = useState(0);

  const clearAiTimers = useCallback(() => {
    aiTimersRef.current.forEach((id) => window.clearTimeout(id));
    aiTimersRef.current = [];
  }, []);

  const showBanner = useCallback((msg: string, durationMs = 2600) => {
    setTopBanner(msg);
    if (durationMs > 0) {
      window.setTimeout(() => {
        setTopBanner((cur) => (cur === msg ? '' : cur));
      }, durationMs);
    }
  }, []);

  const addBubble = useCallback((seatIndex: number, text: string) => {
    setBubbles((prev) => [
      ...prev.filter((b) => b.seatIndex !== seatIndex),
      { seatIndex, text, expiresAt: Date.now() + 2800 },
    ]);
  }, []);

  const spawnBurst = useCallback((x: number, y: number, color: string, count = 14) => {
    for (let i = 0; i < count; i++) {
      const ang = (Math.PI * 2 * i) / count + Math.random() * 0.4;
      const spd = 70 + Math.random() * 190;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(ang) * spd,
        vy: Math.sin(ang) * spd,
        life: 0.45 + Math.random() * 0.25,
        maxLife: 0.7,
        size: 3 + Math.random() * 4.5,
        color,
      });
    }
  }, []);

  const getActiveStrikerStats = useCallback(
    (seatIndex: number) => {
      if (!activeMatch) return { force: 2, aim: 2, time: 2 };
      const p = activeMatch.participants[seatIndex];
      if (p.id === account.id) {
        const owned = account.strikers[account.equippedStriker] || { level: 1 };
        return getStrikerStats(account.equippedStriker, owned.level, account.collectionLevel);
      }
      return getStrikerStats(p.strikerId || 'blaze', Math.max(1, Math.floor(p.level / 2)), 1);
    },
    [activeMatch, account]
  );

  const placeStrikerForTurn = useCallback(
    (seatIndex: number, preferredNorm = 0.5) => {
      if (!activeMatch) return;
      const spec = getBaselineForSeat(seatIndex, activeMatch.format);
      const validNorm = findNearestValidBaselineNorm(spec, preferredNorm, bodiesRef.current);
      const pos = getStrikerPosOnBaseline(spec, validNorm);

      const striker = bodiesRef.current.find((b) => b.kind === 'striker');
      if (striker) {
        striker.potted = false;
        striker.pottingAnim = undefined;
        striker.vx = 0;
        striker.vy = 0;
        striker.x = pos.x;
        striker.y = pos.y;
      }

      sliderNormRef.current = validNorm;
      setSliderNorm(validNorm);

      const stats = getActiveStrikerStats(seatIndex);
      const turnMs = (18 + stats.time * 1.8) * 1000;
      turnDurationRef.current = turnMs;
      turnDeadlineRef.current = Date.now() + turnMs;
      setTurnProgress(1);

      aimRef.current = {
        active: false,
        validPlacement: isStrikerPlacementValid(pos.x, pos.y, bodiesRef.current),
        pullX: 0,
        pullY: 0,
        powerNorm: 0,
        aimStat: stats.aim,
      };
    },
    [activeMatch, getActiveStrikerStats]
  );

  const executeShot = useCallback(
    (vx: number, vy: number, broadcast = true) => {
      if (!activeMatch || !rulesRef.current) return;
      const striker = bodiesRef.current.find((b) => b.kind === 'striker');
      if (!striker) return;

      const speed = Math.hypot(vx, vy);
      const powerNorm = Math.min(1, speed / 2100);
      striker.vx = vx;
      striker.vy = vy;
      pottedThisShotRef.current = [];
      aimRef.current.active = false;
      phaseRef.current = 'moving';
      sound.playStrike(powerNorm);

      if (broadcast && activeMatch.isOnlineMultiplayer && activeMatch.roomCode) {
        multiplayer.emitShot({
          roomCode: activeMatch.roomCode,
          seatIndex: rulesRef.current.currentSeat,
          strikerX: striker.x,
          strikerY: striker.y,
          vx,
          vy,
        });
      }
    },
    [activeMatch]
  );

  // Schedule AI shot choreography (Slide -> Visible Aiming Arrow -> Release!)
  const triggerAiTurnIfNeeded = useCallback(
    (state: MatchRulesState) => {
      if (!activeMatch || state.winnerTeam !== null) return;
      const activeP = activeMatch.participants[state.currentSeat];
      if (!activeP.isBot) {
        phaseRef.current = 'aiming';
        return;
      }

      clearAiTimers();
      phaseRef.current = 'ai-prep';

      const plan = computeAiShot(activeMatch, state, bodiesRef.current, state.currentSeat);
      const spec = getBaselineForSeat(state.currentSeat, activeMatch.format);
      const stats = getActiveStrikerStats(state.currentSeat);

      // Step 1: Smoothly glide striker to AI's chosen baseline spot
      const startNorm = sliderNormRef.current;
      const slideSteps = 14;
      for (let i = 1; i <= slideSteps; i++) {
        const t = window.setTimeout(() => {
          if (phaseRef.current !== 'ai-prep') return;
          const n = startNorm + (plan.baselineNorm - startNorm) * (i / slideSteps);
          const pos = getStrikerPosOnBaseline(spec, n);
          const striker = bodiesRef.current.find((b) => b.kind === 'striker');
          if (striker) {
            striker.x = pos.x;
            striker.y = pos.y;
          }
          sliderNormRef.current = n;
          setSliderNorm(n);
        }, 280 + i * 28);
        aiTimersRef.current.push(t);
      }

      // Step 2: Pull back aiming arrow visibly (just like Screenshot 13!)
      const aimStartDelay = 280 + slideSteps * 28 + 140;
      const pullSteps = 10;
      for (let j = 1; j <= pullSteps; j++) {
        const t = window.setTimeout(() => {
          if (phaseRef.current !== 'ai-prep') return;
          const frac = j / pullSteps;
          const curPower = plan.powerNorm * frac;
          const pullDist = curPower * 165;
          aimRef.current = {
            active: true,
            validPlacement: true,
            pullX: -plan.dirX * pullDist,
            pullY: -plan.dirY * pullDist,
            powerNorm: curPower,
            aimStat: stats.aim,
            isOpponent: true,
          };
        }, aimStartDelay + j * 45);
        aiTimersRef.current.push(t);
      }

      // Step 3: Fire!
      const fireTimer = window.setTimeout(() => {
        if (phaseRef.current !== 'ai-prep') return;
        const maxSpeed = 1480 + stats.force * 95;
        const launchSpeed = 380 + plan.powerNorm * (maxSpeed - 380);
        executeShot(plan.dirX * launchSpeed, plan.dirY * launchSpeed, false);

        // Occasional fun bot chat emote
        if (Math.random() < 0.18) {
          addBubble(state.currentSeat, QUICK_CHAT_PHRASES[Math.floor(Math.random() * 4)]);
        }
      }, aimStartDelay + pullSteps * 45 + 240);
      aiTimersRef.current.push(fireTimer);
    },
    [activeMatch, clearAiTimers, executeShot, getActiveStrikerStats, addBubble]
  );

  // Initialize board & physics on match start or rematch
  useEffect(() => {
    if (!activeMatch) return;
    clearAiTimers();
    completedReportedRef.current = false;

    boardCacheRef.current = createBoardCacheCanvas(activeMatch.arena, pocketSkin);
    bodiesRef.current = createInitialDiscs(
      activeMatch.arena.piecesPerPlayer,
      activeMatch.arena.hasQueen
    );
    particlesRef.current = [];

    const initRules = createInitialRulesState(activeMatch);
    rulesRef.current = initRules;
    setRulesUI(initRules);

    placeStrikerForTurn(0, 0.5);
    phaseRef.current = 'aiming';

    showBanner(
      activeMatch.mode === 'freestyle'
        ? `Score ${activeMatch.arena.targetPoints || 120} points to win!`
        : activeMatch.mode === 'carrom'
          ? 'Pot all your pucks & cover the Red Queen!'
          : 'Pot all your pucks to win the match',
      3400
    );

    triggerAiTurnIfNeeded(initRules);

    return () => {
      clearAiTimers();
    };
  }, [activeMatch, pocketSkin, matchKey, clearAiTimers, placeStrikerForTurn, showBanner, triggerAiTurnIfNeeded]);

  // Listen for online multiplayer socket events if playing an online room
  useEffect(() => {
    if (!activeMatch?.isOnlineMultiplayer) return;
    const sock = multiplayer.getSocket();
    if (!sock) return;

    const onRemoteSlider = (p: { seatIndex: number; norm: number }) => {
      if (!rulesRef.current || p.seatIndex !== rulesRef.current.currentSeat) return;
      const spec = getBaselineForSeat(p.seatIndex, activeMatch.format);
      const pos = getStrikerPosOnBaseline(spec, p.norm);
      const striker = bodiesRef.current.find((b) => b.kind === 'striker');
      if (striker) {
        striker.x = pos.x;
        striker.y = pos.y;
      }
      sliderNormRef.current = p.norm;
      setSliderNorm(p.norm);
    };

    const onRemoteShot = (p: ShotPayload) => {
      const striker = bodiesRef.current.find((b) => b.kind === 'striker');
      if (striker) {
        striker.x = p.strikerX;
        striker.y = p.strikerY;
      }
      executeShot(p.vx, p.vy, false);
    };

    const onRemoteChat = (p: { seatIndex: number; text: string }) => {
      addBubble(p.seatIndex, p.text);
    };

    sock.on('match:slider', onRemoteSlider);
    sock.on('match:shoot', onRemoteShot);
    sock.on('match:chat', onRemoteChat);
    return () => {
      sock.off('match:slider', onRemoteSlider);
      sock.off('match:shoot', onRemoteShot);
      sock.off('match:chat', onRemoteChat);
    };
  }, [activeMatch, executeShot, addBubble]);

  // Main 60fps Canvas Animation & Physics Loop
  useEffect(() => {
    if (!activeMatch) return;
    let rafId = 0;
    let lastTime = performance.now();
    let timerUiTick = 0;

    const loop = (now: number) => {
      const dt = Math.min(0.04, (now - lastTime) / 1000);
      lastTime = now;

      // Update particles
      for (let i = particlesRef.current.length - 1; i >= 0; i--) {
        const pt = particlesRef.current[i];
        pt.x += pt.vx * dt;
        pt.y += pt.vy * dt;
        pt.vx *= 0.94;
        pt.vy *= 0.94;
        pt.life -= dt;
        if (pt.life <= 0) particlesRef.current.splice(i, 1);
      }

      // Step physics if moving
      if (phaseRef.current === 'moving') {
        const striker = bodiesRef.current.find((b) => b.kind === 'striker');
        if (striker && !striker.potted && Math.hypot(striker.vx, striker.vy) > 220) {
          particlesRef.current.push({
            x: striker.x + (Math.random() - 0.5) * 14,
            y: striker.y + (Math.random() - 0.5) * 14,
            vx: -striker.vx * 0.05,
            vy: -striker.vy * 0.05,
            life: 0.28,
            maxLife: 0.28,
            size: 5.5,
            color: trailSkin.primaryColor,
          });
        }

        const stillMoving = stepPhysics(bodiesRef.current, dt, {
          onClack: (speed) => sound.playClack(speed),
          onCushion: (speed) => sound.playCushion(speed),
          onPocket: (disc, px, py) => {
            pottedThisShotRef.current.push(disc.kind);
            if (disc.kind === 'striker') {
              sound.playFoul();
              spawnBurst(px, py, '#ef4444', 14);
            } else {
              sound.playPocket(disc.kind === 'queen');
              spawnBurst(
                px,
                py,
                disc.kind === 'queen' ? '#f43f5e' : pocketSkin.accentColor,
                disc.kind === 'queen' ? 22 : 14
              );
            }
          },
        });

        // All discs came to rest -> evaluate Carrom rules!
        if (!stillMoving && rulesRef.current) {
          const outcome = evaluateShot(
            activeMatch,
            rulesRef.current,
            bodiesRef.current,
            pottedThisShotRef.current
          );
          rulesRef.current = outcome.nextState;
          setRulesUI(outcome.nextState);

          if (outcome.foul) sound.playFoul();
          if (outcome.toast) showBanner(outcome.toast, 2600);

          if (outcome.nextState.winnerTeam !== null) {
            phaseRef.current = 'gameover';
            const myTeam = activeMatch.participants[activeMatch.mySeatIndex].team;
            const iWon = outcome.nextState.winnerTeam === myTeam;
            if (iWon) sound.playWin();
            else sound.playLose();

            if (!completedReportedRef.current) {
              completedReportedRef.current = true;
              completeMatch({
                won: iWon,
                pucksPotted: outcome.nextState.myPucksPottedTotal,
                queensCovered: outcome.nextState.myQueensCoveredTotal,
              });
            }
          } else {
            placeStrikerForTurn(outcome.nextState.currentSeat, 0.5);
            triggerAiTurnIfNeeded(outcome.nextState);
          }
        }
      } else if (phaseRef.current === 'aiming' || phaseRef.current === 'ai-prep') {
        // Turn timer tick
        timerUiTick += dt;
        if (timerUiTick >= 0.08) {
          timerUiTick = 0;
          const rem = Math.max(0, turnDeadlineRef.current - Date.now());
          const frac = rem / Math.max(1000, turnDurationRef.current);
          setTurnProgress(frac);

          // Clear expired chat bubbles
          setBubbles((prev) =>
            prev.some((b) => b.expiresAt <= Date.now())
              ? prev.filter((b) => b.expiresAt > Date.now())
              : prev
          );

          // Timeout passes turn
          if (rem <= 0 && rulesRef.current && phaseRef.current === 'aiming') {
            sound.playFoul();
            const nextSeat = (rulesRef.current.currentSeat + 1) % activeMatch.participants.length;
            const nextState: MatchRulesState = {
              ...rulesRef.current,
              currentSeat: nextSeat,
              statusMessage:
                nextSeat === activeMatch.mySeatIndex
                  ? "It's your turn!"
                  : `${activeMatch.participants[nextSeat].username}'s turn`,
            };
            rulesRef.current = nextState;
            setRulesUI(nextState);
            showBanner("Time's up! Turn switched", 2000);
            placeStrikerForTurn(nextSeat, 0.5);
            triggerAiTurnIfNeeded(nextState);
          }
        }
      }

      // Render Board Canvas
      const canvas = canvasRef.current;
      const cache = boardCacheRef.current;
      if (canvas && cache && rulesRef.current) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const activeP = activeMatch.participants[rulesRef.current.currentSeat];
          const canInteract =
            phaseRef.current === 'aiming' &&
            activeP.isLocalHuman &&
            (!activeMatch.isOnlineMultiplayer ||
              rulesRef.current.currentSeat === activeMatch.mySeatIndex);

          renderBoardFrame(
            ctx,
            cache,
            bodiesRef.current,
            puckSkin,
            activeP.strikerId || account.equippedStriker,
            aimRef.current,
            particlesRef.current,
            canInteract,
            now
          );
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeMatch,
    account.equippedStriker,
    puckSkin,
    trailSkin,
    pocketSkin,
    completeMatch,
    placeStrikerForTurn,
    showBanner,
    spawnBurst,
    triggerAiTurnIfNeeded,
  ]);

  if (!activeMatch || !rulesUI) return null;

  const activeParticipant = activeMatch.participants[rulesUI.currentSeat];
  const canLocalControl =
    phaseRef.current === 'aiming' &&
    activeParticipant.isLocalHuman &&
    (!activeMatch.isOnlineMultiplayer || rulesUI.currentSeat === activeMatch.mySeatIndex);

  // Convert pointer event to 0..1000 canvas board coordinates
  const toBoardCoords = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * BOARD_SIZE,
      y: ((e.clientY - rect.top) / rect.height) * BOARD_SIZE,
    };
  };

  const handleBoardPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    sound.unlock();
    if (!canLocalControl) return;
    const pt = toBoardCoords(e);
    const striker = bodiesRef.current.find((b) => b.kind === 'striker');
    if (!striker || striker.potted) return;

    const dist = Math.hypot(pt.x - striker.x, pt.y - striker.y);
    if (dist <= 115) {
      const valid = isStrikerPlacementValid(striker.x, striker.y, bodiesRef.current);
      if (!valid) {
        sound.playFoul();
        showBanner('Slide striker to a clear spot on the baseline!', 1800);
        return;
      }
      draggingAimRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
      const stats = getActiveStrikerStats(rulesUI.currentSeat);
      aimRef.current = {
        active: true,
        validPlacement: true,
        pullX: pt.x - striker.x,
        pullY: pt.y - striker.y,
        powerNorm: Math.min(1, Math.hypot(pt.x - striker.x, pt.y - striker.y) / 185),
        aimStat: stats.aim,
      };
    }
  };

  const handleBoardPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingAimRef.current) return;
    const pt = toBoardCoords(e);
    const striker = bodiesRef.current.find((b) => b.kind === 'striker');
    if (!striker) return;
    const pullX = pt.x - striker.x;
    const pullY = pt.y - striker.y;
    const dist = Math.hypot(pullX, pullY);
    aimRef.current.pullX = pullX;
    aimRef.current.pullY = pullY;
    aimRef.current.powerNorm = Math.min(1, dist / 185);
  };

  const handleBoardPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggingAimRef.current) return;
    draggingAimRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }

    const { pullX, pullY, powerNorm, validPlacement } = aimRef.current;
    aimRef.current.active = false;
    const dist = Math.hypot(pullX, pullY);

    if (!validPlacement || powerNorm < 0.08 || dist < 14) {
      return; // Canceled shot
    }

    const dirX = -pullX / dist;
    const dirY = -pullY / dist;
    const stats = getActiveStrikerStats(rulesUI.currentSeat);
    const maxSpeed = 1480 + stats.force * 95;
    const launchSpeed = 290 + powerNorm * (maxSpeed - 290);
    executeShot(dirX * launchSpeed, dirY * launchSpeed, true);
  };

  // Bottom Baseline Slider Pointer Handlers
  const updateSliderFromClientX = (clientX: number) => {
    if (!canLocalControl || !sliderTrackRef.current) return;
    const rect = sliderTrackRef.current.getBoundingClientRect();
    const pad = 22;
    const norm = Math.max(0, Math.min(1, (clientX - rect.left - pad) / (rect.width - pad * 2)));
    sliderNormRef.current = norm;
    setSliderNorm(norm);

    const spec = getBaselineForSeat(rulesUI.currentSeat, activeMatch.format);
    const pos = getStrikerPosOnBaseline(spec, norm);
    const striker = bodiesRef.current.find((b) => b.kind === 'striker');
    if (striker) {
      striker.x = pos.x;
      striker.y = pos.y;
      aimRef.current.validPlacement = isStrikerPlacementValid(pos.x, pos.y, bodiesRef.current);
    }
    if (activeMatch.isOnlineMultiplayer && activeMatch.roomCode) {
      multiplayer.emitSlider(activeMatch.roomCode, rulesUI.currentSeat, norm);
    }
  };

  const leftPlayer = activeMatch.participants[0];
  const rightPlayer = activeMatch.participants[1];
  const myTeam = activeMatch.participants[activeMatch.mySeatIndex].team;
  const didIWin = rulesUI.winnerTeam !== null && rulesUI.winnerTeam === myTeam;
  const [bg1, bg2] = activeMatch.arena.boardTheme.backdropGradient;

  const leftBubble = bubbles.find((b) => b.seatIndex === 0 || b.seatIndex === 2);
  const rightBubble = bubbles.find((b) => b.seatIndex === 1 || b.seatIndex === 3);

  return (
    <div
      className="flex flex-col h-full w-full relative overflow-hidden justify-between"
      style={{
        background: `radial-gradient(ellipse at 50% 42%, ${bg1} 0%, ${bg2} 100%)`,
      }}
    >
      {/* Top Match HUD (Exact match to Screenshots 3, 9, 12, 13!) */}
      <div className="relative z-20 px-3 pt-2.5 pb-1 flex items-start justify-between">
        {/* Left Player / Team 0 */}
        <div className="flex flex-col items-start relative">
          <AvatarArt
            avatarId={leftPlayer.avatarId}
            size={56}
            timerProgress={rulesUI.currentSeat === 0 || rulesUI.currentSeat === 2 ? turnProgress : null}
          />
          <span className="text-[11px] font-bold text-white mt-1 max-w-[96px] truncate drop-shadow">
            {activeMatch.format === '2v2' ? 'Your Team' : leftPlayer.username}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="text-[20px] font-black text-white text-stroke-sm leading-none">
              {rulesUI.scores[0]}
            </span>
            {activeMatch.mode !== 'freestyle' ? (
              <span
                className="w-5 h-5 rounded-full border-2 shadow-inner inline-block"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #4b5563, #111827)',
                  borderColor: '#000',
                }}
              />
            ) : (
              <span className="text-[10px] font-extrabold text-yellow-300">PTS</span>
            )}
            {(rulesUI.queenState === 'covered-team-0' || rulesUI.queenState === 'pending-team-0') &&
              activeMatch.arena.hasQueen && (
                <span
                  className={`w-4 h-4 rounded-full bg-red-600 border border-pink-200 ${
                    rulesUI.queenState === 'pending-team-0' ? 'animate-ping' : ''
                  }`}
                  title="Red Queen"
                />
              )}
          </div>
          {leftBubble && (
            <div className="absolute left-14 top-1 bg-white text-zinc-900 px-2.5 py-1 rounded-xl rounded-tl-none text-[11px] font-extrabold shadow-lg whitespace-nowrap animate-pop z-30">
              {leftBubble.text}
            </div>
          )}
        </div>

        {/* Center Coin Pot */}
        <div className="flex flex-col items-center pt-1">
          <div className="relative flex flex-col items-center">
            <div className="absolute -inset-2 bg-yellow-400/20 blur-xl rounded-full pointer-events-none" />
            <CoinStackIcon size={58} />
            <span className="text-[22px] font-black text-white text-stroke-md leading-none mt-0.5">
              {formatNumberSpaced(activeMatch.pot)}
            </span>
          </div>
        </div>

        {/* Right Player / Team 1 */}
        <div className="flex flex-col items-end relative">
          <AvatarArt
            avatarId={rightPlayer.avatarId}
            size={56}
            timerProgress={rulesUI.currentSeat === 1 || rulesUI.currentSeat === 3 ? turnProgress : null}
          />
          <span className="text-[11px] font-bold text-white mt-1 max-w-[96px] truncate drop-shadow text-right">
            {activeMatch.format === '2v2' ? 'Opponents' : rightPlayer.username}
          </span>
          <div className="flex items-center gap-1.5 mt-0.5">
            {(rulesUI.queenState === 'covered-team-1' || rulesUI.queenState === 'pending-team-1') &&
              activeMatch.arena.hasQueen && (
                <span
                  className={`w-4 h-4 rounded-full bg-red-600 border border-pink-200 ${
                    rulesUI.queenState === 'pending-team-1' ? 'animate-ping' : ''
                  }`}
                  title="Red Queen"
                />
              )}
            {activeMatch.mode !== 'freestyle' ? (
              <span
                className="w-5 h-5 rounded-full border-2 shadow-inner inline-block"
                style={{
                  background: 'radial-gradient(circle at 35% 30%, #ffffff, #d6c3a5)',
                  borderColor: '#a68b67',
                }}
              />
            ) : (
              <span className="text-[10px] font-extrabold text-yellow-300">PTS</span>
            )}
            <span className="text-[20px] font-black text-white text-stroke-sm leading-none">
              {rulesUI.scores[1]}
            </span>
          </div>
          {rightBubble && (
            <div className="absolute right-14 top-1 bg-white text-zinc-900 px-2.5 py-1 rounded-xl rounded-tr-none text-[11px] font-extrabold shadow-lg whitespace-nowrap animate-pop z-30">
              {rightBubble.text}
            </div>
          )}
        </div>
      </div>

      {/* Black Floating Rule / Event Tooltip Banner */}
      {topBanner && (
        <div className="absolute top-[112px] inset-x-6 z-30 flex justify-center pointer-events-none">
          <div className="bg-black/85 border border-yellow-400/30 px-3.5 py-1 rounded-xl text-[12px] font-bold text-white shadow-xl text-center animate-pop">
            {topBanner}
          </div>
        </div>
      )}

      {/* Center Square High-DPI Carrom Board Canvas */}
      <div className="flex-1 flex items-center justify-center px-2 py-1 min-h-0">
        <div className="relative h-full w-full flex items-center justify-center min-h-0">
          <canvas
            ref={canvasRef}
            width={BOARD_SIZE}
            height={BOARD_SIZE}
            onPointerDown={handleBoardPointerDown}
            onPointerMove={handleBoardPointerMove}
            onPointerUp={handleBoardPointerUp}
            onPointerCancel={handleBoardPointerUp}
            className="aspect-square max-w-full max-h-full rounded-[24px] shadow-[0_14px_34px_rgba(0,0,0,0.75)] touch-none cursor-pointer"
          />
        </div>
      </div>

      {/* Bottom Striker Position Slider Bar (Exact match to Screenshots 3, 9, 12, 13!) */}
      <div className="px-8 py-1.5 flex flex-col items-center">
        <div
          ref={sliderTrackRef}
          onPointerDown={(e) => {
            sound.unlock();
            if (!canLocalControl) return;
            draggingSliderRef.current = true;
            e.currentTarget.setPointerCapture(e.pointerId);
            updateSliderFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (!draggingSliderRef.current) return;
            updateSliderFromClientX(e.clientX);
          }}
          onPointerUp={(e) => {
            draggingSliderRef.current = false;
            try {
              e.currentTarget.releasePointerCapture(e.pointerId);
            } catch {
              // ignore
            }
          }}
          className={`relative w-full max-w-[310px] h-10 rounded-full border-2 touch-none flex items-center transition-opacity ${
            canLocalControl ? 'opacity-100 cursor-ew-resize' : 'opacity-45 pointer-events-none'
          }`}
          style={{
            background: 'linear-gradient(180deg, #b87c4b 0%, #874e24 55%, #5c3112 100%)',
            borderColor: '#45200a',
            boxShadow: 'inset 0 3px 6px rgba(0,0,0,0.55), 0 3px 8px rgba(0,0,0,0.5)',
          }}
        >
          {/* Inner glossy groove */}
          <div className="absolute inset-x-4 h-1.5 rounded-full bg-black/25 pointer-events-none" />
          {/* Draggable Striker Handle */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 pointer-events-none"
            style={{ left: `calc(22px + (100% - 44px) * ${sliderNorm})` }}
          >
            <StrikerArt strikerId={account.equippedStriker} size={36} />
          </div>
        </div>
      </div>

      {/* Bottom Corner Glowing Gold Chat & Menu Buttons + Status Pill (Exact match to Screenshot 3!) */}
      <div className="relative z-20 px-4 pb-3 pt-1 flex items-center justify-between">
        <button
          onClick={() => {
            sound.playClick();
            setChatOpen((v) => !v);
            setMenuOpen(false);
          }}
          className="w-12 h-12 rounded-full btn-gold flex items-center justify-center shadow-[0_0_18px_rgba(251,191,36,0.55)]"
          aria-label="Quick Chat"
        >
          <MessageCircle className="w-6 h-6 text-[#572604] fill-[#572604]" />
        </button>

        <div className="bg-black/75 border border-white/15 px-4 py-1.5 rounded-xl text-xs font-bold text-white shadow-lg max-w-[200px] truncate text-center">
          {rulesUI.statusMessage}
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setMenuOpen((v) => !v);
            setChatOpen(false);
          }}
          className="w-12 h-12 rounded-full btn-gold flex items-center justify-center shadow-[0_0_18px_rgba(251,191,36,0.55)]"
          aria-label="Match Menu"
        >
          <Menu className="w-6 h-6 text-[#572604] stroke-[3]" />
        </button>
      </div>

      {/* Quick Chat Popup */}
      {chatOpen && (
        <div className="absolute left-3 bottom-20 z-40 wood-panel rounded-2xl p-2.5 w-60 animate-pop">
          <div className="flex items-center justify-between mb-1.5 px-1">
            <span className="text-xs font-extrabold text-yellow-300">Quick Chat</span>
            <button onClick={() => setChatOpen(false)}>
              <X className="w-4 h-4 text-amber-200" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_CHAT_PHRASES.map((phrase) => (
              <button
                key={phrase}
                onClick={() => {
                  sound.playClick();
                  addBubble(activeMatch.mySeatIndex, phrase);
                  if (activeMatch.isOnlineMultiplayer && activeMatch.roomCode) {
                    multiplayer.emitMatchChat(activeMatch.roomCode, activeMatch.mySeatIndex, phrase);
                  }
                  setChatOpen(false);
                }}
                className="bg-black/35 hover:bg-black/50 border border-amber-500/35 rounded-lg py-1.5 px-2 text-[11px] font-bold text-white text-left"
              >
                {phrase}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Match Pause / Settings Menu */}
      {menuOpen && (
        <div className="absolute right-3 bottom-20 z-40 wood-panel rounded-2xl p-3 w-52 animate-pop space-y-2">
          <button
            onClick={() => updateSettings({ sfx: !account.settings.sfx })}
            className="w-full py-2 px-3 rounded-xl bg-black/35 flex items-center justify-between text-xs font-bold text-white"
          >
            <span>Sound Effects</span>
            {account.settings.sfx ? (
              <Volume2 className="w-4 h-4 text-lime-400" />
            ) : (
              <VolumeX className="w-4 h-4 text-red-400" />
            )}
          </button>
          <button
            onClick={() => {
              setMenuOpen(false);
              exitMatch();
            }}
            className="w-full py-2 px-3 rounded-xl bg-red-700/85 border border-red-400/50 flex items-center justify-center gap-2 text-xs font-extrabold text-white"
          >
            <LogOut className="w-4 h-4" /> Leave Match
          </button>
        </div>
      )}

      {/* Game Over Victory / Defeat Modal */}
      {rulesUI.winnerTeam !== null && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-5">
          <div className="wood-panel rounded-3xl p-5 w-full max-w-xs text-center animate-pop space-y-3">
            <div className="flex justify-center">
              <div
                className={`w-16 h-16 rounded-full flex items-center justify-center border-4 shadow-xl ${
                  didIWin
                    ? 'bg-gradient-to-b from-yellow-300 to-amber-600 border-yellow-100'
                    : 'bg-gradient-to-b from-zinc-500 to-zinc-800 border-zinc-300'
                }`}
              >
                <Trophy className={`w-9 h-9 ${didIWin ? 'text-amber-950' : 'text-zinc-200'}`} />
              </div>
            </div>

            <h2
              className={`text-3xl font-black text-stroke-md ${
                didIWin ? 'text-yellow-300' : 'text-red-400'
              }`}
            >
              {didIWin ? 'YOU WIN!' : 'MATCH OVER'}
            </h2>

            <p className="text-xs font-bold text-amber-100">
              {didIWin
                ? `Champion of ${activeMatch.arena.city} ${activeMatch.arena.subtitle}!`
                : `${rightPlayer.username} won this round. Try again!`}
            </p>

            {didIWin && (
              <div className="bg-black/35 rounded-2xl p-3 space-y-1.5 border border-yellow-400/40">
                <div className="flex items-center justify-center gap-2 text-xl font-black text-yellow-300">
                  <CoinIcon size={24} /> +
                  {formatNumberSpaced(activeMatch.isPrivateRoom ? 200 : activeMatch.pot)}
                </div>
                <div className="text-[11px] font-bold text-lime-300">
                  +45 XP • Victory Chest awarded to Home slot!
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-1">
              <button
                onClick={exitMatch}
                className="btn-orange flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white text-stroke-sm"
              >
                Lobby
              </button>
              <button
                onClick={() => {
                  sound.playClick();
                  setMatchKey((k) => k + 1);
                }}
                className="btn-green flex-1 py-2.5 rounded-xl text-sm font-extrabold text-white text-stroke-sm flex items-center justify-center gap-1"
              >
                <RotateCcw className="w-4 h-4" /> Rematch
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
