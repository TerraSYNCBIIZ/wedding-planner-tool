'use client';

import { HeroSection } from '@/components/landing/HeroSection';
import { FeaturesSection } from '@/components/landing/FeaturesSection';
import { HowItWorksSection } from '@/components/landing/HowItWorksSection';
import { TestimonialsSection } from '@/components/landing/TestimonialsSection';
import { PricingSection } from '@/components/landing/PricingSection';
import { FaqSection } from '@/components/landing/FaqSection';
import { CtaSection } from '@/components/landing/CtaSection';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-24">
        {/* Key Features */}
        <FeaturesSection />
        
        {/* How It Works */}
        <HowItWorksSection />
        
        {/* Testimonials */}
        <TestimonialsSection />
        
        {/* Pricing */}
        <PricingSection />
        
        {/* FAQ */}
        <FaqSection />
        
        {/* Final CTA */}
        <CtaSection />
      </div>
    </div>
  );
} 