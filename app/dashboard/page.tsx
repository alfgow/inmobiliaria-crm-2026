import { AnimatedDashboardBackground } from "@/components/dashboard/animated-dashboard-background";
import {
  DashboardMobileDock,
  DashboardNavbar,
} from "@/components/dashboard/dashboard-navbar";
import { MapPreviewCard } from "@/components/dashboard/map-preview-card";
import { WelcomeCard } from "@/components/dashboard/welcome-card";

export default function DashboardPage() {
  return (
    <main className="relative isolate min-h-[100dvh] overflow-x-hidden overflow-y-auto bg-slate-50 px-4 py-6 pb-24 text-zinc-950 sm:px-6 lg:h-[100dvh] lg:overflow-hidden lg:px-10 lg:pb-6">
      <AnimatedDashboardBackground>
        <div className="mx-auto flex w-full max-w-[1800px] flex-col gap-6 lg:h-full lg:flex-row lg:items-center">
          <div className="lg:shrink-0 lg:self-center">
            <DashboardNavbar />
          </div>

          <div className="min-w-0 flex-1 lg:h-full lg:overflow-y-auto lg:pr-2 xl:pr-4">
            <div className="space-y-6 pb-20 lg:pb-10">
              <WelcomeCard />
              <MapPreviewCard />
            </div>
          </div>
        </div>
      </AnimatedDashboardBackground>
      <DashboardMobileDock />
    </main>
  );
}
