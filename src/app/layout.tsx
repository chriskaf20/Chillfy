// src/app/layout.tsx - Fixed for Next.js 14+
import "../styles/globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import NavBar from "@/components/NavBar";
import ModernFooter from "@/components/ModernFooter";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "Chillfy - Discover Events in North Cyprus",
  description:
    "Find amazing events, concerts, festivals, and gatherings happening in North Cyprus. Your guide to the best entertainment and cultural experiences.",
  keywords:
    "North Cyprus events, Cyprus entertainment, concerts, festivals, nightlife, cultural events",
  authors: [{ name: "Chillfy Team" }],
};

// ✅ viewport must be its own export now
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#14b8a6" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col antialiased">
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
          <ModernFooter />
        </Providers>
      </body>
    </html>
  );
}
