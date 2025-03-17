import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WeddingProvider } from "../context/WeddingContext";
import { AppHeader } from "../components/ui/AppHeader";
import Link from "next/link";
import { BackButton } from "../components/ui/BackButton";
import { ParallaxBackground } from "../components/ui/ParallaxBackground";
import { AuthProvider } from '@/context/AuthContext';
import { InvitationProvider } from '@/context/InvitationContext';

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wedding Finance Planner",
  description: "A tactical tool for planning and tracking wedding finances",
};

// This is the server part of the layout that exports metadata

// Client part is wrapped in a client component
import ClientLayout from './client-layout';

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="scroll-smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background min-h-screen`}
      >
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
