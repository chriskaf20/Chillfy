// src/app/layout.tsx - Updated version
import "../styles/globals.css";
import { ReactNode } from "react";
import { Providers } from "@/components/Providers";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata = {
  title: 'Chillfy - Discover Events in North Cyprus',
  description: 'Find amazing events, concerts, festivals, and gatherings happening in North Cyprus. Your guide to the best entertainment and cultural experiences.',
  keywords: 'North Cyprus events, Cyprus entertainment, concerts, festivals, nightlife, cultural events',
  author: 'Chillfy Team',
  viewport: 'width=device-width, initial-scale=1',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
        <link rel="icon" href="/favicon.ico" />
        <meta name="theme-color" content="#0d9488" />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col antialiased">
        <Providers>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}