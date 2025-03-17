'use client';

import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

export default function LandingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Background */}
      <ParallaxBackground />
      
      {/* Navigation */}
      <header className="relative z-10 border-b border-border/40 bg-background/60 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link href="/landing" className="inline-flex items-center gap-2 group">
              <div className="flex flex-col">
                <span className="text-2xl font-serif text-primary tracking-tight flex items-center">
                  <span className="italic">Fin</span>Wed
                </span>
                <div className="h-px w-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 my-1" />
                <span className="text-xs font-sans tracking-widest uppercase text-primary/70">
                  the financial tool for weddings and honeymoons
                </span>
              </div>
            </Link>
            
            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              <Link href="#features" className="text-foreground/80 hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="#how-it-works" className="text-foreground/80 hover:text-foreground transition-colors">
                How It Works
              </Link>
              <Link href="#pricing" className="text-foreground/80 hover:text-foreground transition-colors">
                Pricing
              </Link>
              <Link href="#faq" className="text-foreground/80 hover:text-foreground transition-colors">
                FAQ
              </Link>
            </nav>
            
            {/* Auth Buttons */}
            <div className="flex items-center gap-3">
              {!loading && !user ? (
                <>
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">Log In</Button>
                  </Link>
                  <Link href="/auth/signup">
                    <Button size="sm">Sign Up</Button>
                  </Link>
                </>
              ) : (
                <Link href="/">
                  <Button size="sm">Dashboard</Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="relative z-10 border-t py-6 bg-muted/30">
        <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Wedding Finance Planner &copy; {new Date().getFullYear()}
          </p>
          <div className="flex items-center gap-4 mt-4 md:mt-0">
            <Link
              href="/privacy"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Terms
            </Link>
            <Link
              href="mailto:wesleypitts15@gmail.com"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
} 