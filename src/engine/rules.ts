import { ActiveMatchConfig, DiscBody } from '../types/game';
import { findFreeReturnSpot } from './physics';

export interface MatchRulesState {
  currentSeat: number;
  teamColors: [ 'black' | 'white', 'black' | 'white' ]; // Team 0 = black (left), Team 1 = white (right) just like screenshots
  scores: [number, number]; // In Disc Pool/Carrom = potted own pucks; In Freestyle = points
  queenState: 'on-board' | 'pending-team-0' | 'pending-team-1' | 'covered-team-0' | 'covered-team-1';
  winnerTeam: 0 | 1 | null;
  statusMessage: string;
  lastTurnPottedCount: number;
  myPucksPottedTotal: number;
  myQueensCoveredTotal: number;
}

export function createInitialRulesState(config: ActiveMatchConfig): MatchRulesState {
  return {
    currentSeat: 0,
    teamColors: ['black', 'white'],
    scores: [0, 0],
    queenState: config.arena.hasQueen ? 'on-board' : 'covered-team-0',
    winnerTeam: null,
    statusMessage: "You go first, it's your turn",
    lastTurnPottedCount: 0,
    myPucksPottedTotal: 0,
    myQueensCoveredTotal: 0,
  };
}

export interface ShotOutcome {
  nextState: MatchRulesState;
  keepTurn: boolean;
  foul: boolean;
  toast: string;
  returnedKinds: ('white' | 'black' | 'queen')[];
}

function returnDiscToBoard(bodies: DiscBody[], kind: 'white' | 'black' | 'queen'): boolean {
  const pottedDisc = bodies.find((b) => b.kind === kind && b.potted);
  if (!pottedDisc) return false;
  const spot = findFreeReturnSpot(bodies, pottedDisc.radius);
  pottedDisc.potted = false;
  pottedDisc.pottingAnim = undefined;
  pottedDisc.x = spot.x;
  pottedDisc.y = spot.y;
  pottedDisc.vx = 0;
  pottedDisc.vy = 0;
  return true;
}

function countRemaining(bodies: DiscBody[], kind: 'white' | 'black' | 'queen'): number {
  return bodies.filter((b) => b.kind === kind && !b.potted).length;
}

export function evaluateShot(
  config: ActiveMatchConfig,
  prev: MatchRulesState,
  bodies: DiscBody[],
  pottedThisShot: ('white' | 'black' | 'queen' | 'striker')[]
): ShotOutcome {
  const state: MatchRulesState = {
    ...prev,
    scores: [prev.scores[0], prev.scores[1]],
    teamColors: [prev.teamColors[0], prev.teamColors[1]],
  };

  const activePlayer = config.participants[state.currentSeat];
  const team = activePlayer.team;
  const oppTeam: 0 | 1 = team === 0 ? 1 : 0;
  const ownColor = state.teamColors[team];
  const oppColor = state.teamColors[oppTeam];

  const strikerPotted = pottedThisShot.includes('striker');
  const queenPotted = pottedThisShot.includes('queen');
  const whitePottedCount = pottedThisShot.filter((k) => k === 'white').length;
  const blackPottedCount = pottedThisShot.filter((k) => k === 'black').length;
  const ownPottedCount = ownColor === 'white' ? whitePottedCount : blackPottedCount;
  const oppPottedCount = oppColor === 'white' ? whitePottedCount : blackPottedCount;

  const returnedKinds: ('white' | 'black' | 'queen')[] = [];
  let keepTurn = false;
  let foul = false;
  let toast = '';

  const totalSeats = config.participants.length;
  const nextSeatIndex = (state.currentSeat + 1) % totalSeats;

  // Track user's own stats for events
  if (state.currentSeat === config.mySeatIndex) {
    state.myPucksPottedTotal += whitePottedCount + blackPottedCount;
  }

  // ==================== FREESTYLE MODE ====================
  if (config.mode === 'freestyle') {
    const targetPts = config.arena.targetPoints || 120;
    const pendingKey = team === 0 ? 'pending-team-0' : 'pending-team-1';
    const coveredKey = team === 0 ? 'covered-team-0' : 'covered-team-1';

    if (strikerPotted) {
      foul = true;
      state.scores[team] = Math.max(0, state.scores[team] - 10);
      if (state.queenState === pendingKey || queenPotted) {
        returnDiscToBoard(bodies, 'queen');
        returnedKinds.push('queen');
        state.queenState = 'on-board';
      } else if (returnDiscToBoard(bodies, 'black') || returnDiscToBoard(bodies, 'white')) {
        returnedKinds.push('black');
      }
      toast = 'Foul! Striker potted (-10 pts)';
      keepTurn = false;
    } else {
      const gained = whitePottedCount * 20 + blackPottedCount * 10;
      state.scores[team] += gained;

      if (queenPotted) {
        if (whitePottedCount + blackPottedCount > 0) {
          state.queenState = coveredKey;
          state.scores[team] += 50;
          if (state.currentSeat === config.mySeatIndex) state.myQueensCoveredTotal++;
          toast = 'Queen Covered! +50 Points!';
          keepTurn = true;
        } else {
          state.queenState = pendingKey;
          toast = 'Queen potted! Pot any puck next to cover (+50 pts)';
          keepTurn = true;
        }
      } else if (state.queenState === pendingKey) {
        if (whitePottedCount + blackPottedCount > 0) {
          state.queenState = coveredKey;
          state.scores[team] += 50;
          if (state.currentSeat === config.mySeatIndex) state.myQueensCoveredTotal++;
          toast = 'Queen Covered! +50 Points!';
          keepTurn = true;
        } else {
          returnDiscToBoard(bodies, 'queen');
          returnedKinds.push('queen');
          state.queenState = 'on-board';
          toast = 'Queen not covered — returned to center';
          keepTurn = false;
        }
      } else if (gained > 0) {
        toast = `+${gained} Points! Shoot again`;
        keepTurn = true;
      } else {
        keepTurn = false;
      }
    }

    // Check victory in Freestyle
    const remainingAny =
      countRemaining(bodies, 'white') +
      countRemaining(bodies, 'black') +
      countRemaining(bodies, 'queen');

    if (state.scores[team] >= targetPts) {
      state.winnerTeam = team;
      toast = `${activePlayer.username} reached ${state.scores[team]} pts!`;
    } else if (remainingAny === 0) {
      state.winnerTeam = state.scores[0] >= state.scores[1] ? 0 : 1;
      toast = 'Board cleared!';
    }
  } else {
    // ==================== DISC POOL & CARROM ====================
    const pendingKey = team === 0 ? 'pending-team-0' : 'pending-team-1';
    const coveredKey = team === 0 ? 'covered-team-0' : 'covered-team-1';

    if (strikerPotted) {
      foul = true;
      keepTurn = false;
      if (config.arena.hasQueen && (queenPotted || state.queenState === pendingKey)) {
        returnDiscToBoard(bodies, 'queen');
        returnedKinds.push('queen');
        state.queenState = 'on-board';
      }
      if (returnDiscToBoard(bodies, ownColor)) {
        returnedKinds.push(ownColor);
        toast = 'Foul! Striker potted — 1 puck returned';
      } else {
        toast = 'Foul! Striker potted';
      }
    } else {
      if (config.arena.hasQueen) {
        if (queenPotted) {
          if (ownPottedCount > 0) {
            state.queenState = coveredKey;
            if (state.currentSeat === config.mySeatIndex) state.myQueensCoveredTotal++;
            toast = 'Queen Covered! Great shot!';
            keepTurn = true;
          } else {
            state.queenState = pendingKey;
            toast = 'Queen potted! Pot your puck next to cover it';
            keepTurn = true;
          }
        } else if (state.queenState === pendingKey) {
          if (ownPottedCount > 0) {
            state.queenState = coveredKey;
            if (state.currentSeat === config.mySeatIndex) state.myQueensCoveredTotal++;
            toast = 'Queen Covered! Your turn again';
            keepTurn = true;
          } else {
            returnDiscToBoard(bodies, 'queen');
            returnedKinds.push('queen');
            state.queenState = 'on-board';
            toast = 'Queen not covered — returned to center';
            keepTurn = false;
          }
        } else if (ownPottedCount > 0) {
          keepTurn = true;
          toast = ownPottedCount > 1 ? `Double pot! Shoot again` : 'Nice pot! Shoot again';
        } else if (oppPottedCount > 0) {
          keepTurn = false;
          toast = 'Opponent puck potted!';
        }
      } else {
        // Disc Pool (no Queen)
        if (ownPottedCount > 0) {
          keepTurn = true;
          toast = ownPottedCount > 1 ? 'Multi-pot! Shoot again' : 'Nice shot! Go again';
        } else if (oppPottedCount > 0) {
          keepTurn = false;
          toast = 'Potted opponent puck!';
        }
      }
    }

    // Recompute exact potted counts from board state
    const totalPerColor = config.arena.piecesPerPlayer;
    const t0Color = state.teamColors[0];
    const t1Color = state.teamColors[1];
    state.scores[0] = totalPerColor - countRemaining(bodies, t0Color);
    state.scores[1] = totalPerColor - countRemaining(bodies, t1Color);

    // Check Carrom special case: potting last puck while Queen is still on board
    const remOwn = countRemaining(bodies, ownColor);
    const remOpp = countRemaining(bodies, oppColor);

    if (
      config.arena.hasQueen &&
      remOwn === 0 &&
      (state.queenState === 'on-board' || state.queenState === pendingKey)
    ) {
      // Must pot/cover Queen before clearing final puck: return 1 own puck
      returnDiscToBoard(bodies, ownColor);
      returnedKinds.push(ownColor);
      state.scores[team] = totalPerColor - countRemaining(bodies, ownColor);
      if (state.queenState === pendingKey) {
        returnDiscToBoard(bodies, 'queen');
        state.queenState = 'on-board';
      }
      toast = 'Must pot & cover the Red Queen first!';
      keepTurn = false;
    } else if (remOwn === 0 && remOpp === 0) {
      state.winnerTeam = team;
    } else if (countRemaining(bodies, t0Color) === 0) {
      state.winnerTeam = 0;
    } else if (countRemaining(bodies, t1Color) === 0) {
      state.winnerTeam = 1;
    }
  }

  // Advance seat if not keeping turn and game not won
  if (state.winnerTeam === null) {
    if (!keepTurn) {
      state.currentSeat = nextSeatIndex;
      const nextP = config.participants[state.currentSeat];
      state.statusMessage =
        state.currentSeat === config.mySeatIndex
          ? "It's your turn!"
          : `${nextP.username}'s turn`;
    } else {
      state.statusMessage =
        state.currentSeat === config.mySeatIndex
          ? 'Bonus turn! Shoot again'
          : `${activePlayer.username} shoots again`;
    }
  }

  state.lastTurnPottedCount = ownPottedCount;

  return {
    nextState: state,
    keepTurn,
    foul,
    toast,
    returnedKinds,
  };
}
