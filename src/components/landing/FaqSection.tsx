'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

interface FaqItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  onToggle: () => void;
  delay: number;
}

function FaqItem({ question, answer, isOpen, onToggle, delay }: FaqItemProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      viewport={{ once: true }}
      className="border border-blue-100 rounded-lg overflow-hidden mb-4"
    >
      <button
        onClick={onToggle}
        className="flex justify-between items-center w-full p-4 text-left bg-card/60 hover:bg-card/90 transition-colors duration-200"
      >
        <h3 className="font-serif text-lg font-medium text-blue-900">{question}</h3>
        <ChevronDown 
          className={`h-5 w-5 text-blue-600 transition-transform duration-300 ${
            isOpen ? 'transform rotate-180' : ''
          }`} 
        />
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${
          isOpen ? 'max-h-96 p-4 bg-white/50' : 'max-h-0'
        }`}
      >
        <p className="text-foreground/80">{answer}</p>
      </div>
    </motion.div>
  );
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqItems = [
    {
      question: "How does the wedding finance planner work?",
      answer: "Our wedding finance planner allows you to track all wedding-related expenses, set budgets for different categories, and invite collaborators to help manage finances. You can create custom expense categories, track payments, and get insights on your spending patterns."
    },
    {
      question: "Can I share access with my partner or family members?",
      answer: "Yes! You can invite your partner, family members, or anyone else involved in planning or financing your wedding. Each person gets their own account with permissions you control, making it easy to collaborate on financial decisions."
    },
    {
      question: "Is my financial information secure?",
      answer: "Absolutely. We use bank-level encryption to protect all your data. We never store actual bank account or credit card numbers unless you explicitly opt-in to payment services. Your privacy and security are our top priorities."
    },
    {
      question: "Can I track contributions from family members?",
      answer: "Yes, our system allows you to track financial contributions from anyone helping with your wedding expenses. You can record who contributed what amount, what it's earmarked for, and send thank you reminders."
    },
    {
      question: "Do you offer a mobile app?",
      answer: "Our platform is fully responsive and works beautifully on mobile devices through your browser. This means you can track expenses on the go without needing to download a separate app."
    },
    {
      question: "What payment methods are accepted?",
      answer: "For our premium plans, we accept all major credit cards, PayPal, and in some regions, direct bank transfers. All payments are securely processed through our payment partners."
    }
  ];

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="relative pt-16 pb-20">
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
          Frequently Asked Questions
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          viewport={{ once: true }}
          className="text-lg text-foreground/80 max-w-3xl mx-auto"
        >
          Find answers to common questions about our wedding finance planner
        </motion.p>
      </div>

      {/* FAQ accordion */}
      <div className="max-w-3xl mx-auto">
        {faqItems.map((item, index) => (
          <FaqItem
            key={`faq-${index}`}
            question={item.question}
            answer={item.answer}
            isOpen={openIndex === index}
            onToggle={() => handleToggle(index)}
            delay={0.1 * index}
          />
        ))}
      </div>
      
      {/* Additional support */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.6 }}
        viewport={{ once: true }}
        className="mt-12 text-center"
      >
        <p className="text-foreground/80">
          Still have questions? <a href="mailto:wesleypitts15@gmail.com" className="text-blue-600 hover:text-blue-800 underline underline-offset-2">Contact our support team</a>
        </p>
      </motion.div>
    </section>
  );
} 