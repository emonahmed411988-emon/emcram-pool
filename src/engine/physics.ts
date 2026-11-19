import { DiscBody } from '../types/game';

export const BOARD_SIZE = 1000;
export const PLAY_MIN = 64;
export const PLAY_MAX = 936;
export const POCKET_RADIUS = 44;
export const POCKET_CAPTURE_RADIUS = 37;
export const PUCK_RADIUS = 23;
export const STRIKER_RADIUS = 29.5;
export const PUCK_MASS = 1.0;
export const STRIKER_MASS = 2.4;

export const POCKETS = [
  { x: 96, y: 96 },
  { x: 904, y: 96 },
  { x: 96, y: 904 },
  { x: 904, y: 904 },
];

export const BASELINE_MIN = 228;
export const BASELINE_MAX = 772;
export const BASELINE_BOTTOM_Y = 806;
export const BASELINE_TOP_Y = 194;
export const BASELINE_LEFT_X = 194;
export const BASELINE_RIGHT_X = 806;

export interface BaselineSpec {
  axis: 'x' | 'y';
  fixed: number;
  min: number;
  max: number;
}

export function getBaselineForSeat(seatIndex: number, format: '1v1' | '2v2'): BaselineSpec {
  if (format === '1v1') {
    if (seatIndex === 0) {
      return { axis: 'x', fixed: BASELINE_BOTTOM_Y, min: BASELINE_MIN, max: BASELINE_MAX };
    }
    return { axis: 'x', fixed: BASELINE_TOP_Y, min: BASELINE_MIN, max: BASELINE_MAX };
  }
  // 2v2: 0=bottom (Your team), 1=right (Opp), 2=top (Your partner), 3=left (Opp)
  switch (seatIndex % 4) {
    case 0:
      return { axis: 'x', fixed: BASELINE_BOTTOM_Y, min: BASELINE_MIN, max: BASELINE_MAX };
    case 1:
      return { axis: 'y', fixed: BASELINE_RIGHT_X, min: BASELINE_MIN, max: BASELINE_MAX };
    case 2:
      return { axis: 'x', fixed: BASELINE_TOP_Y, min: BASELINE_MIN, max: BASELINE_MAX };
    default:
      return { axis: 'y', fixed: BASELINE_LEFT_X, min: BASELINE_MIN, max: BASELINE_MAX };
  }
}

export function getStrikerPosOnBaseline(spec: BaselineSpec, norm: number): { x: number; y: number } {
  const clamped = Math.max(0, Math.min(1, norm));
  const coord = spec.min + (spec.max - spec.min) * clamped;
  return spec.axis === 'x' ? { x: coord, y: spec.fixed } : { x: spec.fixed, y: coord };
}

export function createInitialDiscs(piecesPerPlayer: number, hasQueen: boolean): DiscBody[] {
  const discs: DiscBody[] = [];
  const cx = 500;
  const cy = 500;
  const gap = PUCK_RADIUS * 2 + 1.4;

  if (hasQueen) {
    discs.push({
      id: 'queen',
      kind: 'queen',
      x: cx,
      y: cy,
      vx: 0,
      vy: 0,
      radius: PUCK_RADIUS,
      mass: PUCK_MASS,
      potted: false,
    });
  }

  let whiteCount = 0;
  let blackCount = 0;

  if (piecesPerPlayer === 9) {
    // Inner ring of 6 alternating white/black
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3 - Math.PI / 6;
      const isWhite = i % 2 === 0;
      const kind = isWhite ? 'white' : 'black';
      if (isWhite) whiteCount++;
      else blackCount++;
      discs.push({
        id: `${kind}-${isWhite ? whiteCount : blackCount}`,
        kind,
        x: cx + Math.cos(angle) * gap,
        y: cy + Math.sin(angle) * gap,
        vx: 0,
        vy: 0,
        radius: PUCK_RADIUS,
        mass: PUCK_MASS,
        potted: false,
      });
    }

    // Outer hexagonal ring of 12
    const outerSpots: { x: number; y: number; kind: 'white' | 'black' }[] = [];
    for (let i = 0; i < 6; i++) {
      const a1 = (i * Math.PI) / 3 - Math.PI / 6;
      const a2 = ((i + 1) * Math.PI) / 3 - Math.PI / 6;
      // Corner spot
      outerSpots.push({
        x: cx + Math.cos(a1) * gap * 2,
        y: cy + Math.sin(a1) * gap * 2,
        kind: i % 2 === 0 ? 'white' : 'black',
      });
      // Edge midpoint spot
      outerSpots.push({
        x: cx + (Math.cos(a1) + Math.cos(a2)) * gap,
        y: cy + (Math.sin(a1) + Math.sin(a2)) * gap,
        kind: i % 2 === 0 ? 'black' : 'white',
      });
    }
    for (const s of outerSpots) {
      if (s.kind === 'white') whiteCount++;
      else blackCount++;
      discs.push({
        id: `${s.kind}-${s.kind === 'white' ? whiteCount : blackCount}`,
        kind: s.kind,
        x: s.x,
        y: s.y,
        vx: 0,
        vy: 0,
        radius: PUCK_RADIUS,
        mass: PUCK_MASS,
        potted: false,
      });
    }
  } else {
    // 6 pieces per player (Disc Pool Paris Stage style!)
    if (!hasQueen) {
      // Inner triangle of 3 + outer ring of 9 (total 12: 6 white, 6 black)
      const innerR = PUCK_RADIUS * 1.2;
      for (let i = 0; i < 3; i++) {
        const angle = (i * 2 * Math.PI) / 3 - Math.PI / 2;
        const kind = i === 0 ? 'black' : i === 1 ? 'white' : 'black';
        if (kind === 'white') whiteCount++;
        else blackCount++;
        discs.push({
          id: `${kind}-${kind === 'white' ? whiteCount : blackCount}`,
          kind,
          x: cx + Math.cos(angle) * innerR,
          y: cy + Math.sin(angle) * innerR,
          vx: 0,
          vy: 0,
          radius: PUCK_RADIUS,
          mass: PUCK_MASS,
          potted: false,
        });
      }
      const outerR = innerR + gap * 0.96;
      for (let i = 0; i < 9; i++) {
        const angle = (i * 2 * Math.PI) / 9 - Math.PI / 2;
        const kind: 'white' | 'black' = whiteCount < 6 && (i % 2 === 0 || blackCount >= 6) ? 'white' : 'black';
        if (kind === 'white') whiteCount++;
        else blackCount++;
        discs.push({
          id: `${kind}-${kind === 'white' ? whiteCount : blackCount}`,
          kind,
          x: cx + Math.cos(angle) * outerR,
          y: cy + Math.sin(angle) * outerR,
          vx: 0,
          vy: 0,
          radius: PUCK_RADIUS,
          mass: PUCK_MASS,
          potted: false,
        });
      }
    } else {
      // 6 pieces + Queen: 6 in inner ring + 6 in outer petals
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const kind: 'white' | 'black' = i % 2 === 0 ? 'white' : 'black';
        if (kind === 'white') whiteCount++;
        else blackCount++;
        discs.push({
          id: `${kind}-${kind === 'white' ? whiteCount : blackCount}`,
          kind,
          x: cx + Math.cos(angle) * gap,
          y: cy + Math.sin(angle) * gap,
          vx: 0,
          vy: 0,
          radius: PUCK_RADIUS,
          mass: PUCK_MASS,
          potted: false,
        });
      }
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3 + Math.PI / 6;
        const kind: 'white' | 'black' = i % 2 === 0 ? 'black' : 'white';
        if (kind === 'white') whiteCount++;
        else blackCount++;
        discs.push({
          id: `${kind}-${kind === 'white' ? whiteCount : blackCount}`,
          kind,
          x: cx + Math.cos(angle) * (gap * 1.78),
          y: cy + Math.sin(angle) * (gap * 1.78),
          vx: 0,
          vy: 0,
          radius: PUCK_RADIUS,
          mass: PUCK_MASS,
          potted: false,
        });
      }
    }
  }

  // Striker body
  discs.push({
    id: 'striker',
    kind: 'striker',
    x: 500,
    y: BASELINE_BOTTOM_Y,
    vx: 0,
    vy: 0,
    radius: STRIKER_RADIUS,
    mass: STRIKER_MASS,
    potted: false,
  });

  return discs;
}

export function isStrikerPlacementValid(x: number, y: number, bodies: DiscBody[]): boolean {
  for (const b of bodies) {
    if (b.kind === 'striker' || b.potted || b.pottingAnim) continue;
    const dx = b.x - x;
    const dy = b.y - y;
    const minDist = STRIKER_RADIUS + b.radius + 1.5;
    if (dx * dx + dy * dy < minDist * minDist) {
      return false;
    }
  }
  return true;
}

export function findNearestValidBaselineNorm(
  spec: BaselineSpec,
  preferredNorm: number,
  bodies: DiscBody[]
): number {
  const pos = getStrikerPosOnBaseline(spec, preferredNorm);
  if (isStrikerPlacementValid(pos.x, pos.y, bodies)) return preferredNorm;
  for (let offset = 0.03; offset <= 1; offset += 0.03) {
    const right = Math.min(1, preferredNorm + offset);
    const pR = getStrikerPosOnBaseline(spec, right);
    if (isStrikerPlacementValid(pR.x, pR.y, bodies)) return right;
    const left = Math.max(0, preferredNorm - offset);
    const pL = getStrikerPosOnBaseline(spec, left);
    if (isStrikerPlacementValid(pL.x, pL.y, bodies)) return left;
  }
  return preferredNorm;
}

export function findFreeReturnSpot(bodies: DiscBody[], radius = PUCK_RADIUS): { x: number; y: number } {
  const isClear = (x: number, y: number) => {
    if (x < PLAY_MIN + radius + 12 || x > PLAY_MAX - radius - 12) return false;
    if (y < PLAY_MIN + radius + 12 || y > PLAY_MAX - radius - 12) return false;
    for (const b of bodies) {
      if (b.potted || b.kind === 'striker') continue;
      const dx = b.x - x;
      const dy = b.y - y;
      const minD = b.radius + radius + 3;
      if (dx * dx + dy * dy < minD * minD) return false;
    }
    return true;
  };

  if (isClear(500, 500)) return { x: 500, y: 500 };
  for (let r = 12; r < 320; r += 10) {
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 12) {
      const x = 500 + Math.cos(a) * r;
      const y = 500 + Math.sin(a) * r;
      if (isClear(x, y)) return { x, y };
    }
  }
  return { x: 500, y: 500 };
}

export interface StepCallbacks {
  onClack?: (speed: number, x: number, y: number) => void;
  onCushion?: (speed: number, x: number, y: number) => void;
  onPocket?: (disc: DiscBody, pocketX: number, pocketY: number) => void;
}

export function stepPhysics(bodies: DiscBody[], dt: number, cb?: StepCallbacks): boolean {
  const substeps = 6;
  const subDt = Math.min(dt, 0.033) / substeps;
  const restitutionDisc = 0.89;
  const restitutionWall = 0.81;

  for (let s = 0; s < substeps; s++) {
    // 1. Move & apply smooth powder friction
    for (const b of bodies) {
      if (b.potted) continue;
      if (b.pottingAnim) {
        b.pottingAnim.progress += subDt * 6.5;
        b.x += (b.pottingAnim.pocketX - b.x) * 0.25;
        b.y += (b.pottingAnim.pocketY - b.y) * 0.25;
        b.vx *= 0.7;
        b.vy *= 0.7;
        if (b.pottingAnim.progress >= 1) {
          b.potted = true;
          b.vx = 0;
          b.vy = 0;
          b.pottingAnim = undefined;
        }
        continue;
      }

      b.x += b.vx * subDt;
      b.y += b.vy * subDt;

      // Smooth board glide friction (viscous + light Coulomb stop)
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > 0) {
        const dragFactor = Math.exp(-1.55 * subDt);
        const linearDecel = 148 * subDt;
        const nextSpeed = Math.max(0, speed * dragFactor - linearDecel);
        if (nextSpeed < 6) {
          b.vx = 0;
          b.vy = 0;
        } else {
          const scale = nextSpeed / speed;
          b.vx *= scale;
          b.vy *= scale;
        }
      }

      // 2. Check Pocket capture BEFORE wall clamping
      let captured = false;
      for (const p of POCKETS) {
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const dist = Math.hypot(dx, dy);
        // Gentle lip pull near pocket rim
        if (dist < POCKET_RADIUS + 6 && dist > POCKET_CAPTURE_RADIUS) {
          const pull = 360 * subDt;
          b.vx -= (dx / dist) * pull;
          b.vy -= (dy / dist) * pull;
        }
        if (dist <= POCKET_CAPTURE_RADIUS) {
          b.pottingAnim = { pocketX: p.x, pocketY: p.y, progress: 0 };
          cb?.onPocket?.(b, p.x, p.y);
          captured = true;
          break;
        }
      }
      if (captured) continue;

      // 3. Cushion wall collisions
      const minX = PLAY_MIN + b.radius;
      const maxX = PLAY_MAX - b.radius;
      const minY = PLAY_MIN + b.radius;
      const maxY = PLAY_MAX - b.radius;

      if (b.x < minX) {
        b.x = minX;
        const imp = Math.abs(b.vx);
        b.vx = Math.abs(b.vx) * restitutionWall;
        if (imp > 40) cb?.onCushion?.(imp, b.x, b.y);
      } else if (b.x > maxX) {
        b.x = maxX;
        const imp = Math.abs(b.vx);
        b.vx = -Math.abs(b.vx) * restitutionWall;
        if (imp > 40) cb?.onCushion?.(imp, b.x, b.y);
      }

      if (b.y < minY) {
        b.y = minY;
        const imp = Math.abs(b.vy);
        b.vy = Math.abs(b.vy) * restitutionWall;
        if (imp > 40) cb?.onCushion?.(imp, b.x, b.y);
      } else if (b.y > maxY) {
        b.y = maxY;
        const imp = Math.abs(b.vy);
        b.vy = -Math.abs(b.vy) * restitutionWall;
        if (imp > 40) cb?.onCushion?.(imp, b.x, b.y);
      }
    }

    // 4. Disc-to-disc elastic collisions
    for (let i = 0; i < bodies.length; i++) {
      const a = bodies[i];
      if (a.potted || a.pottingAnim) continue;
      for (let j = i + 1; j < bodies.length; j++) {
        const b = bodies[j];
        if (b.potted || b.pottingAnim) continue;

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const distSq = dx * dx + dy * dy;
        const minDist = a.radius + b.radius;

        if (distSq < minDist * minDist && distSq > 1e-6) {
          const dist = Math.sqrt(distSq);
          const nx = dx / dist;
          const ny = dy / dist;

          // Positional overlap separation weighted by inverse mass
          const overlap = minDist - dist;
          const invMassA = 1 / a.mass;
          const invMassB = 1 / b.mass;
          const invMassSum = invMassA + invMassB;

          a.x -= nx * overlap * (invMassA / invMassSum);
          a.y -= ny * overlap * (invMassA / invMassSum);
          b.x += nx * overlap * (invMassB / invMassSum);
          b.y += ny * overlap * (invMassB / invMassSum);

          // Relative velocity along normal
          const rvx = b.vx - a.vx;
          const rvy = b.vy - a.vy;
          const velAlongNormal = rvx * nx + rvy * ny;

          if (velAlongNormal < 0) {
            const jImpulse = (-(1 + restitutionDisc) * velAlongNormal) / invMassSum;
            a.vx -= jImpulse * invMassA * nx;
            a.vy -= jImpulse * invMassA * ny;
            b.vx += jImpulse * invMassB * nx;
            b.vy += jImpulse * invMassB * ny;

            const impactSpeed = Math.abs(velAlongNormal);
            if (impactSpeed > 35) {
              cb?.onClack?.(impactSpeed, (a.x + b.x) / 2, (a.y + b.y) / 2);
            }
          }
        }
      }
    }
  }

  // Return true if any disc is still moving or animating into pocket
  for (const b of bodies) {
    if (b.pottingAnim) return true;
    if (!b.potted && (Math.abs(b.vx) > 2 || Math.abs(b.vy) > 2)) return true;
  }
  return false;
}

export interface AimHitPreview {
  endX: number;
  endY: number;
  hitDisc?: {
    x: number;
    y: number;
    deflectX: number;
    deflectY: number;
  };
}

export function computeAimPreview(
  startX: number,
  startY: number,
  dirX: number,
  dirY: number,
  maxDist: number,
  bodies: DiscBody[]
): AimHitPreview {
  let closestT = maxDist;
  let hitTarget: DiscBody | null = null;

  // Check wall intersections
  const minBound = PLAY_MIN + STRIKER_RADIUS;
  const maxBound = PLAY_MAX - STRIKER_RADIUS;
  if (dirX < -1e-5) closestT = Math.min(closestT, (minBound - startX) / dirX);
  if (dirX > 1e-5) closestT = Math.min(closestT, (maxBound - startX) / dirX);
  if (dirY < -1e-5) closestT = Math.min(closestT, (minBound - startY) / dirY);
  if (dirY > 1e-5) closestT = Math.min(closestT, (maxBound - startY) / dirY);

  // Check swept circle collision against each puck
  for (const b of bodies) {
    if (b.kind === 'striker' || b.potted || b.pottingAnim) continue;
    const ocX = startX - b.x;
    const ocY = startY - b.y;
    const combinedR = STRIKER_RADIUS + b.radius;
    const proj = ocX * dirX + ocY * dirY;
    const c = ocX * ocX + ocY * ocY - combinedR * combinedR;
    const discr = proj * proj - c;
    if (discr >= 0) {
      const t = -proj - Math.sqrt(discr);
      if (t > 0 && t < closestT) {
        closestT = t;
        hitTarget = b;
      }
    }
  }

  const endX = startX + dirX * closestT;
  const endY = startY + dirY * closestT;

  if (hitTarget) {
    const nx = hitTarget.x - endX;
    const ny = hitTarget.y - endY;
    const len = Math.hypot(nx, ny) || 1;
    return {
      endX,
      endY,
      hitDisc: {
        x: hitTarget.x,
        y: hitTarget.y,
        deflectX: hitTarget.x + (nx / len) * 68,
        deflectY: hitTarget.y + (ny / len) * 68,
      },
    };
  }
  return { endX, endY };
}
