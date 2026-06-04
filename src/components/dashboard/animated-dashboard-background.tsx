"use client";

import { useEffect, useRef, type ReactNode } from "react";

type AnimatedDashboardBackgroundProps = {
  children: ReactNode;
};

type ParallaxLayer = {
  ref: React.RefObject<HTMLDivElement | null>;
  factorX: number;
  factorY: number;
  scale: number;
};

export function AnimatedDashboardBackground({
  children,
}: AnimatedDashboardBackgroundProps) {
  const blueLayerRef = useRef<HTMLDivElement>(null);
  const violetLayerRef = useRef<HTMLDivElement>(null);
  const gridLayerRef = useRef<HTMLDivElement>(null);
  const sheenLayerRef = useRef<HTMLDivElement>(null);
  const haloLayerRef = useRef<HTMLDivElement>(null);
  const contentStageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reducedMotion) {
      return;
    }

    const layers: ParallaxLayer[] = [
      { ref: gridLayerRef, factorX: 6, factorY: 4, scale: 1.01 },
      { ref: blueLayerRef, factorX: 28, factorY: 22, scale: 1.02 },
      { ref: violetLayerRef, factorX: -24, factorY: 20, scale: 1.03 },
      { ref: sheenLayerRef, factorX: 12, factorY: -10, scale: 1.01 },
      { ref: haloLayerRef, factorX: -10, factorY: -8, scale: 1.02 },
    ];

    let frameId = 0;
    let currentX = 0;
    let currentY = 0;
    let targetX = 0;
    let targetY = 0;

    const applyTransforms = () => {
      currentX += (targetX - currentX) * 0.12;
      currentY += (targetY - currentY) * 0.12;

      for (const layer of layers) {
        const element = layer.ref.current;

        if (!element) {
          continue;
        }

        const translateX = currentX * layer.factorX;
        const translateY = currentY * layer.factorY;

        element.style.transform = `translate3d(${translateX}px, ${translateY}px, 0) scale(${layer.scale})`;
      }

      const contentStage = contentStageRef.current;

      if (contentStage) {
        const rotateY = currentX * 0.85;
        const rotateX = currentY * -0.85;

        contentStage.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) translate3d(0, 0, 0)`;
      }

      const isSettled =
        Math.abs(targetX - currentX) < 0.001 &&
        Math.abs(targetY - currentY) < 0.001;

      if (!isSettled) {
        frameId = window.requestAnimationFrame(applyTransforms);
        return;
      }

      frameId = 0;
    };

    const startAnimation = () => {
      if (frameId !== 0) {
        return;
      }

      frameId = window.requestAnimationFrame(applyTransforms);
    };

    const resetTarget = () => {
      targetX = 0;
      targetY = 0;
      startAnimation();
    };

    const handlePointerMove = (event: PointerEvent) => {
      targetX = (event.clientX / window.innerWidth - 0.5) * 2;
      targetY = (event.clientY / window.innerHeight - 0.5) * 2;
      startAnimation();
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("blur", resetTarget);
    document.documentElement.addEventListener("pointerleave", resetTarget);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("blur", resetTarget);
      document.documentElement.removeEventListener("pointerleave", resetTarget);

      if (frameId !== 0) {
        window.cancelAnimationFrame(frameId);
      }
    };
  }, []);

  return (
    <div className="relative">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.96)_0%,rgba(248,250,252,0.92)_38%,rgba(241,245,249,0.84)_68%,rgba(226,232,240,0.72)_100%)]"
      >
        <div
          ref={gridLayerRef}
          className="absolute inset-0 opacity-[0.34] will-change-transform"
          style={{
            transform: "translate3d(0, 0, 0) scale(1.01)",
          }}
        >
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:72px_72px]" />
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.65)_0%,rgba(255,255,255,0)_48%,rgba(255,255,255,0.5)_100%)]" />
        </div>

        <div
          ref={blueLayerRef}
          className="absolute -left-40 top-[-8rem] h-[34rem] w-[34rem] rounded-full bg-sky-400/25 blur-3xl will-change-transform sm:h-[44rem] sm:w-[44rem]"
          style={{
            transform: "translate3d(0, 0, 0) scale(1.02)",
          }}
        />

        <div
          ref={violetLayerRef}
          className="absolute -right-48 top-24 h-[32rem] w-[32rem] rounded-full bg-violet-400/20 blur-3xl will-change-transform sm:h-[42rem] sm:w-[42rem]"
          style={{
            transform: "translate3d(0, 0, 0) scale(1.03)",
          }}
        />

        <div
          ref={sheenLayerRef}
          className="absolute inset-x-0 top-0 h-[26rem] bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.94)_0%,rgba(255,255,255,0.6)_35%,rgba(255,255,255,0)_72%)] blur-2xl will-change-transform"
          style={{
            transform: "translate3d(0, 0, 0) scale(1.01)",
          }}
        />

        <div
          ref={haloLayerRef}
          className="absolute inset-x-1/4 top-10 h-[24rem] rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.82)_0%,rgba(191,219,254,0.22)_34%,rgba(191,219,254,0)_72%)] blur-3xl will-change-transform sm:inset-x-1/3 sm:h-[30rem]"
          style={{
            transform: "translate3d(0, 0, 0) scale(1.02)",
          }}
        />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-white/80 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-slate-50 via-slate-50/85 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_20%,rgba(255,255,255,0.68)_0%,rgba(255,255,255,0)_45%)]" />
      </div>

      <div className="relative z-10" style={{ perspective: "1200px" }}>
        <div
          ref={contentStageRef}
          className="origin-center will-change-transform"
          style={{ transform: "rotateX(0deg) rotateY(0deg)" }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}
