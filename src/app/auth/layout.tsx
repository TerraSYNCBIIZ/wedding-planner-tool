'use client';

import { ParallaxBackground } from '@/components/ui/ParallaxBackground';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Keep the same background as main app */}
      <ParallaxBackground />
      
      {/* Auth container */}
      <div className="flex-grow flex flex-col items-center justify-center">
        {/* Logo/branding */}
        <div className="mb-8 text-center">
          <Link href="/" className="inline-flex items-center gap-2 group">
            <div className="flex flex-col">
              <span className="text-3xl font-serif text-primary tracking-tight flex items-center">
                <span className="italic">Fin</span>Wed
              </span>
              <div className="h-px w-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 my-1" />
              <span className="text-xs font-sans tracking-widest uppercase text-primary/70">
                the financial tool for weddings and honeymoons
              </span>
            </div>
          </Link>
        </div>
        
        {/* Auth content */}
        {children}
      </div>
      
      {/* Simple footer */}
      <footer className="py-4 text-center text-sm text-muted-foreground">
        <p>Wedding Finance Planner &copy; {new Date().getFullYear()}</p>
      </footer>
    </div>
  );
} 