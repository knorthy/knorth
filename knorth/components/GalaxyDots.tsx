"use client";
// Drifting galaxy dots with the odd shooting star, drawn on a canvas that fills its parent (give the
// parent position: relative). Dots ease away from the pointer and spring back. Used behind the contact
// section and the case files.
import { useEffect, useRef } from "react";

const ACCENT = "#f72585";
const ACCENT2 = "#b5ff4d";
const ACCENT3 = "#ffe566";
const ACCENT4 = "#a855f7";

// ── Dot galaxy ───────────────────────────────────────────────────────────────
const DOT_COLORS = ["#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];

interface GDot {
  x: number; y: number;
  ox: number; oy: number;
  angle: number; orbitR: number; orbitSpeed: number;
  size: number; color: string;
  vx: number; vy: number;
  opacity: number;
}

export default function GalaxyDots() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouse = useRef({ x: -9999, y: -9999 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      const rect = canvas.parentElement?.getBoundingClientRect();
      canvas.width  = rect?.width  ?? window.innerWidth;
      canvas.height = rect?.height ?? 600;
    };
    resize();

    const ro = new ResizeObserver(resize);
    if (canvas.parentElement) ro.observe(canvas.parentElement);

    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouse.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    };
    const onMouseLeave = () => { mouse.current = { x: -9999, y: -9999 }; };

    canvas.parentElement?.addEventListener("mousemove", onMouseMove);
    canvas.parentElement?.addEventListener("mouseleave", onMouseLeave);

    // ── Dots ──────────────────────────────────────────────────────────────
    const COUNT = 45;
    const REPEL_RADIUS = 80;
    const REPEL_STRENGTH = 0.5;
    const RETURN_SPRING = 0.04;
    const DAMPING = 0.80;

    const dots: GDot[] = Array.from({ length: COUNT }, () => {
      const ox = Math.random() * canvas.width;
      const oy = Math.random() * canvas.height;
      const angle = Math.random() * Math.PI * 2;
      const orbitR = Math.random() * 18 + 4;
      const orbitSpeed = (Math.random() * 0.004 + 0.001) * (Math.random() < 0.5 ? 1 : -1);
      return {
        x: ox + Math.cos(angle) * orbitR,
        y: oy + Math.sin(angle) * orbitR,
        ox, oy, angle, orbitR, orbitSpeed,
        size:    Math.random() * 2.5 + 1,
        color:   DOT_COLORS[Math.floor(Math.random() * DOT_COLORS.length)],
        vx: 0, vy: 0,
        opacity: Math.random() * 0.35 + 0.08,
      };
    });

    // ── Shooting stars ────────────────────────────────────────────────────
    interface Star {
      x: number; y: number;
      vx: number; vy: number;
      len: number;      // tail length
      life: number;     // 0→1 progress
      speed: number;
      color: string;
    }

    const STAR_COLORS = ["#ffffff", "#ffffff", "#ffffff", ACCENT, ACCENT2, ACCENT3, ACCENT4];
    const stars: Star[] = [];
    let nextStarIn = 0; // frames until next spawn

    const spawnStar = () => {
      const fromRight = Math.random() < 0.5;
      // Left-to-right: ~20° spread around 12° downward
      // Right-to-left: mirror angle, start from right side
      const baseAngle = fromRight
        ? Math.PI - (Math.random() * 0.4 - 0.2) - Math.PI * 0.12
        : (Math.random() * 0.4 - 0.2) + Math.PI * 0.12;
      const speed = Math.random() * 6 + 5;
      stars.push({
        x:     fromRight ? canvas.width * 0.4 + Math.random() * canvas.width * 0.6 : Math.random() * canvas.width * 0.6,
        y:     Math.random() * canvas.height,
        vx:    Math.cos(baseAngle) * speed,
        vy:    Math.sin(baseAngle) * speed,
        len:   Math.random() * 60 + 30,
        life:  0,
        speed,
        color: STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)],
      });
      nextStarIn = Math.floor(Math.random() * 180 + 60);
    };

    let frameCount = 0;
    let raf: number;

    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const mx = mouse.current.x;
      const my = mouse.current.y;

      // ── Draw dots ──────────────────────────────────────────────────────
      for (const d of dots) {
        d.angle += d.orbitSpeed;
        const targetX = d.ox + Math.cos(d.angle) * d.orbitR;
        const targetY = d.oy + Math.sin(d.angle) * d.orbitR;

        const dx = d.x - mx;
        const dy = d.y - my;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < REPEL_RADIUS && dist > 0) {
          const force = (REPEL_RADIUS - dist) / REPEL_RADIUS;
          d.vx += (dx / dist) * force * REPEL_STRENGTH;
          d.vy += (dy / dist) * force * REPEL_STRENGTH;
        }

        d.vx += (targetX - d.x) * RETURN_SPRING;
        d.vy += (targetY - d.y) * RETURN_SPRING;
        d.vx *= DAMPING;
        d.vy *= DAMPING;
        d.x += d.vx;
        d.y += d.vy;

        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity;
        ctx.fill();
      }

      // ── Spawn & draw shooting stars ────────────────────────────────────
      frameCount++;
      if (frameCount >= nextStarIn) {
        spawnStar();
        frameCount = 0;
      }

      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.life += s.speed / 400;
        s.x += s.vx;
        s.y += s.vy;

        // Fade in then out
        const alpha = s.life < 0.2
          ? s.life / 0.2
          : s.life > 0.7
            ? 1 - (s.life - 0.7) / 0.3
            : 1;

        // Tail: gradient from transparent at back to bright at head
        const tailX = s.x - s.vx / s.speed * s.len;
        const tailY = s.y - s.vy / s.speed * s.len;
        const grad = ctx.createLinearGradient(tailX, tailY, s.x, s.y);
        grad.addColorStop(0, "transparent");
        grad.addColorStop(1, s.color);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(s.x, s.y);
        ctx.strokeStyle = grad;
        ctx.lineWidth = Math.random() * 0.5 + 0.8;
        ctx.globalAlpha = alpha * 0.7;
        ctx.stroke();

        // Tiny bright head dot
        ctx.beginPath();
        ctx.arc(s.x, s.y, 1.2, 0, Math.PI * 2);
        ctx.fillStyle = "#ffffff";
        ctx.globalAlpha = alpha * 0.9;
        ctx.fill();

        if (s.life >= 1 || s.x > canvas.width + 50 || s.x < -50 || s.y > canvas.height + 50) {
          stars.splice(i, 1);
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(tick);
    };

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      // Still sky: one frame of dots, no drift and no shooting stars
      for (const d of dots) {
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.size, 0, Math.PI * 2);
        ctx.fillStyle = d.color;
        ctx.globalAlpha = d.opacity;
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      raf = 0;
    } else {
      spawnStar(); // kick off with one immediately
      raf = requestAnimationFrame(tick);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.parentElement?.removeEventListener("mousemove", onMouseMove);
      canvas.parentElement?.removeEventListener("mouseleave", onMouseLeave);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
}
