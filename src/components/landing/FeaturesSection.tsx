'use client';

import { motion } from 'framer-motion';
import { 
  CalendarClock, 
  CreditCard, 
  Lightbulb, 
  Users 
} from 'lucide-react';

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}

function FeatureCard({ icon, title, description, delay }: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="flex flex-col items-center p-6 bg-card/70 backdrop-blur-sm rounded-lg shadow-sm border border-blue-100 hover:shadow-md hover:border-blue-200 transition-all duration-300"
    >
      <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 text-primary">
        {icon}
      </div>
      <h3 className="text-xl font-serif font-medium text-blue-900 mb-3">{title}</h3>
      <p className="text-center text-foreground/70">{description}</p>
    </motion.div>
  );
}

export function FeaturesSection() {
  const features = [
    {
      icon: <CreditCard size={24} />,
      title: "Budget Management",
      description: "Track all wedding expenses in one place with customizable categories and budget limits."
    },
    {
      icon: <Users size={24} />,
      title: "Shared Responsibilities",
      description: "Delegate financial tasks to family members or the wedding party with collaborative planning."
    },
    {
      icon: <CalendarClock size={24} />,
      title: "Payment Scheduling",
      description: "Never miss a vendor payment with automated reminders and payment tracking."
    },
    {
      icon: <Lightbulb size={24} />,
      title: "Smart Insights",
      description: "Get suggestions for budget optimization and see where you can save without compromising."
    }
  ];

  return (
    <section id="features" className="relative pt-8 pb-16">
      {/* Victorian ornamental divider */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-8 bg-no-repeat bg-contain bg-center opacity-30"
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
          Elegant Planning Features
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-foreground/80 max-w-3xl mx-auto"
        >
          Our wedding finance planner combines beautiful design with powerful functionality
          to make your wedding planning journey as smooth as possible.
        </motion.p>
      </div>

      {/* Features grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
        {features.map((feature, index) => (
          <FeatureCard
            key={index}
            icon={feature.icon}
            title={feature.title}
            description={feature.description}
            delay={0.1 * (index + 1)}
          />
        ))}
      </div>
    </section>
  );
} 