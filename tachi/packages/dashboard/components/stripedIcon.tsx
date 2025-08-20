"use client";

import React, { useEffect, useMemo, useRef } from "react";

/**
 * StripedIconV2 — organic, rAF-driven animation with:
 * - sine-wave scaling per bar (phase-shifted)
 * - deterministic per-bar jitter + offsets (seeded)
 * - traveling "caps" (little squares) with wrap-around
 * - slow horizontal scan highlight (gradient sweep)
 * - optional tilt and accent cadence
 *
 * Works great as a Plasmic Code Component. Mask path shapes included,
 * or pass your own via `maskPath`.
 */

type Variant = "app" | "phone" | "lock" | "globe" | "custom";

export interface StripedIconV2Props {
  variant?: Variant;
  /** Custom SVG path d="..." in viewBox 0 0 100 100 (used when variant="custom") */
  maskPath?: string;

  columns?: number;          // number of bars
  barFill?: number;          // 0..1 fraction of each column width used as bar width
  accentEvery?: number;      // every Nth bar is accent
  accentPhaseSkew?: number;  // 0..1 extra phase for accent bars

  neutralColor?: string;     // base bar color
  accentColor?: string;      // accent bar color
  capColor?: string;         // cap color
  outlineColor?: string;     // thin icon outline
  backgroundFade?: [number, number]; // top/bottom alpha fade (0..1)

  speed?: number;            // seconds per full wave cycle
  amplitude?: number;        // 0..1 vertical swing of bars
  baseScale?: number;        // 0..1 base vertical scale of bars
  jitter?: number;           // 0..1 per-bar randomness added to amplitude
  tiltDeg?: number;          // small rotation for the whole stripes group
  seed?: number;             // RNG seed for deterministic randomness

  capEvery?: number;         // put a cap on every Nth accent bar
  capSize?: number;          // 0..1 relative to bar width
  capSpeedFactor?: number;   // relative to bar wave speed

  scanOpacity?: number;      // 0..1 opacity of horizontal scan highlight
  scanPeriod?: number;       // seconds for the scan to traverse left→right

  className?: string;
  paused?: boolean;          // respect prefers-reduced-motion or force pause
}

export default function StripedIconV2({
  variant = "app",
  maskPath,
  columns = 52,
  barFill = 0.58,
  accentEvery = 7,
  accentPhaseSkew = 0.18,

  neutralColor = "rgba(150,158,170,0.92)",
  accentColor = "#4F8DF7",
  capColor = "#4F8DF7",
  outlineColor = "rgba(150,158,170,0.35)",
  backgroundFade = [0.88, 0.65],

  speed = 2.2,
  amplitude = 0.55,
  baseScale = 0.30,
  jitter = 0.35,
  tiltDeg = 1.5,
  seed = 11,

  capEvery = 3,
  capSize = 0.55,
  capSpeedFactor = 1.15,

  scanOpacity = 0.18,
  scanPeriod = 10,

  className,
  paused,
}: StripedIconV2Props) {
  // Prefer reduced motion
  const shouldPause =
    paused ||
    (typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  // Deterministic PRNG
  function rng(seed0: number) {
    let s = seed0 >>> 0;
    return () => (s = (s * 1664525 + 1013904223) >>> 0) / 2 ** 32;
  }
  const rand = useMemo(() => rng(seed), [seed]);

  // Precompute per-column params
  const col = useMemo(() => {
    const arr = [];
    for (let i = 0; i < columns; i++) {
      const r1 = rand(); // for phase offset
      const r2 = rand(); // for amplitude jitter
      const r3 = rand(); // for base scale jitter
      const isAccent = i % accentEvery === 0;
      const phase = (i / columns) * Math.PI * 2 + r1 * 0.7 + (isAccent ? accentPhaseSkew : 0);
      const amp = amplitude * (1 - 0.4 * jitter + r2 * jitter);
      const base = baseScale * (0.85 + r3 * 0.3);
      arr.push({ i, phase, amp, base, isAccent });
    }
    return arr;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, accentEvery, amplitude, baseScale, jitter, accentPhaseSkew, seed]);

  // Refs to bar & cap nodes so we can update with rAF
  const barRefs = useRef<Array<SVGRectElement | null>>([]);
  const capRefs = useRef<Array<SVGRectElement | null>>([]);

  // Gradient scan ref
  const scanRef = useRef<SVGRectElement | null>(null);

  // Layout constants in 0..100 viewBox
  const colW = 100 / columns;
  const barW = Math.max(0.5, colW * barFill);
  const corner = Math.min(2, barW * 0.5);

  // Mask shape
  const shapePath =
    variant === "custom" && maskPath
      ? maskPath
      : variant === "phone"
      ? "M30 8 h40 a8 8 0 0 1 8 8 v68 a8 8 0 0 1-8 8 h-40 a8 8 0 0 1-8-8 v-68 a8 8 0 0 1 8-8 z"
      : variant === "lock"
      ? "M50 16 a18 18 0 0 1 18 18 v8 h6 a6 6 0 0 1 6 6 v34 a6 6 0 0 1-6 6 h-48 a6 6 0 0 1-6-6 v-34 a6 6 0 0 1 6-6 h6 v-8 a18 18 0 0 1 18-18 z"
      : variant === "globe"
      ? "M50 14 a36 36 0 1 1 0 72 a36 36 0 1 1 0-72 z"
      : "M22 18 h56 a10 10 0 0 1 10 10 v44 a10 10 0 0 1-10 10 h-56 a10 10 0 0 1-10-10 v-44 a10 10 0 0 1 10-10 z";

  // rAF animation loop
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();

    const step = () => {
      const t = (performance.now() - t0) / 1000; // seconds
      // Wave phase progresses one full cycle every `speed` seconds
      const theta = (Math.PI * 2 * t) / Math.max(0.001, speed);

      for (let k = 0; k < col.length; k++) {
        const b = barRefs.current[k];
        if (!b) continue;
        const { phase, amp, base, isAccent } = col[k];

        // Smooth sine wave + a tiny secondary ripple for richness
        const s1 = Math.sin(theta + phase);
        const s2 = 0.35 * Math.sin(2 * (theta + phase + 0.7));
        const scaleY = Math.max(0.05, base + Math.max(0, amp) * (0.5 + 0.5 * (s1 + s2)));

        // Apply transform around bottom of each bar
        b.style.transformBox = "fill-box";
        b.style.transformOrigin = "50% 100%";
        b.style.transform = `scaleY(${shouldPause ? base : scaleY})`;
        b.style.fill = isAccent ? accentColor : neutralColor;

        // Cap motion: steady upward drift with slight ease (wrap at top)
        const cap = capRefs.current[k];
        if (cap) {
          // Base progress 0..1 independent of wave; accents move a tad faster
          const period = Math.max(0.5, speed * (isAccent ? capSpeedFactor : 1));
          const p = ((t / period + (k % (accentEvery * 2)) / (columns * 0.6)) % 1);
          // Ease-in-out-ish vertical travel between ~70%..6% of height
          const eased = 0.5 - 0.5 * Math.cos(p * Math.PI * 2);
          const yPct = 70 - 64 * eased;
          cap.setAttribute("y", yPct.toFixed(3));
          cap.style.opacity = shouldPause ? "0.8" : (0.7 + 0.3 * Math.sin((theta + phase) * 0.6)).toFixed(3);
          cap.style.fill = capColor;
        }
      }

      // Scan highlight drifts left→right
      if (scanRef.current) {
        const scanP = ((t % Math.max(1, scanPeriod)) / Math.max(1, scanPeriod)) * 100; // 0..100%
        scanRef.current.setAttribute("x", (scanP - 30).toFixed(2)); // gradient rect wider than icon
        scanRef.current.style.opacity = String(shouldPause ? 0 : scanOpacity);
      }

      if (!shouldPause) raf = requestAnimationFrame(step);
    };

    if (!shouldPause) raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [
    col,
    columns,
    speed,
    accentEvery,
    neutralColor,
    accentColor,
    capColor,
    capEvery,
    capSpeedFactor,
    scanOpacity,
    scanPeriod,
    shouldPause,
  ]);

  // Build bars & caps once; rAF will mutate their styles/attrs
  const bars = useMemo(() => {
    const list = [];
    for (let i = 0; i < columns; i++) {
      const x = i * colW + (colW - barW) / 2;
      list.push(
        <g key={i}>
          <rect
            ref={(el) => { barRefs.current[i] = el; }}
            x={x}
            y={0}
            width={barW}
            height={100}
            rx={corner}
          />
          {/* caps on some accent bars */}
          {i % accentEvery === 0 && i % (accentEvery * capEvery) === 0 ? (
            <rect
              ref={(el) => { capRefs.current[i] = el; }}
              x={x + (barW * (1 - capSize)) / 2}
              y={70}
              width={barW * capSize}
              height={barW * capSize}
              rx={1}
              opacity={0.9}
            />
          ) : null}
        </g>
      );
    }
    return list;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columns, barW, corner, accentEvery, capEvery, capSize]);

  // IDs for defs
  const uid = useMemo(
    () => Math.random().toString(36).slice(2),
    []
  );

  return (
    <div className={className}>
      <svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
        <defs>
          <clipPath id={`clip-${uid}`} clipPathUnits="userSpaceOnUse">
            <path d={shapePath} />
          </clipPath>

          {/* subtle vertical fade to soften edges */}
          <linearGradient id={`fade-${uid}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopOpacity={backgroundFade[0]} />
            <stop offset="100%" stopOpacity={backgroundFade[1]} />
          </linearGradient>

          {/* scan gradient (soft band) */}
          <linearGradient id={`scanGrad-${uid}`} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#fff" stopOpacity="0" />
            <stop offset="45%" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="55%" stopColor="#fff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#fff" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Stripes group, clipped into the icon shape */}
        <g clipPath={`url(#clip-${uid})`} transform={`rotate(${tiltDeg}, 50, 50)`}>
          {bars}
          {/* soft vertical fade overlay */}
          <rect x="0" y="0" width="100" height="100" fill={`url(#fade-${uid})`} />
          {/* moving scan highlight (wider than shape, animated via rAF) */}
          <rect
            ref={scanRef}
            x="-30"
            y="0"
            width="60"
            height="100"
            fill={`url(#scanGrad-${uid})`}
            opacity={scanOpacity}
            style={{ mixBlendMode: "screen" as any }}
          />
        </g>

        {/* Thin outline */}
        <path d={shapePath} fill="none" stroke={outlineColor} strokeWidth={1.1} />
      </svg>
    </div>
  );
}
