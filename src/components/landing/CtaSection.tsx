'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Button } from "@/components/ui/Button";

export function CtaSection() {
  return (
    <section className="py-20 relative">
      {/* Victorian decorative elements */}
      <svg className="absolute left-0 top-1/2 -translate-y-1/2 h-40 w-8 text-blue-200/30" viewBox="0 0 10 100" fill="currentColor" aria-hidden="true">
        <path d="M5 0C2.5 20 7.5 30 5 50S2.5 70 5 100M5 0C7.5 20 2.5 30 5 50S7.5 70 5 100" stroke="currentColor" strokeWidth="2" />
      </svg>
      
      <svg className="absolute right-0 top-1/2 -translate-y-1/2 h-40 w-8 text-blue-200/30" viewBox="0 0 10 100" fill="currentColor" aria-hidden="true">
        <path d="M5 0C2.5 20 7.5 30 5 50S2.5 70 5 100M5 0C7.5 20 2.5 30 5 50S7.5 70 5 100" stroke="currentColor" strokeWidth="2" />
      </svg>
      
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="text-center">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-serif font-bold text-blue-900 mb-4"
          >
            Plan Your Wedding Finances Together
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true }}
            className="text-lg text-foreground/80 mb-8 max-w-2xl mx-auto"
          >
            Start planning your wedding finances today with our elegant and intuitive planner designed for couples and their families.
          </motion.p>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true }}
            className="flex flex-col sm:flex-row justify-center items-center gap-4 my-8"
          >
            <Button asChild size="lg" className="bg-blue-900 hover:bg-blue-800 text-white px-8 rounded-md">
              <Link href="/signup">
                Get Started Free
              </Link>
            </Button>
            <Link href="mailto:wesleypitts15@gmail.com" className="text-blue-800 hover:text-blue-700 font-medium">
              Contact Support
            </Link>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true }}
            className="text-sm text-foreground/60 mt-6"
          >
            No credit card required · Free 30-day trial · Cancel anytime
          </motion.div>
        </div>
      </div>
    </section>
  );
} 