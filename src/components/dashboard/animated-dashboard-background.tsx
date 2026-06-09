"use client";

import type { ReactNode } from "react";

type AnimatedDashboardBackgroundProps = {
  children: ReactNode;
};

export function AnimatedDashboardBackground({
  children,
}: AnimatedDashboardBackgroundProps) {
  return (
    <div className="relative isolate">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-[radial-gradient(circle_at_top_left,rgba(124,58,237,0.14)_0%,rgba(124,58,237,0)_28%),radial-gradient(circle_at_top_right,rgba(210,255,30,0.24)_0%,rgba(210,255,30,0)_24%),linear-gradient(180deg,#f8f6f3_0%,#f1efeb_58%,#f3f1ec_100%)]"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(44,44,44,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(44,44,44,0.03)_1px,transparent_1px)] bg-[size:72px_72px] opacity-60" />
        <div className="absolute -left-28 top-16 h-96 w-96 rounded-full bg-brand-secondary/15 blur-3xl" />
        <div className="absolute -right-32 top-28 h-[30rem] w-[30rem] rounded-full bg-brand-primary/35 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-surface-2/95 to-transparent" />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
}
