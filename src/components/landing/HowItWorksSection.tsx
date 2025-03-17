'use client';

import { motion } from 'framer-motion';
import { Check, ClipboardList, CoinsIcon, UserPlus } from 'lucide-react';

interface StepCardProps {
  icon: React.ReactNode;
  step: number;
  title: string;
  description: string;
  delay: number;
}

function StepCard({ icon, step, title, description, delay }: StepCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay }}
      viewport={{ once: true }}
      className="relative flex flex-col md:flex-row items-center md:items-start gap-6 p-6"
    >
      {/* Step number with Victorian border */}
      <div className="relative flex-shrink-0">
        <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-700 to-blue-600 flex items-center justify-center text-white text-2xl font-serif shadow-md">
          {step}
        </div>
        <div className="absolute inset-0 h-16 w-16 rounded-full border border-blue-300 -m-1.5 opacity-60"></div>
        <div className="absolute top-20 h-16 w-px bg-blue-200 left-1/2 -translate-x-1/2 md:hidden"></div>
        {/* Connector line for desktop */}
        {step < 3 && (
          <div className="hidden md:block absolute top-8 -right-[calc(50%-2.5rem)] h-px w-[calc(100%-5rem)] border-t border-b border-dashed border-blue-200"></div>
        )}
      </div>

      {/* Content */}
      <div className="flex-grow md:pt-0 text-center md:text-left">
        <div className="mb-3 inline-flex items-center justify-center md:justify-start gap-2">
          <span className="p-2 rounded-full bg-primary/10 text-primary">
            {icon}
          </span>
          <h3 className="text-xl font-serif font-medium text-blue-900">{title}</h3>
        </div>
        <p className="text-foreground/70">{description}</p>
      </div>
    </motion.div>
  );
}

export function HowItWorksSection() {
  const steps = [
    {
      icon: <UserPlus size={20} />,
      title: "Create Your Account",
      description: "Sign up in seconds and set up your personalized wedding finance planner with basic wedding details."
    },
    {
      icon: <ClipboardList size={20} />,
      title: "Track Your Expenses",
      description: "Add your budget, categorize expenses, and keep track of all your wedding-related costs in one place."
    },
    {
      icon: <CoinsIcon size={20} />,
      title: "Manage Contributions",
      description: "Invite family members to contribute financially and track all gifts and payments easily."
    }
  ];

  return (
    <section id="how-it-works" className="relative pt-16 pb-20">
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
          How It Works
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-foreground/80 max-w-3xl mx-auto"
        >
          Start planning your wedding finances in three simple steps
        </motion.p>
      </div>

      {/* Steps */}
      <div className="max-w-4xl mx-auto">
        {steps.map((step, index) => (
          <StepCard
            key={`step-${index + 1}`}
            icon={step.icon}
            step={index + 1}
            title={step.title}
            description={step.description}
            delay={0.2 * index}
          />
        ))}
      </div>

      {/* Final CTA */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <div className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-green-50 border border-green-200 rounded-full text-green-700">
          <Check size={18} />
          <span className="font-medium">Ready to get started? Sign up for free today!</span>
        </div>
      </motion.div>
    </section>
  );
} 