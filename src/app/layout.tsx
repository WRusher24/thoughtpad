import type { Metadata, Viewport } from "next";
import { Courier_Prime, Fraunces, Inter } from "next/font/google";

import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-fraunces",
  display: "swap",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const courier = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "ThoughtPad — Brain Dump & Quick Capture",
    template: "%s · ThoughtPad",
  },
  description:
    "A quiet, distraction-free notepad for lightning-fast brain dumps. Capture thoughts in one tap; ThoughtPad sorts them into smart drawers for you.",
  applicationName: "ThoughtPad",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "ThoughtPad",
  },
  formatDetection: { telephone: false },
};

export const viewport: Viewport = {
  themeColor: "#FAF9F6",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${fraunces.variable} ${inter.variable} ${courier.variable}`}
    >
      <body className="bg-paper text-ink font-body antialiased">
        {children}
      </body>
    </html>
  );
}
