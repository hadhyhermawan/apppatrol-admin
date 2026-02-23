import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import "./globals.css";
import "flatpickr/dist/flatpickr.css";
import { SidebarProvider } from "@/context/SidebarContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { PermissionProvider } from "@/contexts/PermissionContext";

import FaviconProvider from "@/components/common/FaviconProvider";

const outfit = Outfit({
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "K3Guard Admin Dashboard",
  description: "Admin dashboard for AppPatrol",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.className} dark:bg-gray-900 overflow-x-hidden`} suppressHydrationWarning={true}>
        <FaviconProvider />
        <ThemeProvider>
          <PermissionProvider>
            <SidebarProvider>{children}</SidebarProvider>
          </PermissionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
