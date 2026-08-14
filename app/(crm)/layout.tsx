import { redirect } from "next/navigation";

import { ContactSearchModalProvider } from "@/components/dashboard/contact-search-button";
import { DashboardDesktopChrome } from "@/components/dashboard/dashboard-desktop-chrome";
import { DashboardMobileDock } from "@/components/dashboard/dashboard-navbar";
import { getCurrentUser } from "@/features/auth/lib/current-user";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const isAdmin = user?.role === "admin";

  return (
    <ContactSearchModalProvider>
      <DashboardDesktopChrome user={user} isAdmin={isAdmin} />
      <div className="min-h-screen pb-28 lg:pb-0 lg:pl-[22rem] lg:pt-[6rem]">
        {children}
      </div>
      <DashboardMobileDock isAdmin={isAdmin} />
    </ContactSearchModalProvider>
  );
}
