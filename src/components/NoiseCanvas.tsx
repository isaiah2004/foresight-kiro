"use client";

import { useEffect, useRef } from "react";

interface NoiseCanvasProps {
  // Canvas settings
  className?: string;
  
  // Color controls
  primaryColor?: string;
  secondaryColor?: string;
  tertiaryColor?: string;
  backgroundColor?: string;
  
  // Animation controls
  followMouse?: boolean;
  smoothingFactor?: number;
  scrollSpeedX?: number;
  scrollSpeedY?: number;
  
  // Gradient controls
  gradientIntensity?: number;
  gradientRadius?: number;
  secondaryGradientRadius?: number;
  
  // Noise controls
  noiseOpacity?: number;
  noiseSize?: number;
  noiseBrightness?: number;
  noiseVariance?: number;
  
  // Performance controls
  maxDevicePixelRatio?: number;
  
  // Position controls (when followMouse is false)
  staticX?: number; // 0-1
  staticY?: number; // 0-1
}

export const NoiseCanvas: React.FC<NoiseCanvasProps> = ({
  className = "absolute inset-0 -z-10 pointer-events-none overflow-hidden rounded-3xl",
  primaryColor = "hsl(var(--color-primary))",
  secondaryColor = "hsl(var(--color-secondary))",
  tertiaryColor = "hsl(var(--color-secondary))",
  backgroundColor = "hsl(var(--color-background))",
  followMouse = true,
  smoothingFactor = 0.08,
  scrollSpeedX = 0.015,
  scrollSpeedY = 0.01,
  gradientIntensity = 10.0,
  gradientRadius = 0.2,
  secondaryGradientRadius = 0.85,
  noiseOpacity = 0.08,
  noiseSize = 256,
  noiseBrightness = 200,
  noiseVariance = 55,
  maxDevicePixelRatio = 2,
  staticX = 0.5,
  staticY = 0.4
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const noiseCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const patternRef = useRef<CanvasPattern | null>(null);
  const posRef = useRef({ x: staticX, y: staticY }); // smoothed position [0..1]
  const targetRef = useRef({ x: staticX, y: staticY }); // target position [0..1]
  const scrollRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.max(1, Math.min(maxDevicePixelRatio, window.devicePixelRatio || 1));

    // Color utility functions
    const getVar = (name: string) => {
      const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
      return value || "hsl(0 0% 100%)";
    };
    
    const withAlpha = (color: string, a: number) => {
      const c = color.trim();
      if (!c) return `rgba(0,0,0,${a})`;
      if (a === 0) return "rgba(0,0,0,0)";

      // HSL or HSLA
      if (/^hsla?\(/i.test(c)) {
        const inside = c.slice(c.indexOf("(") + 1, c.lastIndexOf(")")).trim();
        let noAlpha = inside
          .replace(/\/(.*)$/, "")
          .replace(/,/g, " ")
          .replace(/\s+/g, " ")
          .trim();
        const parts = noAlpha.split(" ");
        const h = parts[0] ? parseFloat(parts[0]) : 0;
        const s = parts[1] ? parseFloat(parts[1]) : 0;
        const l = parts[2] ? parseFloat(parts[2]) : 0;
        return `hsla(${h}, ${s}%, ${l}%, ${a})`;
      }

      // RGB or RGBA
      if (/^rgba?\(/i.test(c)) {
        const nums = c.match(/\d+\.?\d*/g) || [];
        const r = nums[0] ? Number(nums[0]) : 0;
        const g = nums[1] ? Number(nums[1]) : 0;
        const b = nums[2] ? Number(nums[2]) : 0;
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }

      // Hex #rrggbb or #rgb
      if (/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c)) {
        let r = 0, g = 0, b = 0;
        if (c.length === 4) {
          r = parseInt(c[1] + c[1], 16);
          g = parseInt(c[2] + c[2], 16);
          b = parseInt(c[3] + c[3], 16);
        } else {
          r = parseInt(c.slice(1, 3), 16);
          g = parseInt(c.slice(3, 5), 16);
          b = parseInt(c.slice(5, 7), 16);
        }
        return `rgba(${r}, ${g}, ${b}, ${a})`;
      }

      // Fallback
      if (c.endsWith(")")) {
        return c.replace(/\)$/, ` / ${a})`);
      }
      return c;
    };

    // Create noise texture
    const makeNoise = (size = noiseSize) => {
      const off = document.createElement("canvas");
      off.width = size;
      off.height = size;
      const octx = off.getContext("2d")!;
      const img = octx.createImageData(size, size);
      for (let i = 0; i < img.data.length; i += 4) {
        const val = noiseBrightness + Math.random() * noiseVariance;
        img.data[i] = val;
        img.data[i + 1] = val;
        img.data[i + 2] = val;
        img.data[i + 3] = 255;
      }
      octx.putImageData(img, 0, 0);
      return off;
    };

    const resize = () => {
      const parent = canvas.parentElement as HTMLElement | null;
      const rect = parent?.getBoundingClientRect();
      const width = Math.floor((rect?.width || window.innerWidth) * dpr);
      const height = Math.floor((rect?.height || 400) * dpr);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };

    // Mouse move handling (normalized)
    const onMove = (e: MouseEvent) => {
      if (!followMouse) return;
      
      const parent = canvas.parentElement as HTMLElement | null;
      const rect = parent?.getBoundingClientRect();
      const x = rect ? (e.clientX - rect.left) / rect.width : e.clientX / window.innerWidth;
      const y = rect ? (e.clientY - rect.top) / rect.height : e.clientY / window.innerHeight;
      targetRef.current.x = Math.max(0, Math.min(1, x));
      targetRef.current.y = Math.max(0, Math.min(1, y));
    };

    // Initialize noise pattern
    noiseCanvasRef.current = makeNoise(noiseSize);
    patternRef.current = ctx.createPattern(noiseCanvasRef.current, "repeat");

    let lastTime = 0;
    const render = (t: number) => {
      const width = canvas.width;
      const height = canvas.height;
      const w = width / dpr;
      const h = height / dpr;
      const now = t || 0;
      const dt = Math.min(33, now - lastTime);
      lastTime = now;

      // Smooth follow (only if following mouse)
      if (followMouse) {
        const k = smoothingFactor;
        posRef.current.x += (targetRef.current.x - posRef.current.x) * k;
        posRef.current.y += (targetRef.current.y - posRef.current.y) * k;
      } else {
        // Use static position
        posRef.current.x = staticX;
        posRef.current.y = staticY;
      }

      // Scroll noise
      scrollRef.current.x += dt * scrollSpeedX;
      scrollRef.current.y += dt * scrollSpeedY;

      // Get colors (support both CSS variables and direct colors)
      const bg = backgroundColor.startsWith("hsl(var(") ? getVar(backgroundColor.slice(8, -2)) : backgroundColor;
      const primary = primaryColor.startsWith("hsl(var(") ? getVar(primaryColor.slice(8, -2)) : primaryColor;
      const secondary = secondaryColor.startsWith("hsl(var(") ? getVar(secondaryColor.slice(8, -2)) : secondaryColor;
      const tertiary = tertiaryColor.startsWith("hsl(var(") ? getVar(tertiaryColor.slice(8, -2)) : tertiaryColor;

      // Clear
      const ctx2d = ctx;
      ctx2d.save();
      ctx2d.setTransform(1, 0, 0, 1, 0, 0);
      ctx2d.scale(dpr, dpr);
      ctx2d.fillStyle = bg;
      ctx2d.fillRect(0, 0, w, h);

      // Primary radial gradient following position
      const cx = posRef.current.x * w;
      const cy = posRef.current.y * h;
      const r = Math.max(w, h) * gradientRadius;

      const g1 = ctx2d.createRadialGradient(cx, cy, 0, cx, cy, r);
      g1.addColorStop(0, withAlpha(primary, 0.55 * gradientIntensity));
      g1.addColorStop(0.45, withAlpha(secondary, 0.35 * gradientIntensity));
      g1.addColorStop(1, withAlpha(bg, 0));
      ctx2d.globalCompositeOperation = "lighter";
      ctx2d.fillStyle = g1;
      ctx2d.fillRect(0, 0, w, h);

      // Secondary gradient for depth (mirror)
      const mx = w - cx;
      const my = h - cy;
      const g2 = ctx2d.createRadialGradient(mx, my, 0, mx, my, r * secondaryGradientRadius);
      g2.addColorStop(0, withAlpha(tertiary, 0.35 * gradientIntensity));
      g2.addColorStop(0.6, withAlpha(primary, 0.25 * gradientIntensity));
      g2.addColorStop(1, withAlpha(bg, 0));
      ctx2d.fillStyle = g2;
      ctx2d.fillRect(0, 0, w, h);

      // Reset composite for noise
      ctx2d.globalCompositeOperation = "source-over";

      // Noise overlay
      if (patternRef.current) {
        ctx2d.save();
        const isDark = document.documentElement.classList.contains("dark");
        ctx2d.globalAlpha = isDark ? noiseOpacity * 0.75 : noiseOpacity;
        ctx2d.translate(-scrollRef.current.x % noiseSize, -scrollRef.current.y % noiseSize);
        ctx2d.fillStyle = patternRef.current as CanvasPattern;
        ctx2d.fillRect(-noiseSize, -noiseSize, w + noiseSize * 2, h + noiseSize * 2);
        ctx2d.restore();
      }

      ctx2d.restore();
      rafRef.current = requestAnimationFrame(render);
    };

    const onResize = () => {
      resize();
    };

    resize();
    if (followMouse) {
      window.addEventListener("mousemove", onMove, { passive: true });
    }
    window.addEventListener("resize", onResize);
    rafRef.current = requestAnimationFrame(render);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (followMouse) {
        window.removeEventListener("mousemove", onMove);
      }
      window.removeEventListener("resize", onResize);
    };
  }, [
    primaryColor,
    secondaryColor,
    tertiaryColor,
    backgroundColor,
    followMouse,
    smoothingFactor,
    scrollSpeedX,
    scrollSpeedY,
    gradientIntensity,
    gradientRadius,
    secondaryGradientRadius,
    noiseOpacity,
    noiseSize,
    noiseBrightness,
    noiseVariance,
    maxDevicePixelRatio,
    staticX,
    staticY
  ]);

  return (
    <div className={className}>
      <canvas ref={canvasRef} className="w-full h-full" aria-hidden="true" />
    </div>
  );
};

export default NoiseCanvas;
