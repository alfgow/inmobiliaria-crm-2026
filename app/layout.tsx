import type { Metadata } from "next";
import { Roboto_Condensed, Shadows_Into_Light } from "next/font/google";
import "./globals.css";
import { ContactSearchModalProvider } from "@/components/dashboard/contact-search-button";
import { DashboardDesktopChrome } from "@/components/dashboard/dashboard-desktop-chrome";
import { DashboardMobileDock } from "@/components/dashboard/dashboard-navbar";

const robotoCondensed = Roboto_Condensed({
  variable: "--font-roboto-condensed",
  subsets: ["latin"],
});

const shadowsIntoLight = Shadows_Into_Light({
  variable: "--font-shadows-into-light",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  title: "Inmobiliaria CRM 2026",
  description: "Centro de operaciones inmobiliario",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${robotoCondensed.variable} ${shadowsIntoLight.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] font-sans text-[var(--foreground)]">
        <ContactSearchModalProvider>
          <DashboardDesktopChrome />
          <div className="min-h-screen pb-28 lg:pb-0 lg:pl-[22rem] lg:pt-[6rem]">
            {children}
          </div>
          <DashboardMobileDock />
        </ContactSearchModalProvider>
      </body>
    </html>
  );
}
