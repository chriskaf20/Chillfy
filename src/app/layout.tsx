import "../styles/globals.css";
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";
import NavBar from "@/components/NavBar";
import Footer from "@/components/Footer";
import { GoogleAnalytics } from "@/components/GoogleAnalytics";

export const metadata = {
  title: 'Chillfy',
  description: 'Chillfy - Event discovery app for North Cyprus',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <GoogleAnalytics />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        <AuthProvider>
          <NavBar />
          <main className="flex-1">{children}</main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}