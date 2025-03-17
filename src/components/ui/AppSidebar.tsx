'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ChevronRight, 
  Menu, 
  X, 
  Home, 
  DollarSign, 
  Users, 
  Gift, 
  Mail
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

export function AppSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  // Close sidebar on mobile when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, []);

  // Close sidebar on mobile when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const sidebar = document.getElementById('sidebar');
      const mobileToggle = document.getElementById('mobile-toggle');
      
      if (
        sidebar && 
        mobileToggle && 
        !sidebar.contains(target) && 
        !mobileToggle.contains(target) && 
        isMobileOpen
      ) {
        setIsMobileOpen(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileOpen]);

  const navLinks = [
    { href: '/', label: 'Dashboard', icon: Home },
    { href: '/expenses', label: 'Expenses', icon: DollarSign },
    { href: '/contributors', label: 'Contributors', icon: Users },
    { href: '/profile', label: 'Invitations', icon: Mail },
  ];

  const isActive = (path: string) => pathname === path;

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <>
      {/* Mobile Toggle Button - Fixed at top left corner */}
      <button
        id="mobile-toggle"
        type="button"
        className="md:hidden fixed top-4 left-4 z-50 bg-white shadow-md rounded-full p-2 text-primary hover:bg-primary/5"
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        aria-label="Toggle navigation menu"
      >
        {isMobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>
      
      {/* Sidebar */}
      <aside
        id="sidebar"
        className={cn(
          "fixed inset-y-0 left-0 z-40 transition-all duration-300 ease-in-out bg-white border-r border-primary/10 shadow-sm flex flex-col",
          isCollapsed ? "w-16" : "w-64",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        {/* Victorian-inspired ornate top border */}
        <div className="h-px w-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
        
        {/* Logo and Brand */}
        <div className={cn(
          "p-4 border-b border-primary/10 flex items-center",
          isCollapsed ? "justify-center" : "justify-between"
        )}>
          <Link href="/" className="flex items-center">
            {isCollapsed ? (
              <div className="text-2xl font-serif italic text-primary">F</div>
            ) : (
              <div className="flex items-center">
                <div className="flex flex-col">
                  <span className="text-2xl font-serif text-primary tracking-tight flex items-center">
                    <span className="italic">Fin</span>Wed
                  </span>
                  <div className="h-px w-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10 my-1"></div>
                  <span className="text-xs font-sans tracking-widest uppercase text-primary/70">
                    the financial tool for weddings and honeymoons
                  </span>
                </div>
              </div>
            )}
          </Link>
          
          {!isCollapsed && (
            <button
              type="button"
              className="text-primary/60 hover:text-primary transition-colors md:flex hidden"
              onClick={toggleCollapse}
              aria-label="Collapse sidebar"
            >
              <ChevronRight size={18} />
            </button>
          )}
        </div>

        {/* Collapsible toggle button (visible when collapsed) */}
        {isCollapsed && (
          <button
            type="button"
            className="hidden md:flex justify-center py-3 text-primary/60 hover:text-primary hover:bg-primary/5 transition-colors"
            onClick={toggleCollapse}
            aria-label="Expand sidebar"
          >
            <ChevronRight size={18} className="rotate-180" />
          </button>
        )}
        
        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto py-6">
          <ul className="space-y-2 px-2">
            {navLinks.map(({ href, label, icon: Icon }) => (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center py-3 px-4 rounded-sm transition-all group relative",
                    isActive(href)
                      ? "bg-primary/5 text-primary font-medium"
                      : "text-foreground/80 hover:text-primary hover:bg-primary/5",
                    isCollapsed && "justify-center px-2"
                  )}
                >
                  <Icon size={isCollapsed ? 20 : 18} className={cn(!isCollapsed && "mr-3")} />
                  
                  {!isCollapsed && (
                    <span className="tracking-wide text-sm">{label}</span>
                  )}
                  
                  {/* Tooltip for collapsed state */}
                  {isCollapsed && (
                    <div className="absolute left-full ml-2 w-auto p-2 min-w-max rounded-sm shadow-md 
                      text-sm bg-white border border-primary/10 
                      text-foreground opacity-0 invisible 
                      group-hover:visible group-hover:opacity-100 
                      transition-opacity duration-300 z-50">
                      {label}
                    </div>
                  )}
                  
                  {/* Victorian ornament for active state */}
                  {isActive(href) && !isCollapsed && (
                    <div className="absolute right-3 text-primary/30 text-sm">✦</div>
                  )}
                </Link>
                
                {/* Decorative separator */}
                {href !== '/profile' && !isCollapsed && (
                  <div className="flex justify-center mt-2">
                    <div className="h-px w-2/3 bg-primary/5" />
                  </div>
                )}
              </li>
            ))}
          </ul>
        </nav>
        
        {/* User section at bottom */}
        <div className={cn(
          "border-t border-primary/10 p-4",
          isCollapsed ? "items-center justify-center" : "items-start"
        )}>
          <div className={cn(
            "flex items-center",
            isCollapsed && "flex-col"
          )}>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
              {user?.displayName?.[0] || 'U'}
            </div>
            {!isCollapsed && (
              <div className="ml-3 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.displayName || 'User'}</p>
                <p className="text-xs text-foreground/60 truncate">{user?.email || 'user@example.com'}</p>
              </div>
            )}
          </div>
        </div>
      </aside>
      
      {/* Page wrapper - adjust margin to account for sidebar */}
      <main className={cn(
        "transition-all duration-300 ease-in-out",
        isCollapsed ? "md:ml-16" : "md:ml-64",
        "ml-0" // No margin on mobile
      )}>
        {/* Page content will be rendered inside this */}
      </main>
    </>
  );
} 