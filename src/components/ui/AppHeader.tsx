'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { User, PieChart, Users, Gift } from 'lucide-react';

const NavLink = ({ href, children, icon }: { href: string; children: React.ReactNode; icon: React.ReactNode }) => {
  const pathname = usePathname();
  const isActive = pathname === href;
  
  return (
    <Link 
      href={href}
      className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
        isActive 
          ? 'bg-blue-100 text-blue-700 border border-blue-200' 
          : 'text-slate-700 hover:text-blue-700 hover:bg-blue-50'
      }`}
    >
      {icon}
      {children}
    </Link>
  );
};

export function AppHeader() {
  const { user } = useAuth();
  const pathname = usePathname();
  
  return (
    <header className="border-b border-blue-800/30 bg-white/90 backdrop-blur supports-[backdrop-filter]:bg-white/90 sticky top-0 z-50 shadow-md">
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 flex h-16 items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-800 to-blue-600 flex items-center justify-center text-white font-serif text-lg shadow-sm group-hover:shadow transition-all duration-200">W</span>
            <span className="font-serif font-bold text-lg text-blue-900 hidden sm:inline-block group-hover:text-blue-700 transition-colors duration-200">Wedding Planner</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-3">
            <NavLink href="/expenses" icon={<PieChart size={16} />}>Expenses</NavLink>
            <NavLink href="/contributors" icon={<Users size={16} />}>Contributors</NavLink>
            <NavLink href="/gifts" icon={<Gift size={16} />}>Gifts</NavLink>
          </nav>
        </div>
        
        <div className="flex items-center gap-4">
          {user && (
            <Link 
              href="/profile"
              className="flex items-center justify-center h-9 w-9 rounded-full bg-blue-100 text-blue-800 hover:bg-blue-200 transition-colors"
              title="Your Profile"
            >
              <User size={18} />
            </Link>
          )}
        </div>
      </div>
      
      {/* Mobile Nav */}
      <div className="md:hidden border-t border-blue-200 bg-white">
        <div className="container max-w-7xl mx-auto flex justify-between">
          <Link 
            href="/"
            className={`flex flex-col items-center pt-1.5 pb-0.5 px-4 ${
              pathname === '/' ? 'text-blue-700' : 'text-slate-700'
            }`}
          >
            <span className="flex flex-col items-center pt-1.5 pb-0.5">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mb-1" aria-labelledby="home-icon-title">
                <title id="home-icon-title">Home</title>
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              </svg>
              <span className="text-xs font-medium">Home</span>
            </span>
          </Link>
          
          <Link 
            href="/expenses"
            className={`flex flex-col items-center pt-1.5 pb-0.5 px-4 ${
              pathname === '/expenses' ? 'text-blue-700' : 'text-slate-700'
            }`}
          >
            <span className="flex flex-col items-center pt-1.5 pb-0.5">
              <PieChart size={18} className="mb-1" aria-labelledby="expenses-icon-title" />
              <title id="expenses-icon-title">Expenses</title>
              <span className="text-xs font-medium">Expenses</span>
            </span>
          </Link>
          
          <Link 
            href="/contributors"
            className={`flex flex-col items-center pt-1.5 pb-0.5 px-4 ${
              pathname === '/contributors' ? 'text-blue-700' : 'text-slate-700'
            }`}
          >
            <span className="flex flex-col items-center pt-1.5 pb-0.5">
              <Users size={18} className="mb-1" aria-labelledby="contributors-icon-title" />
              <title id="contributors-icon-title">Contributors</title>
              <span className="text-xs font-medium">Contributors</span>
            </span>
          </Link>
          
          <Link 
            href="/gifts"
            className={`flex flex-col items-center pt-1.5 pb-0.5 px-4 ${
              pathname === '/gifts' ? 'text-blue-700' : 'text-slate-700'
            }`}
          >
            <span className="flex flex-col items-center pt-1.5 pb-0.5">
              <Gift size={18} className="mb-1" aria-labelledby="gifts-icon-title" />
              <title id="gifts-icon-title">Gifts</title>
              <span className="text-xs font-medium">Gifts</span>
            </span>
          </Link>
        </div>
      </div>
    </header>
  );
} 