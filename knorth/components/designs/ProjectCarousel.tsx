"use client";
import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring, useTransform, animate } from "framer-motion";
import type { MotionValue } from "framer-motion";

export interface ProjectItem {
  title: string;
  description: string;
  tags: string[];
  image: string;
  link: string;
}

interface Props {
  items: ProjectItem[];
}

const CARD_WIDTH = 300;
const CARD_GAP = 24;
const STEP = CARD_WIDTH + CARD_GAP;

function getArcStyle(offsetPx: number, viewportW: number) {
  const maxOffset = viewportW / 2 + CARD_WIDTH;
  const t = Math.min(Math.abs(offsetPx) / maxOffset, 1);
  const translateY = t * t * 110;
  const rotateZ = (offsetPx / maxOffset) * 14;
  const scale = 1 - t * 0.18;
  const opacity = 1 - t * 0.6;
  return { translateY, rotateZ, scale, opacity };
}

export default function ProjectCarousel({ items }: Props) {
  const [vpWidth, setVpWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const smoothX = useSpring(rawX, { stiffness: 280, damping: 36, mass: 1 });

  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragStartRaw = useRef(0);
  const didDrag = useRef(false);

  const velocity = useRef(0);
  const lastRaw = useRef(0);

  const maxScroll = (items.length - 1) * STEP;

  useEffect(() => {
    function update() {
      if (containerRef.current) setVpWidth(containerRef.current.clientWidth);
    }
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  function snapTo(raw: number) {
    const clamped = Math.max(0, Math.min(raw, maxScroll));
    const nearest = Math.round(clamped / STEP) * STEP;
    animate(rawX, nearest, { type: "spring", stiffness: 300, damping: 35 });
  }

  function onPointerDown(e: React.PointerEvent) {
    isDragging.current = true;
    didDrag.current = false;
    dragStartX.current = e.clientX;
    dragStartRaw.current = rawX.get();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!isDragging.current) return;
    const delta = dragStartX.current - e.clientX;
    if (Math.abs(delta) > 4) didDrag.current = true;
    const next = Math.max(0, Math.min(dragStartRaw.current + delta, maxScroll));
    velocity.current = next - lastRaw.current;
    lastRaw.current = next;
    rawX.set(next);
  }

  function onPointerUp() {
    if (!isDragging.current) return;
    isDragging.current = false;
    snapTo(rawX.get());
  }

  function onWheel(e: React.WheelEvent) {
    e.preventDefault();
    const next = Math.max(0, Math.min(rawX.get() + e.deltaY * 0.6, maxScroll));
    rawX.set(next);
    snapTo(next);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowRight") snapTo(rawX.get() + STEP);
    if (e.key === "ArrowLeft") snapTo(rawX.get() - STEP);
  }

  const centerOffset = vpWidth / 2 - CARD_WIDTH / 2;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden select-none cursor-grab active:cursor-grabbing"
      style={{ height: 560, touchAction: "none" }}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onWheel={onWheel}
      onKeyDown={onKeyDown}
      tabIndex={0}
      role="region"
      aria-label="Project carousel"
    >
      {/* edge fades */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-32 z-10"
        style={{ background: "linear-gradient(to right, var(--background), transparent)" }} />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-32 z-10"
        style={{ background: "linear-gradient(to left, var(--background), transparent)" }} />

      {items.map((project, i) => (
        <CardItem
          key={i}
          project={project}
          cardScrollX={i * STEP}
          smoothX={smoothX}
          centerOffset={centerOffset}
          vpWidth={vpWidth}
          velocityRef={velocity}
          didDragRef={didDrag}
        />
      ))}
    </div>
  );
}

function CardItem({
  project,
  cardScrollX,
  smoothX,
  centerOffset,
  vpWidth,
  velocityRef,
  didDragRef,
}: {
  project: ProjectItem;
  cardScrollX: number;
  smoothX: MotionValue<number>;
  centerOffset: number;
  vpWidth: number;
  velocityRef: React.MutableRefObject<number>;
  didDragRef: React.MutableRefObject<boolean>;
}) {
  const screenX = useTransform(smoothX, (s) => centerOffset + cardScrollX - s);

  const translateY = useTransform(smoothX, (s) => {
    const offset = centerOffset + cardScrollX - s - vpWidth / 2 + CARD_WIDTH / 2;
    return getArcStyle(offset, vpWidth).translateY;
  });

  const rotateZ = useTransform(smoothX, (s) => {
    const offset = centerOffset + cardScrollX - s - vpWidth / 2 + CARD_WIDTH / 2;
    return getArcStyle(offset, vpWidth).rotateZ;
  });

  const scale = useTransform(smoothX, (s) => {
    const offset = centerOffset + cardScrollX - s - vpWidth / 2 + CARD_WIDTH / 2;
    return getArcStyle(offset, vpWidth).scale;
  });

  const opacity = useTransform(smoothX, (s) => {
    const offset = centerOffset + cardScrollX - s - vpWidth / 2 + CARD_WIDTH / 2;
    return getArcStyle(offset, vpWidth).opacity;
  });

  const skewX = useTransform(smoothX, () =>
    Math.max(-8, Math.min(8, velocityRef.current * -0.15))
  );

  function handleClick(e: React.MouseEvent) {
    // block navigation if the user was dragging
    if (didDragRef.current) {
      e.preventDefault();
    }
  }

  return (
    <motion.div
      className="absolute top-8"
      style={{
        x: screenX,
        y: translateY,
        rotateZ,
        scale,
        opacity,
        skewX,
        width: CARD_WIDTH,
        transformOrigin: "bottom center",
        willChange: "transform",
      }}
    >
      {/* entire card is a link */}
      <a
        href={project.link}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleClick}
        className="block w-full rounded-3xl overflow-hidden pointer-events-auto cursor-pointer group"
        style={{
          background: "rgba(20, 30, 44, 0.85)",
          border: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.5)",
          textDecoration: "none",
        }}
      >
        {/* image */}
        <div className="relative w-full h-[180px] overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={project.image}
            alt={project.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            draggable={false}
          />
          <div
            className="absolute inset-0"
            style={{ background: "linear-gradient(to bottom, transparent 50%, rgba(20,30,44,0.9) 100%)" }}
          />
        </div>

        {/* body */}
        <div className="flex flex-col p-5 gap-3">
          <h3 className="text-white font-bold text-base leading-tight">{project.title}</h3>
          <p className="text-white/55 text-xs leading-relaxed">{project.description}</p>

          {/* tags */}
          <div className="flex flex-wrap gap-1.5">
            {project.tags.map((tag) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full text-[10px] font-medium uppercase tracking-wide text-white/70"
                style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}
              >
                {tag}
              </span>
            ))}
          </div>

          {/* visit label */}
          <div className="mt-1 flex items-center justify-center gap-2 w-full py-3 rounded-2xl font-semibold text-sm bg-white text-[#0d1b2a] group-hover:bg-white/90 transition-colors duration-150">
            Visit Project
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7M7 7h10v10" />
            </svg>
          </div>
        </div>
      </a>
    </motion.div>
  );
}
