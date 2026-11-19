import React, { useEffect, useRef, useState } from 'react';
import { X, Target } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { sound } from '../../engine/sound';

export const LuckyShotModal: React.FC = () => {
  const { setActiveModal, grantLuckyShotReward } = useGame();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [shotTaken, setShotTaken] = useState(false);
  const [resultText, setResultText] = useState('Drag back from the puck and land inside the Golden Bullseye!');

  const stateRef = useRef({
    puckX: 160,
    puckY: 270,
    vx: 0,
    vy: 0,
    targetX: 160,
    targetY: 96,
    dragging: false,
    pullX: 0,
    pullY: 0,
    moving: false,
    finished: false,
  });

  useEffect(() => {
    let raf = 0;
    let last = performance.now();

    const draw = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000);
      last = now;
      const s = stateRef.current;

      if (s.moving) {
        s.puckX += s.vx * dt;
        s.puckY += s.vy * dt;
        const spd = Math.hypot(s.vx, s.vy);
        const nextSpd = Math.max(0, spd * Math.exp(-2.1 * dt) - 110 * dt);
        if (nextSpd < 5) {
          s.vx = 0;
          s.vy = 0;
          s.moving = false;
          if (!s.finished) {
            s.finished = true;
            const d = Math.hypot(s.puckX - s.targetX, s.puckY - s.targetY);
            if (d <= 20) {
              setResultText('BULLSEYE!! Won Legend Chest + 1,000 Coins!');
              grantLuckyShotReward(1000, 10, 'gold');
            } else if (d <= 44) {
              setResultText('RED RING! Won +12 Gems & +500 Coins!');
              grantLuckyShotReward(500, 12);
            } else if (d <= 72) {
              setResultText('BLUE RING! Won +600 Coins!');
              grantLuckyShotReward(600, 0);
            } else if (d <= 98) {
              setResultText('OUTER RING! Won +250 Coins!');
              grantLuckyShotReward(250, 0);
            } else {
              sound.playFoul();
              setResultText('Missed the rings! Try Lucky Shot again!');
            }
          }
        } else {
          s.vx = (s.vx / spd) * nextSpd;
          s.vy = (s.vy / spd) * nextSpd;
        }
        // Bounce inside mini board
        if (s.puckX < 24) { s.puckX = 24; s.vx = Math.abs(s.vx) * 0.8; sound.playCushion(spd); }
        if (s.puckX > 296) { s.puckX = 296; s.vx = -Math.abs(s.vx) * 0.8; sound.playCushion(spd); }
        if (s.puckY < 24) { s.puckY = 24; s.vy = Math.abs(s.vy) * 0.8; sound.playCushion(spd); }
        if (s.puckY > 316) { s.puckY = 316; s.vy = -Math.abs(s.vy) * 0.8; sound.playCushion(spd); }
      }

      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d')!;
        // Wood surface
        ctx.fillStyle = '#ddb082';
        ctx.fillRect(0, 0, 320, 340);
        ctx.strokeStyle = '#5c2c12';
        ctx.lineWidth = 14;
        ctx.strokeRect(0, 0, 320, 340);

        // Concentric Target Rings
        const rings = [
          { r: 95, color: '#f8fafc' },
          { r: 70, color: '#2563eb' },
          { r: 44, color: '#dc2626' },
          { r: 20, color: '#facc15' },
        ];
        for (const ring of rings) {
          ctx.beginPath();
          ctx.arc(s.targetX, s.targetY, ring.r, 0, Math.PI * 2);
          ctx.fillStyle = ring.color;
          ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,0.3)';
          ctx.lineWidth = 2;
          ctx.stroke();
        }

        // Aim arrow
        if (s.dragging) {
          const dist = Math.hypot(s.pullX, s.pullY);
          if (dist > 8) {
            const dx = -s.pullX / dist;
            const dy = -s.pullY / dist;
            const len = Math.min(95, dist);
            ctx.strokeStyle = '#f97316';
            ctx.lineWidth = 5;
            ctx.beginPath();
            ctx.moveTo(s.puckX, s.puckY);
            ctx.lineTo(s.puckX + dx * len, s.puckY + dy * len);
            ctx.stroke();
          }
        }

        // Golden Puck
        ctx.beginPath();
        ctx.arc(s.puckX, s.puckY, 16, 0, Math.PI * 2);
        ctx.fillStyle = '#fffaf0';
        ctx.fill();
        ctx.strokeStyle = '#ea580c';
        ctx.lineWidth = 3.5;
        ctx.stroke();
      }
      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(raf);
  }, [grantLuckyShotReward]);

  const toLocal = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / r.width) * 320,
      y: ((e.clientY - r.top) / r.height) * 340,
    };
  };

  return (
    <div className="absolute inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="wood-panel rounded-2xl p-4 w-full max-w-[340px] relative animate-pop text-center space-y-2.5">
        <button
          onClick={() => setActiveModal(null)}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center"
        >
          <X className="w-4 h-4 text-white stroke-[3]" />
        </button>

        <div className="flex items-center justify-center gap-1.5">
          <Target className="w-5 h-5 text-yellow-300" />
          <h2 className="text-xl font-black text-yellow-300 text-stroke-sm">Lucky Shot</h2>
        </div>

        <p className="text-xs font-bold text-amber-100 min-h-[32px]">{resultText}</p>

        <canvas
          ref={canvasRef}
          width={320}
          height={340}
          onPointerDown={(e) => {
            if (shotTaken) return;
            sound.unlock();
            const pt = toLocal(e);
            const s = stateRef.current;
            if (Math.hypot(pt.x - s.puckX, pt.y - s.puckY) < 50) {
              s.dragging = true;
              e.currentTarget.setPointerCapture(e.pointerId);
            }
          }}
          onPointerMove={(e) => {
            const s = stateRef.current;
            if (!s.dragging) return;
            const pt = toLocal(e);
            s.pullX = pt.x - s.puckX;
            s.pullY = pt.y - s.puckY;
          }}
          onPointerUp={() => {
            const s = stateRef.current;
            if (!s.dragging) return;
            s.dragging = false;
            const dist = Math.hypot(s.pullX, s.pullY);
            if (dist < 10) return;
            const power = Math.min(1, dist / 110);
            s.vx = (-s.pullX / dist) * (260 + power * 660);
            s.vy = (-s.pullY / dist) * (260 + power * 660);
            s.moving = true;
            setShotTaken(true);
            sound.playStrike(power);
          }}
          className="w-full rounded-xl border-2 border-amber-300 shadow-lg touch-none cursor-pointer"
        />

        {shotTaken && stateRef.current.finished && (
          <button
            onClick={() => {
              stateRef.current = {
                puckX: 160,
                puckY: 270,
                vx: 0,
                vy: 0,
                targetX: 110 + Math.random() * 100,
                targetY: 88 + Math.random() * 25,
                dragging: false,
                pullX: 0,
                pullY: 0,
                moving: false,
                finished: false,
              };
              setShotTaken(false);
              setResultText('Aim for the Golden Bullseye for a Gold Chest!');
            }}
            className="btn-green w-full py-2 rounded-xl text-sm font-extrabold text-white text-stroke-sm"
          >
            Shoot Again
          </button>
        )}
      </div>
    </div>
  );
};
