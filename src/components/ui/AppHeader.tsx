'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X, ChevronDown } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export function AppHeader() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSectionMenuOpen, setIsSectionMenuOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  
  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const toggleSectionMenu = () => setIsSectionMenuOpen(!isSectionMenuOpen);
  
  // Close section menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // Skip if the click is on the section menu button
      const target = e.target as Node;
      const sectionButtons = document.querySelectorAll('[data-section-button]');
      for (const button of Array.from(sectionButtons)) {
        if (button.contains(target)) {
          return;
        }
      }
      if (isSectionMenuOpen) setIsSectionMenuOpen(false);
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isSectionMenuOpen]);
  
  const navLinks = [
    { href: '/expenses', label: 'Expenses' },
    { href: '/contributors', label: 'Contributors' },
    { href: '/gifts', label: 'Gifts' },
    { href: '/profile', label: 'Invitations' },
  ];
  
  const isActive = (path: string) => pathname === path;
  
  // Get current section name
  const getCurrentSection = () => {
    const currentLink = navLinks.find(link => isActive(link.href));
    return currentLink ? currentLink.label : 'Dashboard';
  };
  
  // Handle keyboard events
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleSectionMenu();
    }
  };
  
  return (
    <header className="bg-white/95 border-b border-primary/10 shadow-sm sticky top-0 z-10 backdrop-blur-sm">
      {/* Subtle ornate top border */}
      <div className="h-px w-full bg-gradient-to-r from-primary/10 via-primary/40 to-primary/10" />
      
      <div className="relative w-full h-14 flex items-center px-4 md:px-6">
        {/* Logo at left */}
        <div className="flex-shrink-0">
          <Link href="/" className="flex items-center group">
            <span className="text-lg font-medium text-primary tracking-wide group-hover:text-primary/80 transition-colors duration-300">
              Wedding Planner
            </span>
            <div className="ml-1.5 text-primary/40 text-xs">✦</div>
          </Link>
        </div>

        {/* Section title/selector (desktop) */}
        <button
          className="hidden md:flex items-center mx-auto text-left"
          onClick={(e) => {
            e.stopPropagation();
            toggleSectionMenu();
          }}
          aria-haspopup="true"
          aria-expanded={isSectionMenuOpen}
          data-section-button
          type="button"
        >
          <div className="relative flex items-center">
            <span className="text-sm uppercase tracking-wider font-medium text-foreground/80">
              {getCurrentSection()}
            </span>
            <ChevronDown className="h-4 w-4 ml-1 text-foreground/60" />
            
            {/* Dropdown section menu */}
            {isSectionMenuOpen && (
              <div className="absolute top-full mt-2 bg-white/95 backdrop-blur-sm shadow-md border border-primary/10 rounded-sm py-1 w-40 -left-16 z-20">
                <div className="py-1">
                  {navLinks.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`block px-4 py-2 text-sm ${
                        isActive(href) 
                          ? 'text-primary bg-primary/5' 
                          : 'text-foreground hover:text-primary hover:bg-primary/5'
                      }`}
                      onClick={() => setIsSectionMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </button>

        {/* Nav links on desktop (horizontal tabs) */}
        <nav className="hidden md:flex items-center space-x-8 ml-auto">
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm tracking-wide py-1 transition-all duration-300 relative ${
                isActive(href) 
                  ? 'text-primary font-medium after:absolute after:bottom-0 after:left-1/3 after:w-1/3 after:h-0.5 after:bg-primary/40' 
                  : 'text-foreground/80 hover:text-primary'
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Mobile section dropdown */}
        <div className="flex md:hidden mx-auto">
          <button 
            className="flex items-center text-left"
            onClick={(e) => {
              e.stopPropagation();
              toggleSectionMenu();
            }}
            aria-haspopup="true"
            aria-expanded={isSectionMenuOpen}
            data-section-button
            type="button"
          >
            <span className="text-sm uppercase tracking-wider font-medium text-foreground/80">
              {getCurrentSection()}
            </span>
            <ChevronDown className="h-4 w-4 ml-1 text-foreground/60" />
          </button>
        </div>

        {/* Mobile Menu Button */}
        <div className="md:hidden flex-shrink-0">
          <button 
            type="button"
            onClick={toggleMenu}
            className="p-1.5 text-primary hover:bg-primary/5 transition-colors rounded-full"
            aria-expanded={isMenuOpen}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Mobile section dropdown menu */}
      {isSectionMenuOpen && (
        <div className="md:hidden border-b border-primary/10 bg-white/95 backdrop-blur-sm shadow-sm">
          <div className="py-2 px-4">
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`block py-2 text-sm ${
                  isActive(href) 
                    ? 'text-primary font-medium' 
                    : 'text-foreground/80 hover:text-primary'
                }`}
                onClick={() => {
                  setIsSectionMenuOpen(false);
                }}
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Navigation Menu */}
      {isMenuOpen && (
        <nav className="md:hidden bg-white/95 border-t border-primary/10 shadow-inner backdrop-blur-sm">
          <div className="px-6 py-3">
            <ul className="space-y-3">
              {navLinks.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className={`block py-2 text-sm relative ${
                      isActive(href) 
                        ? 'text-primary font-medium border-l border-primary pl-3' 
                        : 'text-foreground/80 hover:text-primary hover:border-l hover:border-primary/30 hover:pl-3 transition-all duration-200'
                    }`}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {label}
                  </Link>
                  {/* Simple separator */}
                  {href !== '/profile' && (
                    <div className="flex justify-center mt-3">
                      <div className="h-px w-12 bg-primary/5" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      )}
    </header>
  );
} 