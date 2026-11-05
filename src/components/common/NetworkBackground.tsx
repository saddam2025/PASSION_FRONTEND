import { memo, useEffect, useRef } from "react";

type Props = {
  /** RGB للون، مثال: "37,99,235" */
  color?: string;
  /** كل كام px² فيه نقطة (الرقم الأكبر = نقط أقل) */
  density?: number;
  maxLinks?: number;
  linkDistance?: number;
  mouseRadius?: number;
  /** سرعة الحركة الذاتية */
  speed?: number;
  /** قوة حركة الـ parallax مع الاسكرول (0 = بدون) */
  scrollFactor?: number;
  linkOpacity?: number;
  nodeOpacity?: number;
};

type Node = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  pvx: number; // دفعة الماوس (بتخف تدريجياً)
  pvy: number;
  r: number;
  depth: number; // عمق الـ parallax
  sx: number; // مكانه الفعلي على الشاشة
  sy: number;
};

const MARGIN = 120;

function NetworkBackground({
  color = "37,99,235",
  density = 15000,
  maxLinks = 4,
  linkDistance = 125,
  mouseRadius = 120,
  speed = 0.12,
  scrollFactor = 0.35,
  linkOpacity = 0.2,
  nodeOpacity = 0.5,
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let w = 0;
    let h = 0;
    let nodes: Node[] = [];
    let raf = 0;
    let scrollTarget = 0;
    let scrollCurrent = 0;
    const mouse = { x: -9999, y: -9999 };
    const lastScroll = new WeakMap<EventTarget, number>();

    const span = () => h + MARGIN * 2;
    const wrap = (v: number) => {
      const s = span();
      return ((((v + MARGIN) % s) + s) % s) - MARGIN;
    };

    const build = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const d = w < 768 ? Math.max(density, 22000) : density;
      const count = Math.min(Math.floor((w * span()) / d), 90);
      nodes = Array.from({ length: count }, () => {
        const depth = 0.4 + Math.random() * 0.9;
        return {
          x: Math.random() * w,
          y: Math.random() * span() - MARGIN,
          vx: (Math.random() - 0.5) * speed * 2,
          vy: (Math.random() - 0.5) * speed * 2,
          pvx: 0,
          pvy: 0,
          r: 1 + depth * 0.7,
          depth,
          sx: 0,
          sy: 0,
        };
      });
    };

    let lastW = window.innerWidth;
    let lastH = window.innerHeight;
    const onResize = () => {
      // ما نعيدش البناء لو الموبايل بس غيّر ارتفاع الشريط
      if (
        window.innerWidth !== lastW ||
        Math.abs(window.innerHeight - lastH) > 150
      ) {
        lastW = window.innerWidth;
        lastH = window.innerHeight;
        build();
      }
    };

    const onMove = (e: PointerEvent) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    };
    const onLeave = () => {
      mouse.x = mouse.y = -9999;
    };

    // يشتغل مع scroll الصفحة وأي container داخلي (capture)
    const onScroll = (e: Event) => {
      const t = e.target as Document | Element;
      const y =
        t === document
          ? window.scrollY
          : (t as Element).scrollTop ?? 0;
      const prev = lastScroll.get(t) ?? y;
      lastScroll.set(t, y);
      scrollTarget += (y - prev) * scrollFactor;
    };

    const distToSegment = (
      px: number, py: number,
      ax: number, ay: number,
      bx: number, by: number
    ) => {
      const dx = bx - ax;
      const dy = by - ay;
      const len2 = dx * dx + dy * dy || 1;
      let t = ((px - ax) * dx + (py - ay) * dy) / len2;
      t = Math.max(0, Math.min(1, t));
      return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
    };

    const draw = () => {
      ctx.clearRect(0, 0, w, h);

      // حركة الاسكرول بتتنعّم تدريجياً
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.08;

      for (const n of nodes) {
        // حركة ذاتية بطيئة
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        n.y = wrap(n.y);

        n.sx = n.x;
        n.sy = wrap(n.y - scrollCurrent * n.depth);

        // إزاحة ناعمة بعيد عن الماوس
        const dx = n.sx - mouse.x;
        const dy = n.sy - mouse.y;
        const d = Math.hypot(dx, dy);
        if (d < mouseRadius && d > 0) {
          const f = (1 - d / mouseRadius) * 0.35;
          n.pvx += (dx / d) * f;
          n.pvy += (dy / d) * f;
        }
        n.pvx *= 0.92;
        n.pvy *= 0.92;
        n.x += n.pvx;
        n.y += n.pvy;
        n.sx += n.pvx;
        n.sy += n.pvy;
        n.x = Math.max(0, Math.min(w, n.x));
      }

      ctx.lineWidth = 1;
      const drawn = new Set<number>();
      const fade = mouseRadius * 0.9;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        if (a.sy < -MARGIN * 0.5 || a.sy > h + MARGIN * 0.5) continue;

        const near: { j: number; d: number }[] = [];
        for (let j = 0; j < nodes.length; j++) {
          if (i === j) continue;
          const b = nodes[j];
          const d = Math.hypot(a.sx - b.sx, a.sy - b.sy);
          if (d < linkDistance) near.push({ j, d });
        }
        near.sort((p, q) => p.d - q.d);

        for (const { j, d } of near.slice(0, maxLinks)) {
          const key = i < j ? i * 10000 + j : j * 10000 + i;
          if (drawn.has(key)) continue;
          drawn.add(key);

          const b = nodes[j];
          // الرابط يبهت بنعومة كلما الماوس قرب منه
          const m = distToSegment(mouse.x, mouse.y, a.sx, a.sy, b.sx, b.sy);
          const k = Math.max(0, Math.min(1, (m - fade * 0.35) / (fade * 0.65)));
          if (k <= 0.02) continue;

          const alpha = (1 - d / linkDistance) * linkOpacity * k;
          ctx.strokeStyle = `rgba(${color},${alpha})`;
          ctx.beginPath();
          ctx.moveTo(a.sx, a.sy);
          ctx.lineTo(b.sx, b.sy);
          ctx.stroke();
        }
      }

      for (const n of nodes) {
        if (n.sy < -4 || n.sy > h + 4) continue;
        ctx.fillStyle = `rgba(${color},${nodeOpacity * (0.6 + n.depth * 0.3)})`;
        ctx.beginPath();
        ctx.arc(n.sx, n.sy, n.r, 0, Math.PI * 2);
        ctx.fill();
      }
    };

    const loop = () => {
      draw();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      if (!raf && !reduceMotion) raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      raf = 0;
    };
    const onVisibility = () => (document.hidden ? stop() : start());

    build();
    if (reduceMotion) draw();
    else start();

    window.addEventListener("resize", onResize);
    window.addEventListener("pointermove", onMove, { passive: true });
    document.addEventListener("pointerleave", onLeave);
    window.addEventListener("scroll", onScroll, { passive: true, capture: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("scroll", onScroll, { capture: true });
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [
    color, density, maxLinks, linkDistance, mouseRadius,
    speed, scrollFactor, linkOpacity, nodeOpacity,
  ]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-network-background
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: -1,
        pointerEvents: "none",
      }}
    />
  );
}

export default memo(NetworkBackground);