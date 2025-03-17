'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface PricingTierProps {
  name: string;
  price: string;
  description: string;
  features: string[];
  isPopular?: boolean;
  delay: number;
  isPremium?: boolean;
  annualPrice?: string;
  saveAmount?: string;
}

function PricingTier({ 
  name, 
  price, 
  description, 
  features, 
  isPopular, 
  delay,
  isPremium,
  annualPrice,
  saveAmount
}: PricingTierProps) {
  const router = useRouter();
  const [isAnnual, setIsAnnual] = useState(true);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className={`relative flex flex-col p-8 bg-card/80 backdrop-blur-sm rounded-lg ${
        isPopular ? 'shadow-lg border-2 border-blue-300' : 'shadow-sm border border-blue-100'
      }`}
    >
      {isPopular && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white text-sm font-medium py-1 px-4 rounded-full">
          Most Popular
        </div>
      )}
      
      {/* Victorian ornamental top border */}
      <div className="absolute top-2 left-1/2 -translate-x-1/2 w-32 h-2 opacity-20">
        <svg viewBox="0 0 100 4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0 2C10 0 20 4 30 2C40 0 50 4 60 2C70 0 80 4 90 2C100 0 100 2 100 2" stroke="#244BCC" strokeWidth="0.5" />
          <path d="M0 2C10 4 20 0 30 2C40 4 50 0 60 2C70 4 80 0 90 2C100 4 100 2 100 2" stroke="#244BCC" strokeWidth="0.5" />
        </svg>
      </div>
      
      <h3 className="text-xl font-serif font-bold text-blue-900 mb-2 mt-4">{name}</h3>
      
      {isPremium ? (
        <div className="mb-6">
          <div className="flex justify-center space-x-3 mb-4">
            <button 
              type="button"
              onClick={() => setIsAnnual(false)}
              className={`text-sm px-3 py-1 rounded-l-full ${!isAnnual ? 'bg-blue-100 text-blue-800' : 'text-foreground/60'}`}
            >
              Monthly
            </button>
            <button 
              type="button"
              onClick={() => setIsAnnual(true)}
              className={`text-sm px-3 py-1 rounded-r-full ${isAnnual ? 'bg-blue-100 text-blue-800' : 'text-foreground/60'}`}
            >
              One-time
            </button>
          </div>
          
          <div className="flex items-baseline justify-center">
            <span className="text-3xl font-bold">{isAnnual ? annualPrice : price}</span>
            {!isAnnual && <span className="text-foreground/60 ml-1">/mo</span>}
          </div>
          
          {isAnnual && (
            <div className="mt-2 text-sm text-green-600 font-medium text-center">
              Save with one-time payment!
            </div>
          )}
        </div>
      ) : (
        <div className="mb-4">
          <span className="text-3xl font-bold">{price}</span>
          {price !== 'Free' && <span className="text-foreground/60 ml-1">/mo</span>}
        </div>
      )}
      
      <p className="text-foreground/70 mb-6">{description}</p>
      
      <ul className="space-y-3 mb-8">
        {features.map((feature, idx) => (
          <li key={`${name.toLowerCase()}-feature-${idx}`} className="flex items-start">
            <Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
            <span className="text-foreground/80">{feature}</span>
          </li>
        ))}
      </ul>
      
      <div className="mt-auto">
        <Button 
          className="w-full" 
          variant={isPopular ? "default" : "outline"}
          onClick={() => router.push('/auth/signup')}
        >
          {price === 'Free' ? 'Get Started' : 'Choose Plan'}
        </Button>
      </div>
      
      {/* Victorian ornamental bottom border */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-2 opacity-20 rotate-180">
        <svg viewBox="0 0 100 4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0 2C10 0 20 4 30 2C40 0 50 4 60 2C70 0 80 4 90 2C100 0 100 2 100 2" stroke="#244BCC" strokeWidth="0.5" />
          <path d="M0 2C10 4 20 0 30 2C40 4 50 0 60 2C70 4 80 0 90 2C100 4 100 2 100 2" stroke="#244BCC" strokeWidth="0.5" />
        </svg>
      </div>
    </motion.div>
  );
}

export function PricingSection() {
  const pricingTiers = [
    {
      name: "Basic",
      price: "Free",
      description: "Perfect for couples just starting their wedding planning journey.",
      features: [
        "Basic budget tracking",
        "Up to 20 expenses",
        "Track gifts and payments",
        "Email support"
      ]
    },
    {
      name: "Premium",
      price: "$9.99",
      annualPrice: "$39",
      description: "Enhanced features for comprehensive wedding financial planning.",
      features: [
        "Unlimited expenses",
        "Full dashboard access",
        "Invite collaborators",
        "Custom categories",
        "Priority support"
      ],
      isPopular: true,
      isPremium: true,
      saveAmount: "$80"
    }
  ];

  return (
    <section id="pricing" className="relative pt-16 pb-20">
      {/* Victorian ornamental divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-8 bg-no-repeat bg-contain bg-center opacity-30 rotate-180"
           style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyMDAgMzAiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik0wIDE1QzAgMTUgMjAgMCAzNCAxNUM0OCAzMCA2OCAxNSA4MiAxNUM5NiAxNSAxMTYgMzAgMTMwIDE1QzE0NCAwIDE2NCAxNSAxNzggMTVDMTkyIDE1IDIwMCAxNSAyMDAgMTVNMCAxNUMwIDE1IDIwIDMwIDM0IDE1QzQ4IDAgNjggMTUgODIgMTVDOTYgMTUgMTE2IDAgMTMwIDE1QzE0NCAzMCAxNjQgMTUgMTc4IDE1QzE5MiAxNSAyMDAgMTUgMjAwIDE1IiBzdHJva2U9IiMwMDAiIHN0cm9rZS13aWR0aD0iMSIvPjwvc3ZnPg==')" }}
      />
      
      {/* Section heading */}
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          viewport={{ once: true }}
          className="text-3xl md:text-4xl font-serif font-bold text-blue-900 mb-4"
        >
          Affordable Plans
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-foreground/80 max-w-3xl mx-auto"
        >
          Choose the perfect plan for your wedding planning needs
        </motion.p>
      </div>

      {/* Pricing tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {pricingTiers.map((tier, index) => (
          <PricingTier
            key={`tier-${tier.name.toLowerCase()}`}
            name={tier.name}
            price={tier.price}
            description={tier.description}
            features={tier.features}
            isPopular={tier.isPopular}
            isPremium={tier.isPremium}
            annualPrice={tier.annualPrice}
            saveAmount={tier.saveAmount}
            delay={0.1 * (index + 1)}
          />
        ))}
      </div>
      
      {/* Money-back guarantee */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <p className="text-foreground/70 italic">
          All paid plans come with a 14-day money-back guarantee.
        </p>
      </motion.div>
    </section>
  );
} 