'use client';

import { useEffect, useRef } from 'react';

export function ParallaxBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;
      
      const scrollY = window.scrollY;
      const speed = 0.3; // Adjust this value to control parallax speed (lower = slower)
      
      // Apply the parallax effect to the background
      // We use CSS custom properties to control the transform
      parallaxRef.current.style.setProperty('--scroll-y', `${scrollY * speed}px`);
    };
    
    // Initial call to set the position
    handleScroll();
    
    // Add event listener with passive option for better performance
    window.addEventListener('scroll', handleScroll, { passive: true });
    
    // Add resize listener to ensure parallax works correctly after window resize
    window.addEventListener('resize', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, []);
  
  return (
    <div ref={parallaxRef} className="parallax-bg" />
  );
} 