'use client';

import { useEffect, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { motion } from 'framer-motion';

export function HeroSection() {
  const backgroundRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Star rating array with stable keys
  const stars = [
    { id: 'star-1', value: 5 },
    { id: 'star-2', value: 5 },
    { id: 'star-3', value: 5 },
    { id: 'star-4', value: 5 },
    { id: 'star-5', value: 5 },
  ];

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!backgroundRef.current) return;
      
      const { clientX, clientY } = e;
      const moveX = clientX - window.innerWidth / 2;
      const moveY = clientY - window.innerHeight / 2;
      
      backgroundRef.current.style.transform = `translate(${moveX * 0.01}px, ${moveY * 0.01}px)`;
    };

    // Play the video when component mounts
    if (videoRef.current) {
      videoRef.current.play().catch(err => console.log('Auto-play prevented:', err));
    }

    document.addEventListener('mousemove', handleMouseMove);
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  return (
    <section className="relative overflow-hidden py-16 md:py-24 lg:py-32">
      {/* Background decor - subtle Victorian patterns */}
      <div
        ref={backgroundRef}
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80' fill='%232463EB' opacity='0.3'%3E%3Cpath d='M0 0h40v40H0zm40 40h40v40H40z' fill-opacity='0.4'/%3E%3Cpath d='M40 0h40v40H40zM0 40h40v40H0z' fill-opacity='0.2'/%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px',
        }}
        aria-hidden="true"
      />

      <div className="container mx-auto px-4 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
          {/* Left Content */}
          <div className="w-full lg:w-1/2 text-center lg:text-left">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center bg-blue-100 rounded-full px-4 py-1.5 text-sm font-medium text-blue-800 mb-6"
            >
              <Sparkles size={16} className="mr-1.5" />
              New: Family contribution tracking
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-blue-900 mb-6 leading-tight"
            >
              Plan Your Wedding Finances <span className="italic text-blue-700">Together</span>
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-foreground/80 mb-8 max-w-lg mx-auto lg:mx-0"
            >
              An elegant wedding budget planner designed for couples and their 
              families to collaborate seamlessly on wedding expenses.
            </motion.p>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Button asChild size="lg" className="bg-blue-900 hover:bg-blue-800 text-white px-8">
                <Link href="/signup">
                  Get Started Free
                </Link>
              </Button>
              <Link href="/#features" scroll={false} className="text-blue-800 hover:text-blue-700 font-medium">
                Learn More
              </Link>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="mt-10 text-center lg:text-left"
            >
              <p className="text-sm text-foreground/60 mb-2">Trusted by couples planning weddings worldwide</p>
              <div className="flex items-center justify-center lg:justify-start space-x-2">
                {stars.map((star) => (
                  <svg 
                    key={star.id} 
                    className="w-5 h-5 text-yellow-500" 
                    fill="currentColor" 
                    viewBox="0 0 20 20" 
                    aria-hidden="true"
                  >
                    <title>5 star rating</title>
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
                <span className="text-foreground/80 text-sm font-medium">4.9/5 from 200+ couples</span>
              </div>
            </motion.div>
          </div>
          
          {/* Right Dashboard Preview with Video */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="w-full lg:w-1/2 relative"
          >
            <div className="relative bg-white rounded-xl shadow-2xl overflow-hidden border border-blue-100">
              {/* Victorian style frame */}
              <div className="absolute inset-0 border-4 border-blue-50 rounded-xl pointer-events-none" />
              <div className="absolute inset-0 border border-blue-200 rounded-xl m-3 pointer-events-none" />
              
              {/* Dashboard Header Mockup */}
              <div className="bg-gradient-to-r from-blue-900 to-blue-800 px-6 py-4 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="flex-shrink-0">
                      <span className="text-xl font-serif text-white tracking-tight flex items-center">
                        <span className="italic">Fin</span>Wed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-blue-700 flex items-center justify-center">
                      <span className="text-xs font-bold">SC</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Dashboard Video Preview */}
              <div className="p-4 bg-gray-50 overflow-hidden">
                <div className="rounded-md shadow-sm overflow-hidden aspect-video">
                  <video 
                    ref={videoRef}
                    className="w-full h-full object-cover object-center scale-[1.05]"
                    muted
                    loop
                    playsInline
                    poster="/dashboard-preview.svg"
                  >
                    <source src="/dashboard-preview.mp4" type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>
              </div>
            </div>
            
            {/* Victorian ornamental decoration */}
            <div className="absolute -bottom-6 -right-6 w-24 h-24 opacity-30" aria-hidden="true">
              <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <title>Victorian ornamental decoration</title>
                <path d="M0 50C0 50 20 0 50 0C80 0 100 50 100 50" stroke="#244BCC" strokeWidth="1" />
                <path d="M0 50C0 50 20 100 50 100C80 100 100 50 100 50" stroke="#244BCC" strokeWidth="1" />
                <circle cx="50" cy="50" r="10" stroke="#244BCC" strokeWidth="1" fill="none" />
                <circle cx="50" cy="50" r="20" stroke="#244BCC" strokeWidth="1" fill="none" />
                <circle cx="50" cy="50" r="30" stroke="#244BCC" strokeWidth="1" fill="none" />
                <circle cx="50" cy="50" r="40" stroke="#244BCC" strokeWidth="1" fill="none" />
              </svg>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
} 