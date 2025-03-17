'use client';

import { useEffect } from 'react';
import { WeddingProvider } from "../context/WeddingContext";
import Link from "next/link";
import { BackButton } from "../components/ui/BackButton";
import { ParallaxBackground } from "../components/ui/ParallaxBackground";
import { AuthProvider } from '@/context/AuthContext';
import { InvitationProvider } from '@/context/InvitationContext';
import { WorkspaceProvider } from '@/context/WorkspaceContext';
import { initEmailJS } from '@/lib/emailjs-init';
import { AppSidebar } from '@/components/ui/AppSidebar';
import { ToastProvider } from '@/components/ui/toast';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Initialize EmailJS
  useEffect(() => {
    initEmailJS();
  }, []);

  return (
    <>
      <ParallaxBackground />
      <AuthProvider>
        <WorkspaceProvider>
          <WeddingProvider>
            <InvitationProvider>
              <ToastProvider>
                <div className="flex flex-col min-h-screen">
                  <AppSidebar />
                  <main className="flex-grow py-8">
                    {children}
                  </main>
                  <footer className="border-t py-6 bg-muted/30">
                    <div className="container flex flex-col sm:flex-row justify-between items-center">
                      <p className="text-sm text-muted-foreground">
                        Wedding Finance Planner &copy; {new Date().getFullYear()}
                      </p>
                      <div className="flex items-center gap-4 mt-4 sm:mt-0">
                        <BackButton />
                        <Link
                          href="/privacy"
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Privacy
                        </Link>
                        <Link
                          href="/help"
                          className="text-sm text-muted-foreground hover:text-foreground"
                        >
                          Help
                        </Link>
                      </div>
                    </div>
                  </footer>
                </div>
              </ToastProvider>
            </InvitationProvider>
          </WeddingProvider>
        </WorkspaceProvider>
      </AuthProvider>
    </>
  );
} 