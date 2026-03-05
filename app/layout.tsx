import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ViewModeProvider } from "@/lib/view-mode-context";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Uptime Monitoring System - TPSL",
  description: "Power generation system uptime monitoring and logging",
  icons: {
    icon: [
      { url: "/uptime/images/tpsl-logo.jpeg" },
      { url: "/images/tpsl-logo.jpeg" },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ViewModeProvider>
          {children}
        </ViewModeProvider>
      </body>
    </html>
  );
}
