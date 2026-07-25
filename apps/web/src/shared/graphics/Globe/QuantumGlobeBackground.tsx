import React, { useMemo, useState, useEffect, useRef } from 'react';

// ─── Deterministic Hash for Static Star Data ─────────────────────────────────
function hash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
}

export interface Star {
  id: number;
  x: number;          // percentage 0..100
  y: number;          // percentage 0..100
  size: number;       // size in px
  baseOpacity: number;// opacity 0.12..0.55
  depthLayer: 'far' | 'middle' | 'near';
  isSpecial: boolean;
  isTwinkling: boolean;
  twinkleDuration: number;
  twinkleDelay: number;
  tint?: string;      // optional subtle tint
  globeDist: number;  // distance from center % (0..50)
  globeAngle: number; // angle relative to center rad
}

// ─── Generate 100 Stars according to Specification ───────────────────────────
function generateStarField(): Star[] {
  const stars: Star[] = [];
  const TOTAL_STARS = 100;

  const clusters = [
    { cx: 22, cy: 28 },
    { cx: 78, cy: 22 },
    { cx: 82, cy: 72 },
    { cx: 18, cy: 78 },
    { cx: 50, cy: 85 },
  ];

  let twinklingCount = 0;

  for (let i = 0; i < TOTAL_STARS; i++) {
    const h1 = hash(i * 3 + 1);
    const h2 = hash(i * 3 + 2);
    const h3 = hash(i * 3 + 3);
    const h4 = hash(i * 3 + 4);

    let x: number;
    let y: number;
    if (h1 < 0.35) {
      const cluster = clusters[Math.floor(h2 * clusters.length)];
      const radius = 14 * h3;
      const angle = h4 * Math.PI * 2;
      x = Math.max(2, Math.min(98, cluster.cx + Math.cos(angle) * radius));
      y = Math.max(2, Math.min(98, cluster.cy + Math.sin(angle) * radius));
    } else {
      x = 3 + h2 * 94;
      y = 3 + h3 * 94;
    }

    const dx = x - 50;
    const dy = y - 50;
    const globeDist = Math.sqrt(dx * dx + dy * dy);
    const globeAngle = Math.atan2(dy, dx);

    let baseOpacity = 0.15;
    let size = 1.0;
    let isSpecial = false;
    let tint: string | undefined = undefined;
    let isTwinkling = false;

    if (i < 80) {
      baseOpacity = 0.12 + h4 * 0.06;
      size = 0.9 + h3 * 0.3;
    } else if (i < 90) {
      baseOpacity = 0.30 + h4 * 0.08;
      size = 1.4 + h3 * 0.4;
      if (twinklingCount < 10) {
        isTwinkling = true;
        twinklingCount++;
      }
    } else if (i < 95) {
      baseOpacity = 0.45 + h4 * 0.10;
      size = 1.8 + h3 * 0.4;
      if (twinklingCount < 10) {
        isTwinkling = true;
        twinklingCount++;
      }
    } else {
      baseOpacity = 0.40 + h4 * 0.10;
      size = 1.1 + h3 * 0.3;
      isSpecial = true;
      tint = h3 > 0.5 ? 'rgba(186, 230, 253, 0.75)' : 'rgba(233, 213, 255, 0.75)';
    }

    let depthLayer: 'far' | 'middle' | 'near' = 'far';
    if (h1 > 0.90) {
      depthLayer = 'near';
    } else if (h1 > 0.60) {
      depthLayer = 'middle';
    }

    const twinkleDuration = 3.5 + h2 * 3.5;
    const twinkleDelay = h3 * 5.0;

    stars.push({
      id: i,
      x,
      y,
      size,
      baseOpacity,
      depthLayer,
      isSpecial,
      isTwinkling,
      twinkleDuration,
      twinkleDelay,
      tint,
      globeDist,
      globeAngle,
    });
  }

  return stars;
}

// ─── Geometry Helper: Distance from line segment to Globe center (50, 50) ────
function distToGlobeCenter(x1: number, y1: number, x2: number, y2: number): number {
  const cx = 50, cy = 50;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(cx - x1, cy - y1);
  let t = ((cx - x1) * dx + (cy - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(cx - projX, cy - projY);
}

// ─── Shooting Star State & Manager ───────────────────────────────────────────
interface ShootingStar {
  id: number;
  startX: number;    // %
  startY: number;    // %
  targetX: number;   // %
  targetY: number;   // %
  angle: number;     // deg
  length: number;    // px
  duration: number;  // ms (2000 - 3000ms)
  brightness: number;// opacity multiplier
}

function generateValidShootingStar(): ShootingStar {
  let attempt = 0;
  while (attempt < 50) {
    attempt++;
    // Spawn around outer boundaries (-5% to 105%)
    const side = Math.floor(Math.random() * 4); // 0: Top, 1: Right, 2: Bottom, 3: Left
    let startX = 0;
    let startY = 0;
    let targetX = 0;
    let targetY = 0;

    if (side === 0) { // Top
      startX = Math.random() * 100;
      startY = -5;
      targetX = Math.random() * 100;
      targetY = 105;
    } else if (side === 1) { // Right
      startX = 105;
      startY = Math.random() * 100;
      targetX = -5;
      targetY = Math.random() * 100;
    } else if (side === 2) { // Bottom
      startX = Math.random() * 100;
      startY = 105;
      targetX = Math.random() * 100;
      targetY = -5;
    } else { // Left
      startX = -5;
      startY = Math.random() * 100;
      targetX = 105;
      targetY = Math.random() * 100;
    }

    // Ensure trajectory stays at least 28% away from center (50, 50)
    const dCenter = distToGlobeCenter(startX, startY, targetX, targetY);
    if (dCenter >= 28) {
      const dx = targetX - startX;
      const dy = targetY - startY;
      const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      const length = 110 + Math.random() * 70; // 110px to 180px tail
      const duration = 2200 + Math.random() * 750; // 2.2s to 2.95s lifetime
      const brightness = 0.75 + Math.random() * 0.25;

      return {
        id: Date.now() + Math.random(),
        startX,
        startY,
        targetX,
        targetY,
        angle,
        length,
        duration,
        brightness,
      };
    }
  }

  // Fallback outer tangent line top-left to top-right
  return {
    id: Date.now(),
    startX: -5,
    startY: 12,
    targetX: 105,
    targetY: 18,
    angle: 3.4,
    length: 130,
    duration: 2500,
    brightness: 0.85,
  };
}

export function QuantumGlobeBackground() {
  const stars = useMemo(() => generateStarField(), []);
  const [activeStar, setActiveStar] = useState<ShootingStar | null>(null);

  const farRef = useRef<HTMLDivElement>(null);
  const midRef = useRef<HTMLDivElement>(null);
  const nearRef = useRef<HTMLDivElement>(null);

  // Mouse Parallax listener (1-3px max)
  useEffect(() => {
    let animationFrameId: number;
    let targetX = 0;
    let targetY = 0;
    let currentX = 0;
    let currentY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;
      targetX = (e.clientX / innerWidth - 0.5) * 2;
      targetY = (e.clientY / innerHeight - 0.5) * 2;
    };

    const updateParallax = () => {
      currentX += (targetX - currentX) * 0.05;
      currentY += (targetY - currentY) * 0.05;

      if (farRef.current) farRef.current.style.transform = `translate3d(${currentX * 0.5}px, ${currentY * 0.5}px, 0)`;
      if (midRef.current) midRef.current.style.transform = `translate3d(${currentX * 1.2}px, ${currentY * 1.2}px, 0)`;
      if (nearRef.current) nearRef.current.style.transform = `translate3d(${currentX * 2.5}px, ${currentY * 2.5}px, 0)`;

      animationFrameId = requestAnimationFrame(updateParallax);
    };

    window.addEventListener('mousemove', handleMouseMove);
    animationFrameId = requestAnimationFrame(updateParallax);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // ─── ISSUE 2 — SHOOTING STAR MANAGER ─────────────────────────────────────
  // Random interval 35–90 seconds. Single active shooting star.
  // Lifetime 2.2–3.0s. Completely destroyed on completion.
  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;
    let isMounted = true;

    const scheduleNextShootingStar = (delayMs: number) => {
      timeoutId = setTimeout(() => {
        if (!isMounted) return;

        // Spawn a new randomized shooting star
        const newStar = generateValidShootingStar();
        setActiveStar(newStar);

        // Destroy star completely after its exact lifetime
        setTimeout(() => {
          if (!isMounted) return;
          setActiveStar(null);

          // Schedule next star after random 35–90 second interval
          const nextIntervalMs = 35000 + Math.random() * 55000;
          scheduleNextShootingStar(nextIntervalMs);
        }, newStar.duration + 50);
      }, delayMs);
    };

    // First shooting star spawns after initial 15s
    scheduleNextShootingStar(15000);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden select-none z-0 rounded-2xl">
      {/* ─── ISSUE 1 — DEEP SPACE BACKGROUND (#020202, 80% REDUCED BLUE) ────── */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: '#020202',
          backgroundImage:
            'radial-gradient(circle at 50% 50%, rgba(6, 10, 20, 0.25) 0%, rgba(2, 3, 6, 0.90) 50%, #020202 100%)',
        }}
      />

      {/* ─── ULTRA-SUBTLE MONOCHROME DUST (1.5% OPACITY) ───────────────────────── */}
      <div
        className="absolute inset-0 opacity-[0.015] mix-blend-screen"
        style={{
          background:
            'radial-gradient(ellipse at 30% 40%, rgba(255, 255, 255, 0.10) 0%, transparent 70%), radial-gradient(ellipse at 75% 65%, rgba(255, 255, 255, 0.08) 0%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* ─── DISTANT STARS WITH PARALLAX ────────────────────────────────────── */}
      <div ref={farRef} className="absolute inset-0 will-change-transform">
        {stars.filter((s) => s.depthLayer === 'far').map((star) => (
          <StarItem key={star.id} star={star} />
        ))}
      </div>

      <div ref={midRef} className="absolute inset-0 will-change-transform">
        {stars.filter((s) => s.depthLayer === 'middle').map((star) => (
          <StarItem key={star.id} star={star} />
        ))}
      </div>

      <div ref={nearRef} className="absolute inset-0 will-change-transform">
        {stars.filter((s) => s.depthLayer === 'near').map((star) => (
          <StarItem key={star.id} star={star} />
        ))}
      </div>

      {/* ─── ISSUE 2 — SHOOTING STAR RENDER ────────────────────────────────── */}
      {activeStar && <ShootingStarInstance star={activeStar} />}

      {/* Inline Keyframe Styles */}
      <style>{`
        @keyframes starTwinkle {
          0%   { opacity: var(--base-op); transform: scale(1.0); }
          25%  { opacity: calc(var(--base-op) * 1.3); transform: scale(1.1); }
          50%  { opacity: calc(var(--base-op) * 0.85); transform: scale(0.95); }
          75%  { opacity: calc(var(--base-op) * 1.2); transform: scale(1.05); }
          100% { opacity: var(--base-op); transform: scale(1.0); }
        }

        @keyframes globePulseStar {
          0%, 100% { transform: translate(0px, 0px) scale(1.0); opacity: var(--base-op); }
          50%      { transform: translate(var(--drift-x), var(--drift-y)) scale(1.15); opacity: calc(var(--base-op) * 1.25); }
        }
      `}</style>
    </div>
  );
}

// ─── Shooting Star Instance Component (Bright Head + Fading Tail + Glow) ──────
function ShootingStarInstance({ star }: { star: ShootingStar }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let animationId: number;
    const startTime = performance.now();

    const animateTrajectory = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1.0, elapsed / star.duration);

      // Smooth progress curve
      const easeProgress = progress < 0.5 
        ? 2 * progress * progress 
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

      const currentX = star.startX + (star.targetX - star.startX) * easeProgress;
      const currentY = star.startY + (star.targetY - star.startY) * easeProgress;

      // Natural opacity envelope: fade-in 0..0.15, full 0.15..0.75, fade-out 0.75..1.0
      let opacity = star.brightness;
      if (progress < 0.15) {
        opacity = (progress / 0.15) * star.brightness;
      } else if (progress > 0.75) {
        opacity = ((1.0 - progress) / 0.25) * star.brightness;
      }

      if (containerRef.current) {
        containerRef.current.style.left = `${currentX}%`;
        containerRef.current.style.top = `${currentY}%`;
        containerRef.current.style.opacity = `${opacity}`;
      }

      if (progress < 1.0) {
        animationId = requestAnimationFrame(animateTrajectory);
      }
    };

    animationId = requestAnimationFrame(animateTrajectory);
    return () => cancelAnimationFrame(animationId);
  }, [star]);

  return (
    <div
      ref={containerRef}
      className="absolute pointer-events-none will-change-transform z-10"
      style={{
        left: `${star.startX}%`,
        top: `${star.startY}%`,
        transform: `translate(-100%, -50%) rotate(${star.angle}deg)`,
        mixBlendMode: 'screen',
        filter: 'drop-shadow(0 0 6px rgba(186, 230, 253, 0.8))',
      }}
    >
      <div className="relative flex items-center">
        {/* Soft Fading Tail + Motion Blur */}
        <div
          style={{
            width: `${star.length}px`,
            height: '1.5px',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(186, 230, 253, 0.15) 30%, rgba(255, 255, 255, 0.6) 85%, #FFFFFF 100%)',
            filter: 'blur(0.4px)',
            borderRadius: '999px',
          }}
        />
        {/* Bright Head Core with Additive Glow */}
        <div
          style={{
            width: '4px',
            height: '4px',
            backgroundColor: '#FFFFFF',
            borderRadius: '50%',
            boxShadow: '0 0 6px #FFFFFF, 0 0 12px rgba(186, 230, 253, 0.9), 0 0 18px rgba(56, 189, 248, 0.7)',
            marginLeft: '-2px',
          }}
        />
      </div>
    </div>
  );
}

// ─── Individual Star Item Render ──────────────────────────────────────────────
function StarItem({ star }: { star: Star }) {
  const isNearGlobe = star.globeDist < 28;
  const driftAmount = isNearGlobe ? (1 - star.globeDist / 28) * 1.8 : 0;
  const driftX = `${Math.cos(star.globeAngle) * driftAmount}px`;
  const driftY = `${Math.sin(star.globeAngle) * driftAmount}px`;

  const inlineStyle: React.CSSProperties & Record<string, string | number> = {
    left: `${star.x}%`,
    top: `${star.y}%`,
    width: `${star.size}px`,
    height: `${star.size}px`,
    backgroundColor: star.tint || '#FFFFFF',
    borderRadius: '50%',
    position: 'absolute',
    opacity: star.baseOpacity,
    boxShadow: star.isSpecial ? `0 0 3px ${star.tint}` : 'none',
    '--base-op': star.baseOpacity,
    '--drift-x': driftX,
    '--drift-y': driftY,
  };

  if (star.isTwinkling) {
    inlineStyle.animation = `starTwinkle ${star.twinkleDuration}s ease-in-out ${star.twinkleDelay}s infinite`;
  } else if (isNearGlobe) {
    inlineStyle.animation = `globePulseStar ${4 + (star.id % 3)}s ease-in-out ${(star.id % 5) * 0.7}s infinite`;
  }

  return <div style={inlineStyle} />;
}

export default QuantumGlobeBackground;
