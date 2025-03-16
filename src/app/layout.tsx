import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { WeddingProvider } from "../context/WeddingContext";
import { AppHeader } from "../components/ui/AppHeader";
import Link from "next/link";
import { BackButton } from "../components/ui/BackButton";
import { ParallaxBackground } from "../components/ui/ParallaxBackground";
import { AuthProvider } from '@/context/AuthContext';

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
        <ParallaxBackground />
        <AuthProvider>
          <WeddingProvider>
            <div className="flex flex-col min-h-screen">
              <AppHeader />
              <main className="flex-grow py-8">
                {children}
              </main>
              <footer className="border-t py-6 bg-muted/30">
                <div className="container flex flex-col sm:flex-row justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Wedding Finance Planner &copy; {new Date().getFullYear()}
                  </p>
                  <div className="flex items-center gap-4 mt-4 sm:mt-0">
                    <BackButton />
                    <Link
                      href="/privacy"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Privacy
                    </Link>
                    <Link
                      href="/help"
                      className="text-sm text-muted-foreground hover:text-foreground"
                    >
                      Help
                    </Link>
                  </div>
                </div>
              </footer>
            </div>
          </WeddingProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
