'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

interface TestimonialCardProps {
  quote: string;
  author: string;
  role: string;
  delay: number;
}

function TestimonialCard({ quote, author, role, delay }: TestimonialCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="relative p-8 bg-card/80 backdrop-blur-sm rounded-lg shadow-sm"
    >
      {/* Victorian style quote decoration */}
      <div className="absolute top-6 left-6 text-blue-200 opacity-20">
        <Quote size={60} />
      </div>
      
      {/* Victorian ornamental border */}
      <div className="absolute inset-0 border border-blue-100 rounded-lg" />
      <div className="absolute inset-0 border border-blue-200 rounded-lg m-1 opacity-50" />
      
      <div className="relative">
        <p className="text-foreground/80 italic mb-6 relative z-10">{quote}</p>
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-700 to-blue-500 flex items-center justify-center text-white font-serif">
            {author.charAt(0)}
          </div>
          <div className="ml-3">
            <p className="font-medium text-foreground">{author}</p>
            <p className="text-sm text-foreground/60">{role}</p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function TestimonialsSection() {
  const testimonials = [
    {
      id: 'testimonial-1',
      quote: "This wedding planner made our financial planning so much easier. We could see exactly where our money was going and share updates with our families.",
      author: "Emily & James",
      role: "Married June 2023"
    },
    {
      id: 'testimonial-2',
      quote: "The shared contribution tracking was perfect for our wedding. Our parents could see exactly what they were contributing to without any awkward conversations.",
      author: "Michael & Sarah",
      role: "Married September 2023"
    },
    {
      id: 'testimonial-3',
      quote: "We avoided so many budget surprises because of this planner. The expense categories and tracking helped us stay on target for our dream day.",
      author: "David & Lisa",
      role: "Married April 2023"
    }
  ];

  return (
    <section className="relative pt-16 pb-20">
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
          From Happy Couples
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-foreground/80 max-w-3xl mx-auto"
        >
          See what other couples are saying about our wedding finance planner
        </motion.p>
      </div>

      {/* Testimonials grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {testimonials.map((testimonial, index) => (
          <TestimonialCard
            key={testimonial.id}
            quote={testimonial.quote}
            author={testimonial.author}
            role={testimonial.role}
            delay={0.1 * (index + 1)}
          />
        ))}
      </div>
      
      {/* Victorian ornament */}
      <div className="mt-16 flex justify-center">
        <div className="w-32 h-8 bg-no-repeat bg-contain bg-center opacity-30 my-4"
             style={{ backgroundImage: "url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMjAiIGZpbGw9Im5vbmUiPjxwYXRoIGQ9Ik01MCAxMGMwIDAgLTEwIC0xMCAtMjAgMCAtMTAgMTAgLTIwIDAgLTMwIDAiIHN0cm9rZT0iIzI0NEJDQyIgc3Ryb2tlLXdpZHRoPSIxIi8+PHBhdGggZD0iTTUwIDEwYzAgMCAxMCAtMTAgMjAgMCAxMCAxMCAyMCAwIDMwIDAiIHN0cm9rZT0iIzI0NEJDQyIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9zdmc+')" }}
        />
      </div>
    </section>
  );
} 