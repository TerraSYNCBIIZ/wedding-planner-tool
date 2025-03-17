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
  display: 'swap',
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: 'swap',
});

export const metadata: Metadata = {
  title: "FinWed - Financial Tool for Weddings",
  description: "The financial tool for weddings and honeymoons - Plan, track, and manage your wedding finances with ease",
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
      <head>
        <link 
          rel="preload" 
          href="/_next/static/media/569ce4b8f30dc480-s.p.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
        <link 
          rel="preload" 
          href="/_next/static/media/93f479601ee12b01-s.p.woff2" 
          as="font" 
          type="font/woff2" 
          crossOrigin="anonymous" 
        />
      </head>
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