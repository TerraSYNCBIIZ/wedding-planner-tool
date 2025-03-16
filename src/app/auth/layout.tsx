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
            <span className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center text-white font-serif text-2xl shadow-md group-hover:shadow-lg transition-all duration-200">W</span>
            <span className="font-serif font-bold text-2xl text-blue-900 group-hover:text-blue-700 transition-colors duration-200">Wedding Planner</span>
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