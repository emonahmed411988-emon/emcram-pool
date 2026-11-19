import { ArenaDef, CosmeticDef, DiscBody } from '../types/game';
import {
  BASELINE_BOTTOM_Y,
  BASELINE_LEFT_X,
  BASELINE_MAX,
  BASELINE_MIN,
  BASELINE_RIGHT_X,
  BASELINE_TOP_Y,
  BOARD_SIZE,
  computeAimPreview,
  PLAY_MAX,
  PLAY_MIN,
  POCKET_RADIUS,
  POCKETS,
  STRIKER_RADIUS,
} from './physics';

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  size: number;
  color: string;
}

export interface AimOverlayState {
  active: boolean;
  validPlacement: boolean;
  pullX: number; // world vector from striker toward drag point (opposite to launch)
  pullY: number;
  powerNorm: number; // 0..1
  aimStat: number; // 1..10 controls guide line length
  isOpponent?: boolean;
}

export function createBoardCacheCanvas(
  arena: ArenaDef,
  pocketSkin: CosmeticDef
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = BOARD_SIZE;
  canvas.height = BOARD_SIZE;
  const ctx = canvas.getContext('2d')!;

  const { cornerAccent, circleFill, woodTint, ornateCenter } = arena.boardTheme;

  // 1. Outer wooden frame with rounded corners
  const frameGrad = ctx.createLinearGradient(0, 0, BOARD_SIZE, BOARD_SIZE);
  frameGrad.addColorStop(0, '#5a3122');
  frameGrad.addColorStop(0.5, '#3b1c12');
  frameGrad.addColorStop(1, '#260f09');

  drawRoundedRect(ctx, 4, 4, BOARD_SIZE - 8, BOARD_SIZE - 8, 52);
  ctx.fillStyle = frameGrad;
  ctx.fill();

  // Golden/Orange metallic corner bumpers (matches Screenshots 3, 9, 12, 13!)
  ctx.save();
  drawRoundedRect(ctx, 4, 4, BOARD_SIZE - 8, BOARD_SIZE - 8, 52);
  ctx.clip();
  const cornerSize = 112;
  const cornerSpots = [
    [0, 0],
    [BOARD_SIZE - cornerSize, 0],
    [0, BOARD_SIZE - cornerSize],
    [BOARD_SIZE - cornerSize, BOARD_SIZE - cornerSize],
  ];
  for (const [cx, cy] of cornerSpots) {
    const cg = ctx.createLinearGradient(cx, cy, cx + cornerSize, cy + cornerSize);
    cg.addColorStop(0, '#ffe373');
    cg.addColorStop(0.5, cornerAccent);
    cg.addColorStop(1, '#b45309');
    ctx.fillStyle = cg;
    ctx.fillRect(cx, cy, cornerSize, cornerSize);
  }
  ctx.restore();

  // Outer highlight bevel
  drawRoundedRect(ctx, 7, 7, BOARD_SIZE - 14, BOARD_SIZE - 14, 49);
  ctx.strokeStyle = 'rgba(255,230,190,0.28)';
  ctx.lineWidth = 4;
  ctx.stroke();

  // 2. Inner Wood Playing Surface
  const playW = PLAY_MAX - PLAY_MIN;
  ctx.save();
  drawRoundedRect(ctx, PLAY_MIN, PLAY_MIN, playW, playW, 24);
  ctx.clip();

  // Base wood gradient
  const woodGrad = ctx.createRadialGradient(500, 480, 60, 500, 500, 650);
  woodGrad.addColorStop(0, '#ecc59b');
  woodGrad.addColorStop(0.55, woodTint);
  woodGrad.addColorStop(1, '#b67d4e');
  ctx.fillStyle = woodGrad;
  ctx.fillRect(PLAY_MIN, PLAY_MIN, playW, playW);

  // Subtle horizontal wood grain fibers
  for (let y = PLAY_MIN; y < PLAY_MAX; y += 3) {
    const wave = Math.sin(y * 0.045) * 0.025 + Math.cos(y * 0.13) * 0.015;
    ctx.fillStyle = wave > 0 ? `rgba(255,240,220,${wave})` : `rgba(110,55,15,${-wave * 1.4})`;
    ctx.fillRect(PLAY_MIN, y, playW, 2.2);
  }
  // Fine darker streaks
  for (let i = 0; i < 42; i++) {
    const y = PLAY_MIN + ((i * 23.7) % playW);
    ctx.strokeStyle = `rgba(115, 62, 24, ${0.05 + (i % 4) * 0.015})`;
    ctx.lineWidth = 1 + (i % 2);
    ctx.beginPath();
    ctx.moveTo(PLAY_MIN, y);
    ctx.bezierCurveTo(
      340,
      y + Math.sin(i) * 8,
      660,
      y - Math.cos(i) * 8,
      PLAY_MAX,
      y + Math.sin(i * 2) * 4
    );
    ctx.stroke();
  }

  // Inner edge shadow cast by frame
  ctx.strokeStyle = 'rgba(40, 15, 4, 0.55)';
  ctx.lineWidth = 18;
  drawRoundedRect(ctx, PLAY_MIN - 2, PLAY_MIN - 2, playW + 4, playW + 4, 26);
  ctx.stroke();

  // 3. Engraved Carrom Markings
  const lineColor = '#7d441b';
  const accentLine = '#a35d28';

  // Center Circle (Ornate lotus/mandala for Delhi/Carrom, clean circle for Paris Disc Pool)
  const centerR = 162;
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3.2;
  ctx.beginPath();
  ctx.arc(500, 500, centerR, 0, Math.PI * 2);
  ctx.stroke();

  if (ornateCenter) {
    ctx.strokeStyle = 'rgba(135, 72, 25, 0.55)';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(500, 500, centerR - 22, 0, Math.PI * 2);
    ctx.stroke();

    // Decorative geometric petals inside ring (matching Screenshot 3!)
    ctx.save();
    ctx.translate(500, 500);
    for (let i = 0; i < 16; i++) {
      ctx.rotate((Math.PI * 2) / 16);
      ctx.beginPath();
      ctx.moveTo(centerR - 22, 0);
      ctx.lineTo(centerR - 11, 14);
      ctx.lineTo(centerR, 0);
      ctx.lineTo(centerR - 11, -14);
      ctx.closePath();
      ctx.fillStyle = i % 2 === 0 ? 'rgba(176, 102, 42, 0.25)' : 'rgba(128, 65, 20, 0.16)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(128, 65, 20, 0.45)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
    ctx.restore();

    // Inner queen dot circle
    ctx.beginPath();
    ctx.arc(500, 500, 28, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(185, 70, 25, 0.18)';
    ctx.fill();
    ctx.strokeStyle = accentLine;
    ctx.lineWidth = 2.4;
    ctx.stroke();
  }

  // 4 Double Baselines + 8 End Circles
  const halfTrack = 23;
  const drawBaseline = (x1: number, y1: number, x2: number, y2: number, horiz: boolean) => {
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.8;
    if (horiz) {
      ctx.beginPath();
      ctx.moveTo(x1, y1 - halfTrack);
      ctx.lineTo(x2, y2 - halfTrack);
      ctx.moveTo(x1, y1 + halfTrack);
      ctx.lineTo(x2, y2 + halfTrack);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.moveTo(x1 - halfTrack, y1);
      ctx.lineTo(x2 - halfTrack, y2);
      ctx.moveTo(x1 + halfTrack, y1);
      ctx.lineTo(x2 + halfTrack, y2);
      ctx.stroke();
    }

    // End circles
    for (const [ex, ey] of [
      [x1, y1],
      [x2, y2],
    ]) {
      ctx.beginPath();
      ctx.arc(ex, ey, halfTrack + 4, 0, Math.PI * 2);
      ctx.fillStyle = '#5c2d0d';
      ctx.fill();

      const cg = ctx.createRadialGradient(ex - 5, ey - 5, 3, ex, ey, halfTrack + 2);
      cg.addColorStop(0, '#fcd34d');
      cg.addColorStop(0.55, circleFill);
      cg.addColorStop(1, '#9a3412');
      ctx.beginPath();
      ctx.arc(ex, ey, halfTrack + 1, 0, Math.PI * 2);
      ctx.fillStyle = cg;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(ex, ey, halfTrack - 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,240,200,0.45)';
      ctx.lineWidth = 1.6;
      ctx.stroke();
    }
  };

  drawBaseline(BASELINE_MIN, BASELINE_BOTTOM_Y, BASELINE_MAX, BASELINE_BOTTOM_Y, true);
  drawBaseline(BASELINE_MIN, BASELINE_TOP_Y, BASELINE_MAX, BASELINE_TOP_Y, true);
  drawBaseline(BASELINE_LEFT_X, BASELINE_MIN, BASELINE_LEFT_X, BASELINE_MAX, false);
  drawBaseline(BASELINE_RIGHT_X, BASELINE_MIN, BASELINE_RIGHT_X, BASELINE_MAX, false);

  // 4. Corner Pockets (using equipped Pocket cosmetic!)
  for (const p of POCKETS) {
    // Rim glow
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_RADIUS + 4, 0, Math.PI * 2);
    ctx.fillStyle = pocketSkin.secondaryColor;
    ctx.fill();

    // Deep hole gradient
    const pg = ctx.createRadialGradient(p.x + 5, p.y + 5, 6, p.x, p.y, POCKET_RADIUS);
    pg.addColorStop(0, '#000000');
    pg.addColorStop(0.72, pocketSkin.primaryColor);
    pg.addColorStop(1, '#292524');
    ctx.beginPath();
    ctx.arc(p.x, p.y, POCKET_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = pg;
    ctx.fill();

    // Pocket cosmetic accent inner ring
    if (pocketSkin.id !== 'pocket-classic') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, POCKET_RADIUS - 2, 0, Math.PI * 2);
      ctx.strokeStyle = pocketSkin.accentColor;
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  ctx.restore();
  return canvas;
}

function drawRoundedRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function renderBoardFrame(
  ctx: CanvasRenderingContext2D,
  boardCache: HTMLCanvasElement,
  bodies: DiscBody[],
  puckSkin: CosmeticDef,
  strikerId: string,
  aim: AimOverlayState,
  particles: Particle[],
  canInteract: boolean,
  timeMs: number
) {
  ctx.clearRect(0, 0, BOARD_SIZE, BOARD_SIZE);
  ctx.drawImage(boardCache, 0, 0);

  // 1. Draw Particles (trails & pocket bursts)
  for (const pt of particles) {
    const alpha = Math.max(0, pt.life / pt.maxLife);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size * (0.4 + alpha * 0.6), 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 2. Draw Pucks (non-striker bodies)
  for (const b of bodies) {
    if (b.potted || b.kind === 'striker') continue;
    const scale = b.pottingAnim ? Math.max(0.15, 1 - b.pottingAnim.progress * 0.85) : 1;
    drawPuck(ctx, b.x, b.y, b.radius * scale, b.kind, puckSkin);
  }

  // 3. Draw Striker & Aiming Overlay
  const striker = bodies.find((b) => b.kind === 'striker');
  if (striker && !striker.potted) {
    const scale = striker.pottingAnim ? Math.max(0.15, 1 - striker.pottingAnim.progress * 0.85) : 1;

    // Ready glow halo beneath striker (matches Screenshots 3 & 9!)
    if (canInteract && !aim.active && !striker.pottingAnim) {
      const pulse = 0.55 + 0.35 * Math.sin(timeMs * 0.006);
      const haloColor = aim.validPlacement
        ? `rgba(251, 191, 36, ${pulse})`
        : `rgba(239, 68, 68, ${0.75})`;
      const hg = ctx.createRadialGradient(
        striker.x,
        striker.y,
        STRIKER_RADIUS * 0.7,
        striker.x,
        striker.y,
        STRIKER_RADIUS + 20
      );
      hg.addColorStop(0, haloColor);
      hg.addColorStop(1, 'rgba(251, 191, 36, 0)');
      ctx.fillStyle = hg;
      ctx.beginPath();
      ctx.arc(striker.x, striker.y, STRIKER_RADIUS + 20, 0, Math.PI * 2);
      ctx.fill();
    }

    // Aim overlay (Dotted boundary ring + Pull dots + Gradient Arrow + White Trajectory Dots — matches Screenshots 12 & 13!)
    if (aim.active && aim.validPlacement && aim.powerNorm > 0.05) {
      drawAimOverlay(ctx, striker, aim, bodies);
    }

    drawStriker(ctx, striker.x, striker.y, striker.radius * scale, strikerId, !aim.validPlacement && canInteract);
  }
}

function drawPuck(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  kind: 'white' | 'black' | 'queen',
  skin: CosmeticDef
) {
  ctx.save();
  // Drop shadow
  ctx.beginPath();
  ctx.arc(x + 2.5, y + 4.5, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.36)';
  ctx.fill();

  let mainLight = skin.primaryColor;
  let mainDark = '#c9b393';
  let grooveColor = 'rgba(130, 95, 55, 0.45)';
  let edgeColor = '#9f825e';

  if (kind === 'black') {
    mainLight = '#464652';
    mainDark = skin.secondaryColor;
    grooveColor = 'rgba(255, 255, 255, 0.17)';
    edgeColor = '#09090b';
  } else if (kind === 'queen') {
    mainLight = '#ff5464';
    mainDark = skin.accentColor;
    grooveColor = 'rgba(255, 225, 225, 0.42)';
    edgeColor = '#881337';
  }

  const grad = ctx.createRadialGradient(x - r * 0.32, y - r * 0.32, r * 0.1, x, y, r);
  grad.addColorStop(0, mainLight);
  grad.addColorStop(1, mainDark);

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
  ctx.strokeStyle = edgeColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Concentric lathe grooves (authentic carrom disc look)
  ctx.strokeStyle = grooveColor;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, r * 0.44, 0, Math.PI * 2);
  ctx.stroke();

  // Gloss specular glint
  ctx.beginPath();
  ctx.arc(x - r * 0.28, y - r * 0.28, r * 0.2, 0, Math.PI * 2);
  ctx.fillStyle = kind === 'black' ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.38)';
  ctx.fill();

  ctx.restore();
}

function drawStriker(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  strikerId: string,
  invalid: boolean
) {
  ctx.save();
  // Drop shadow
  ctx.beginPath();
  ctx.arc(x + 3, y + 5, r, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0,0,0,0.42)';
  ctx.fill();

  // Base disc style per striker
  const isDark = ['astro', 'pulse', 'aura', 'vortex'].includes(strikerId);
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 2, x, y, r);

  if (invalid) {
    grad.addColorStop(0, '#fca5a5');
    grad.addColorStop(1, '#dc2626');
  } else if (strikerId === 'astro') {
    grad.addColorStop(0, '#334155');
    grad.addColorStop(1, '#090d1a');
  } else if (strikerId === 'pulse') {
    grad.addColorStop(0, '#1e3a8a');
    grad.addColorStop(1, '#020617');
  } else if (strikerId === 'aura') {
    grad.addColorStop(0, '#3f1d2b');
    grad.addColorStop(1, '#11070a');
  } else if (strikerId === 'trace') {
    grad.addColorStop(0, '#38bdf8');
    grad.addColorStop(1, '#1e3a8a');
  } else if (strikerId === 'toran') {
    grad.addColorStop(0, '#dc2626');
    grad.addColorStop(1, '#7f1d1d');
  } else if (strikerId === 'vortex') {
    grad.addColorStop(0, '#c026d3');
    grad.addColorStop(1, '#4a044e');
  } else if (strikerId === 'ember') {
    grad.addColorStop(0, '#fb923c');
    grad.addColorStop(1, '#9a3412');
  } else {
    // Blaze (Classic ivory white with orange mandala!)
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.75, '#f7ebd9');
    grad.addColorStop(1, '#d8be9a');
  }

  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();

  // Outer bevel ring
  ctx.lineWidth = 2.6;
  ctx.strokeStyle = invalid
    ? '#fee2e2'
    : strikerId === 'toran'
      ? '#facc15'
      : strikerId === 'trace'
        ? '#67e8f9'
        : isDark
          ? '#64748b'
          : '#b48a5a';
  ctx.stroke();

  // Center signature emblem
  ctx.translate(x, y);
  if (strikerId === 'pulse') {
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-r * 0.62, 0);
    ctx.lineTo(-r * 0.25, 0);
    ctx.lineTo(-r * 0.1, -r * 0.42);
    ctx.lineTo(r * 0.1, r * 0.42);
    ctx.lineTo(r * 0.25, 0);
    ctx.lineTo(r * 0.62, 0);
    ctx.stroke();
  } else if (strikerId === 'astro') {
    ctx.fillStyle = '#e2e8f0';
    ctx.beginPath();
    ctx.moveTo(0, -r * 0.58);
    ctx.lineTo(r * 0.16, 0);
    ctx.lineTo(0, r * 0.58);
    ctx.lineTo(-r * 0.16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.66, 0, Math.PI * 2);
    ctx.stroke();
  } else if (strikerId === 'aura') {
    ctx.fillStyle = '#e11d48';
    for (let i = 0; i < 6; i++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.3, r * 0.15, r * 0.28, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  } else {
    // Blaze / Toran ornate lotus flower mandala
    ctx.strokeStyle = strikerId === 'toran' ? '#fde047' : '#ea580c';
    ctx.lineWidth = 1.6;
    for (let i = 0; i < 8; i++) {
      ctx.rotate(Math.PI / 4);
      ctx.beginPath();
      ctx.ellipse(0, -r * 0.32, r * 0.13, r * 0.27, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.16, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawAimOverlay(
  ctx: CanvasRenderingContext2D,
  striker: DiscBody,
  aim: AimOverlayState,
  bodies: DiscBody[]
) {
  const pullDist = Math.hypot(aim.pullX, aim.pullY);
  if (pullDist < 4) return;

  // Launch direction is OPPOSITE to pull vector
  const dirX = -aim.pullX / pullDist;
  const dirY = -aim.pullY / pullDist;
  const ringRadius = Math.max(66, Math.min(185, 58 + aim.powerNorm * 130));

  ctx.save();

  // 1. Subtle shaded aim circle + dotted ring (Matches Screenshots 12 & 13!)
  ctx.beginPath();
  ctx.arc(striker.x, striker.y, ringRadius, 0, Math.PI * 2);
  ctx.fillStyle = 'rgba(0, 0, 0, 0.08)';
  ctx.fill();
  ctx.setLineDash([4, 6]);
  ctx.strokeStyle = 'rgba(20, 10, 5, 0.72)';
  ctx.lineWidth = 2.4;
  ctx.stroke();
  ctx.setLineDash([]);

  // 2. Dark pull-back dots behind striker
  const backDots = Math.max(3, Math.round(aim.powerNorm * 7));
  for (let i = 1; i <= backDots; i++) {
    const t = STRIKER_RADIUS + 14 + i * 20;
    const dx = striker.x - dirX * t;
    const dy = striker.y - dirY * t;
    ctx.beginPath();
    ctx.arc(dx, dy, 4.5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(30, 18, 12, ${0.75 - i * 0.08})`;
    ctx.fill();
  }

  // 3. Gradient Power Arrow pointing forward (Red -> Orange -> Yellow)
  const arrowStart = STRIKER_RADIUS + 10;
  const arrowLen = 35 + aim.powerNorm * 115;
  const tipX = striker.x + dirX * (arrowStart + arrowLen);
  const tipY = striker.y + dirY * (arrowStart + arrowLen);
  const baseX = striker.x + dirX * arrowStart;
  const baseY = striker.y + dirY * arrowStart;
  const perpX = -dirY;
  const perpY = dirX;
  const headLen = 24;
  const shaftEndX = tipX - dirX * headLen;
  const shaftEndY = tipY - dirY * headLen;

  const arrowGrad = ctx.createLinearGradient(baseX, baseY, tipX, tipY);
  arrowGrad.addColorStop(0, '#dc2626');
  arrowGrad.addColorStop(0.55, '#f97316');
  arrowGrad.addColorStop(1, '#facc15');

  ctx.beginPath();
  ctx.moveTo(baseX + perpX * 5, baseY + perpY * 5);
  ctx.lineTo(shaftEndX + perpX * 6, shaftEndY + perpY * 6);
  ctx.lineTo(shaftEndX + perpX * 15, shaftEndY + perpY * 15);
  ctx.lineTo(tipX, tipY);
  ctx.lineTo(shaftEndX - perpX * 15, shaftEndY - perpY * 15);
  ctx.lineTo(shaftEndX - perpX * 6, shaftEndY - perpY * 6);
  ctx.lineTo(baseX - perpX * 5, baseY - perpY * 5);
  ctx.closePath();
  ctx.fillStyle = arrowGrad;
  ctx.fill();
  ctx.strokeStyle = '#5c1908';
  ctx.lineWidth = 2.4;
  ctx.stroke();

  // 4. White dotted trajectory guide line forward (length scales with Striker Aim stat!)
  const maxGuideDist = 240 + aim.aimStat * 42;
  const preview = computeAimPreview(striker.x, striker.y, dirX, dirY, maxGuideDist, bodies);
  const totalPreviewDist = Math.hypot(preview.endX - striker.x, preview.endY - striker.y);
  const dotsStart = arrowStart + arrowLen + 14;

  for (let d = dotsStart; d < totalPreviewDist - 8; d += 22) {
    const px = striker.x + dirX * d;
    const py = striker.y + dirY * d;
    const fade = Math.max(0.25, 1 - (d - dotsStart) / Math.max(120, maxGuideDist));
    ctx.beginPath();
    ctx.arc(px, py, 5.2, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${fade})`;
    ctx.fill();
    ctx.strokeStyle = `rgba(0, 0, 0, ${fade * 0.45})`;
    ctx.lineWidth = 1.4;
    ctx.stroke();
  }

  // Ghost target impact hint if Aim stat >= 3 or aiming directly at a puck
  if (preview.hitDisc) {
    ctx.beginPath();
    ctx.arc(preview.endX, preview.endY, STRIKER_RADIUS * 0.9, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.45)';
    ctx.lineWidth = 2;
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);

    if (aim.aimStat >= 2) {
      ctx.beginPath();
      ctx.moveTo(preview.hitDisc.x, preview.hitDisc.y);
      ctx.lineTo(preview.hitDisc.deflectX, preview.hitDisc.deflectY);
      ctx.strokeStyle = 'rgba(250, 204, 21, 0.72)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  ctx.restore();
}
