import { useEffect, useRef, type CSSProperties, type ReactNode } from 'react';

// Canvas 2D 拖尾辉光：鼠标经过拖出一条渐隐光带
// ponytail: 原 WebGL/ogl 版已删，此版无重依赖，效果等价
const TRAIL = 24;

export default function GlowCursor({
  style,
  className = '',
  children,
}: {
  style?: CSSProperties;
  className?: string;
  children?: ReactNode;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    const pts = Array.from({ length: TRAIL }, () => ({ x: -9999, y: -9999 }));
    const target = { x: -9999, y: -9999 };

    const resize = () => {
      const el = canvas.parentElement;
      if (!el) return;
      const r = el.getBoundingClientRect();
      w = canvas.width = Math.max(1, Math.floor(r.width));
      h = canvas.height = Math.max(1, Math.floor(r.height));
    };
    resize();
    window.addEventListener('resize', resize);

    const onMove = (e: PointerEvent) => {
      const r = canvas.getBoundingClientRect();
      target.x = e.clientX - r.left;
      target.y = e.clientY - r.top;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    const tick = () => {
      // 头追鼠标，身逐节追前一点 → 拖尾感
      pts[0].x += (target.x - pts[0].x) * 0.35;
      pts[0].y += (target.y - pts[0].y) * 0.35;
      for (let i = 1; i < TRAIL; i++) {
        pts[i].x += (pts[i - 1].x - pts[i].x) * 0.35;
        pts[i].y += (pts[i - 1].y - pts[i].y) * 0.35;
      }
      ctx.clearRect(0, 0, w, h);
      ctx.globalCompositeOperation = 'lighter';
      for (let i = TRAIL - 1; i >= 0; i--) {
        const t = 1 - i / TRAIL; // 头亮尾淡
        const r = 2 + t * 10;
        const p = pts[i];
        if (p.x < -999) continue;
        const g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
        g.addColorStop(0, `rgba(137,170,204,${0.35 * t})`);
        g.addColorStop(0.4, `rgba(78,133,191,${0.18 * t})`);
        g.addColorStop(1, 'rgba(78,133,191,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
        ctx.fill();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', onMove);
      cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div style={{ ...style, overflow: 'hidden', pointerEvents: 'none' }} className={className}>
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
      {children}
    </div>
  );
}
