import { ActiveMatchConfig, DiscBody } from '../types/game';
import {
  getBaselineForSeat,
  getStrikerPosOnBaseline,
  isStrikerPlacementValid,
  POCKETS,
  PUCK_RADIUS,
  STRIKER_RADIUS,
} from './physics';
import { MatchRulesState } from './rules';

export interface AiShotPlan {
  baselineNorm: number;
  dirX: number;
  dirY: number;
  powerNorm: number; // 0.25 .. 1.0
}

function isSegmentClear(
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  clearanceRadius: number,
  bodies: DiscBody[],
  ignoreIds: Set<string>
): boolean {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq < 1) return true;

  for (const b of bodies) {
    if (b.potted || b.kind === 'striker' || ignoreIds.has(b.id)) continue;
    const t = Math.max(0, Math.min(1, ((b.x - x1) * dx + (b.y - y1) * dy) / lenSq));
    const px = x1 + t * dx;
    const py = y1 + t * dy;
    const dist = Math.hypot(b.x - px, b.y - py);
    if (dist < clearanceRadius + b.radius - 3) {
      return false;
    }
  }
  return true;
}

export function computeAiShot(
  config: ActiveMatchConfig,
  rules: MatchRulesState,
  bodies: DiscBody[],
  seatIndex: number
): AiShotPlan {
  const skill = config.arena.aiSkill; // 0.54 .. 0.90
  const baseline = getBaselineForSeat(seatIndex, config.format);
  const team = config.participants[seatIndex].team;
  const ownColor = rules.teamColors[team];

  // Collect valid targets
  let targets = bodies.filter((b) => {
    if (b.potted || b.kind === 'striker') return false;
    if (config.mode === 'freestyle') return true;
    if (config.arena.hasQueen && b.kind === 'queen') return true;
    return b.kind === ownColor;
  });

  if (targets.length === 0) {
    targets = bodies.filter((b) => !b.potted && b.kind !== 'striker');
  }

  let bestScore = -Infinity;
  let bestPlan: AiShotPlan | null = null;

  // Sample 15 positions across baseline
  const samples = 15;
  for (let i = 0; i < samples; i++) {
    const norm = 0.05 + (i / (samples - 1)) * 0.9;
    const sPos = getStrikerPosOnBaseline(baseline, norm);
    if (!isStrikerPlacementValid(sPos.x, sPos.y, bodies)) continue;

    for (const target of targets) {
      for (const pocket of POCKETS) {
        const tpX = pocket.x - target.x;
        const tpY = pocket.y - target.y;
        const distTP = Math.hypot(tpX, tpY);
        if (distTP < 10) continue;
        const uTPx = tpX / distTP;
        const uTPy = tpY / distTP;

        // Ghost striker impact point
        const contactDist = STRIKER_RADIUS + PUCK_RADIUS - 1;
        const ghostX = target.x - uTPx * contactDist;
        const ghostY = target.y - uTPy * contactDist;

        const sgX = ghostX - sPos.x;
        const sgY = ghostY - sPos.y;
        const distSG = Math.hypot(sgX, sgY);
        if (distSG < 24) continue;
        const uSGx = sgX / distSG;
        const uSGy = sgY / distSG;

        // Cut angle alignment (1.0 = dead straight)
        const alignment = uSGx * uTPx + uSGy * uTPy;
        if (alignment < 0.36) continue;

        const ignore = new Set<string>([target.id]);
        const pathToGhostClear = isSegmentClear(
          sPos.x,
          sPos.y,
          ghostX,
          ghostY,
          STRIKER_RADIUS * 0.86,
          bodies,
          ignore
        );
        const pathToPocketClear = isSegmentClear(
          target.x,
          target.y,
          pocket.x,
          pocket.y,
          PUCK_RADIUS * 0.88,
          bodies,
          ignore
        );

        let score = alignment * 120 - distTP * 0.09 - distSG * 0.06;
        if (pathToGhostClear) score += 75;
        if (pathToPocketClear) score += 90;

        // Prioritize Queen or high value white pucks in freestyle
        if (target.kind === 'queen') score += 32;
        if (config.mode === 'freestyle' && target.kind === 'white') score += 22;

        // Slight penalty if striker would fly straight into a pocket after hit
        if (alignment > 0.96 && distTP < 150) score -= 22;

        if (score > bestScore) {
          bestScore = score;
          const power = Math.min(
            0.96,
            Math.max(0.38, 0.36 + (distSG + distTP) / 1450 + (1 - alignment) * 0.25)
          );
          bestPlan = {
            baselineNorm: norm,
            dirX: uSGx,
            dirY: uSGy,
            powerNorm: power,
          };
        }
      }
    }
  }

  // Fallback: break shot toward center cluster or nearest target
  if (!bestPlan || bestScore < 45) {
    const norm = 0.35 + Math.random() * 0.3;
    const sPos = getStrikerPosOnBaseline(baseline, norm);
    const focus = targets[Math.floor(Math.random() * targets.length)] || { x: 500, y: 500 };
    const dx = focus.x - sPos.x;
    const dy = focus.y - sPos.y;
    const len = Math.hypot(dx, dy) || 1;
    bestPlan = {
      baselineNorm: norm,
      dirX: dx / len,
      dirY: dy / len,
      powerNorm: 0.78 + Math.random() * 0.18,
    };
  }

  // Apply realistic human/skill imperfection jitter
  const maxErrRad = (1 - skill) * 0.13; // ~1.5° to ~6°
  const angleErr = (Math.random() * 2 - 1) * maxErrRad;
  const cos = Math.cos(angleErr);
  const sin = Math.sin(angleErr);
  const rx = bestPlan.dirX * cos - bestPlan.dirY * sin;
  const ry = bestPlan.dirX * sin + bestPlan.dirY * cos;

  return {
    baselineNorm: bestPlan.baselineNorm,
    dirX: rx,
    dirY: ry,
    powerNorm: Math.min(1, Math.max(0.3, bestPlan.powerNorm + (Math.random() - 0.5) * 0.08)),
  };
}
