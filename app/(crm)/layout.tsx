import { cookies } from "next/headers";

import { ContactSearchModalProvider } from "@/components/dashboard/contact-search-button";
import { DashboardDesktopChrome } from "@/components/dashboard/dashboard-desktop-chrome";
import { DashboardMobileDock } from "@/components/dashboard/dashboard-navbar";
import { verifyToken, SESSION_COOKIE } from "@/lib/session";

export default async function CrmLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const user = token ? await verifyToken(token) : null;

  return (
    <ContactSearchModalProvider>
      <DashboardDesktopChrome user={user} />
      <div className="min-h-screen pb-28 lg:pb-0 lg:pl-[22rem] lg:pt-[6rem]">
        {children}
      </div>
      <DashboardMobileDock />
    </ContactSearchModalProvider>
  );
}
