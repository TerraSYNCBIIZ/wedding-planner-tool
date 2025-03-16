'use client';

import Link from 'next/link';
import { Button } from '../ui/Button';

interface FormPageLayoutProps {
  children: React.ReactNode;
  title: string;
  backLink: string;
  backLinkText: string;
}

export default function FormPageLayout({
  children,
  title,
  backLink,
  backLinkText,
}: FormPageLayoutProps) {
  return (
    <div className="container mx-auto py-8 px-4 max-w-3xl">
      <div className="mb-6">
        <Link href={backLink} className="text-primary hover:underline inline-flex items-center">
          <span className="mr-1" aria-hidden="true">←</span>
          {backLinkText}
        </Link>
      </div>
      
      <div className="bg-card rounded-lg shadow-md p-6">
        <h1 className="text-2xl font-bold mb-6 pb-2 border-b">{title}</h1>
        {children}
      </div>
    </div>
  );
} 