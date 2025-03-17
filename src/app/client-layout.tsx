'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
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
import { initApiBlocker } from '@/lib/blockedApiHosts';
import { WorkspaceSynchronizer } from '@/components/workspace/WorkspaceSynchronizer';
import { ConnectionStatus } from '@/components/ui/ConnectionStatus';

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isLandingPage = pathname === '/landing';

  // Initialize EmailJS and API blocker
  useEffect(() => {
    initEmailJS();
    initApiBlocker(); // Initialize the API blocker to prevent unwanted API calls
  }, []);

  return (
    <>
      <ParallaxBackground />
      <ToastProvider>
        <AuthProvider>
          <WorkspaceProvider>
            <WeddingProvider>
              <InvitationProvider>
                <WorkspaceSynchronizer />
                <div className="flex flex-col min-h-screen">
                  {/* Only render the sidebar if not on the landing page */}
                  {!isLandingPage && <AppSidebar />}
                  
                  {/* Connection status indicator */}
                  {!isLandingPage && (
                    <div className="fixed top-4 right-4 z-50">
                      <ConnectionStatus variant="pill" />
                    </div>
                  )}
                  
                  {/* Main content */}
                  <main className={`flex-grow ${!isLandingPage ? 'py-8' : ''}`}>
                    {children}
                  </main>
                  
                  {/* Only render the global footer if not on the landing page */}
                  {!isLandingPage && (
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
                  )}
                </div>
              </InvitationProvider>
            </WeddingProvider>
          </WorkspaceProvider>
        </AuthProvider>
      </ToastProvider>
    </>
  );
} 