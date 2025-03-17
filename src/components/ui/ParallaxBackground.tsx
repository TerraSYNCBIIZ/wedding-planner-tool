'use client';

import { useEffect, useRef } from 'react';

export function ParallaxBackground() {
  const parallaxRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const handleScroll = () => {
      if (!parallaxRef.current) return;
      
      const scrollY = window.scrollY;
      const speed = 0.15; // Reduced from 0.2 to 0.15 for even slower parallax effect
      
      // Apply the parallax effect to the background
      // We use CSS custom properties to control the transform
      parallaxRef.current.style.setProperty('--scroll-y', `${scrollY * speed}px`);
      
      // Get document height for checking scroll position
      const docHeight = Math.max(
        document.body.scrollHeight, 
        document.body.offsetHeight,
        document.documentElement.clientHeight,
        document.documentElement.scrollHeight, 
        document.documentElement.offsetHeight
      );
      
      // Check if we're near the bottom of the page - using a much earlier threshold
      const windowHeight = window.innerHeight;
      const scrollPosition = window.scrollY + windowHeight;
      const bottomThreshold = docHeight - windowHeight * 0.5; // Changed from 0.2 (20%) to 0.5 (50%)
      
      // Add class to extend background when close to bottom (now triggers much earlier)
      if (scrollPosition > bottomThreshold) {
        parallaxRef.current.classList.add('extend-background');
      } else {
        parallaxRef.current.classList.remove('extend-background');
      }
    };
    
    // Initial call to set the position
    handleScroll();
    
    // Add the extend-background class by default to ensure coverage
    if (parallaxRef.current) {
      parallaxRef.current.classList.add('extend-background');
    }
    
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