'use client';

import { useWedding } from '../context/WeddingContext';
import { formatCurrency } from '../lib/excel-utils';
import { calculatePaidAmount } from '../lib/excel-utils';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Button } from '../components/ui/Button';
import { WeddingDetails } from '@/components/dashboard/WeddingDetails';
import { useAuth } from '@/context/AuthContext';
import { UpcomingPayments } from '@/components/dashboard/UpcomingPayments';
import { WorkspaceMembership } from '@/components/dashboard/WorkspaceMembership';
import { QuickActionPanel } from '@/components/dashboard/QuickActionPanel';
import { useRouter } from 'next/navigation';
import { firestore } from '@/lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { hasCompletedSetup, setHasCompletedSetup } from '@/lib/wizard-utils';
import { TrendingDown } from 'lucide-react';
import { PaymentDialog } from '@/components/dashboard/PaymentDialog';
import type { Expense } from '@/types';

export default function Home() {
  const { expenses, gifts, contributors, isLoading, getDashboardStats, exportData } = useWedding();
  const { user, loading: authLoading } = useAuth();
  const [stats, setStats] = useState(() => getDashboardStats());
  const [showFallback, setShowFallback] = useState(false);
  const [checkingSetup, setCheckingSetup] = useState(true);
  const router = useRouter();
  
  // Add state for payment dialog
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  
  // Add state for quick action panel
  const [quickActionExpanded, setQuickActionExpanded] = useState(false);

  // Function to handle paying an expense
  const handlePayExpense = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsPaymentDialogOpen(true);
  };

  // Check if the user has completed setup
  useEffect(() => {
    const checkUserSetup = async () => {
      // Wait for auth to load
      if (authLoading) return;
      
      // If user is not logged in, don't do anything
      // The app will handle this separately
      if (!user) {
        console.log('Dashboard: No authenticated user');
        setCheckingSetup(false);
        return;
      }
      
      try {
        console.log('Dashboard: Checking if user has completed setup');
        
        // First check local storage/cookies
        if (hasCompletedSetup()) {
          console.log('Dashboard: User has completed setup (from localStorage/cookies)');
          setCheckingSetup(false);
          return;
        }
        
        console.log('Dashboard: Setup completion not found in localStorage/cookies, checking Firestore');
        
        // Check if user has their own wedding data
        const weddingDoc = await getDoc(doc(firestore, 'weddings', user.uid));
        
        if (weddingDoc.exists()) {
          console.log('Dashboard: User has wedding data in Firestore, marking setup as complete');
          // User has setup data, mark it as completed
          setHasCompletedSetup(user.uid);
          setCheckingSetup(false);
          return;
        }
        
        // Check if user is a member of any weddings
        const membershipQuery = query(
          collection(firestore, 'workspaceUsers'),
          where('userId', '==', user.uid)
        );
        
        const membershipsSnapshot = await getDocs(membershipQuery);
        
        if (!membershipsSnapshot.empty) {
          console.log('Dashboard: User is a member of at least one wedding, marking setup as complete');
          // The user has at least one membership, they don't need setup
          // Get the first workspace ID to use
          const workspaceId = membershipsSnapshot.docs[0].data().workspaceId;
          setHasCompletedSetup(workspaceId || 'member');
          
          // Also set the currentWorkspaceId cookie to ensure middleware recognizes the user has a workspace
          const expiryDate = new Date();
          expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 year from now
          document.cookie = `currentWorkspaceId=${workspaceId || 'member'}; path=/; expires=${expiryDate.toUTCString()}; SameSite=Lax`;
          
          setCheckingSetup(false);
          return;
        }
        
        // User hasn't completed setup
        console.log('Dashboard: User has not completed setup, redirecting to wizard');
        router.push('/setup-wizard');
      } catch (error) {
        console.error('Dashboard: Error checking setup status:', error);
        setCheckingSetup(false);
      }
    };
    
    checkUserSetup();
  }, [user, authLoading, router]);

  useEffect(() => {
    setStats(getDashboardStats());
    
    // If still loading after 5 seconds, show fallback UI
    const timeout = setTimeout(() => {
      if (isLoading) {
        setShowFallback(true);
      }
    }, 5000);
    
    return () => clearTimeout(timeout);
  }, [getDashboardStats, isLoading]);

  // Show loading while checking setup or loading wedding data
  if ((isLoading && !showFallback) || checkingSetup) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <div className="text-center">
          <h1 className="text-3xl font-serif font-bold mb-6 text-blue-800">Loading your wedding finances...</h1>
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-800 mx-auto" />
        </div>
      </div>
    );
  }
  
  // Fallback UI if loading takes too long
  if (showFallback) {
    return (
      <div className="container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
        <div className="max-w-5xl mx-auto">
          <div className="bg-white/90 border border-blue-200 rounded-lg shadow-lg p-8 mb-10">
            <div className="flex items-center space-x-4 mb-6">
              <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg className="h-6 w-6 text-blue-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-labelledby="warning-icon-title">
                  <title id="warning-icon-title">Warning</title>
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-serif font-bold text-blue-800">Demo Mode Activated</h2>
                <p className="text-blue-700">You're currently viewing sample data</p>
              </div>
            </div>
            <p className="mb-6 text-blue-700 text-lg">We're having trouble connecting to your database. In the meantime, you can explore the app using demo data.</p>
            <Button onClick={() => window.location.reload()} className="bg-blue-700 hover:bg-blue-800 text-white">
              Retry Connection
            </Button>
          </div>
        
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
              <div className="p-6 border-t-4 border-t-blue-800">
                <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Total Budget</h3>
                <p className="text-4xl font-serif font-bold text-blue-800">{formatCurrency(10500)}</p>
                <p className="text-sm text-blue-600 mt-2">Sample wedding budget</p>
              </div>
            </div>

            <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
              <div className="p-6 border-t-4 border-t-blue-600">
                <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Total Contributions</h3>
                <p className="text-4xl font-serif font-bold text-blue-800">{formatCurrency(5000)}</p>
                <p className="text-sm text-blue-600 mt-2">Sample gifts received</p>
              </div>
            </div>

            <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
              <div className="p-6 border-t-4 border-t-green-600">
                <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Paid So Far</h3>
                <p className="text-4xl font-serif font-bold text-green-700">{formatCurrency(3500)}</p>
                <p className="text-sm text-blue-600 mt-2">34% of total budget</p>
              </div>
            </div>

            <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
              <div className="p-6 border-t-4 border-t-amber-500">
                <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Remaining Balance</h3>
                <p className="text-4xl font-serif font-bold text-amber-600">{formatCurrency(7000)}</p>
                <p className="text-sm text-blue-600 mt-2">Due within 3 months</p>
              </div>
            </div>
          </div>
          
          {/* Financial Progress Bars in fallback UI */}
          <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200 mb-8">
            <h3 className="text-xl font-serif font-bold text-blue-800 mb-4">Financial Progress</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left column - Summary metrics */}
              <div>
                {/* Budget Progress */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-700">Budget Paid Progress</span>
                    <span className="text-sm font-medium text-blue-700">33%</span>
                  </div>
                  <div className="flex items-center text-xs text-blue-600 mb-1.5">
                    <span>$3,500 paid of $10,500 total budget</span>
                  </div>
                  <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-green-500 rounded-full" style={{ width: '33%' }} />
                  </div>
                </div>
                
                {/* Contribution Usage */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-blue-700">Contribution Usage</span>
                    <span className="text-sm font-medium text-blue-700">70%</span>
                  </div>
                  <div className="flex items-center text-xs text-blue-600 mb-1.5">
                    <span>$3,500 spent of $5,000 contributions</span>
                  </div>
                  <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: '70%' }} />
                  </div>
                </div>
                
                {/* Funds Summary */}
                <div>
                  <h4 className="text-sm font-medium text-blue-700 mb-3">Funds Summary</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="font-medium text-blue-800 mb-1">Available Funds</div>
                      <div className="font-bold text-blue-900">$1,500</div>
                      <div className="text-xs text-blue-600 mt-1">Unused contributions</div>
                    </div>
                    <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                      <div className="font-medium text-amber-800 mb-1">Remaining Budget</div>
                      <div className="font-bold text-amber-900">$7,000</div>
                      <div className="text-xs text-amber-600 mt-1">Still needs funding</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right column - Category breakdown */}
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                  <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <title>Categories Icon</title>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                  </svg>
                  Expense Categories
                </h4>
                
                {/* Show total first */}
                <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-blue-800">Total Budget</span>
                    <span className="font-bold text-blue-800">$10,500</span>
                  </div>
                </div>
                
                {/* Then show categories */}
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  <div className="p-2 rounded border border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">Venue</span>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 mr-1">48%</span>
                        <span className="text-xs font-medium text-gray-800">$5,000</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-purple-500 rounded-full" style={{ width: '48%' }} />
                    </div>
                  </div>
                  <div className="p-2 rounded border border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">Catering</span>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 mr-1">24%</span>
                        <span className="text-xs font-medium text-gray-800">$2,500</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-500 rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>
                  <div className="p-2 rounded border border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">Photography</span>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 mr-1">14%</span>
                        <span className="text-xs font-medium text-gray-800">$1,500</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-pink-500 rounded-full" style={{ width: '14%' }} />
                    </div>
                  </div>
                  <div className="p-2 rounded border border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">Decorations</span>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 mr-1">10%</span>
                        <span className="text-xs font-medium text-gray-800">$1,000</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '10%' }} />
                    </div>
                  </div>
                  <div className="p-2 rounded border border-gray-100 bg-white">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium text-gray-800">Attire</span>
                      <div className="flex items-center">
                        <span className="text-xs font-medium text-gray-600 mr-1">5%</span>
                        <span className="text-xs font-medium text-gray-800">$500</span>
                      </div>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '5%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Upcoming Payments in fallback UI */}
          <div className="bg-white shadow rounded-xl overflow-hidden border border-blue-100 mb-12">
            <div className="p-4 border-b border-blue-200 flex justify-between items-center bg-gradient-to-r from-blue-50 to-white">
              <h3 className="text-lg font-serif font-bold text-blue-800 flex items-center">
                <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <title>Calendar Icon</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Upcoming Payments
              </h3>
              <Link href="/expenses" className="text-sm font-medium text-blue-700 hover:text-blue-900 transition-colors flex items-center">
                View All
                <svg className="h-4 w-4 ml-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <title>Arrow Right Icon</title>
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="divide-y divide-gray-100">
              {/* Fallback UI with placeholder loading items */}
              <div className="p-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-blue-100 rounded w-3/4 mb-2" />
                  <div className="flex items-center mt-1">
                    <div className="h-3 bg-blue-100 rounded w-1/4 mr-2" />
                    <div className="h-3 bg-blue-100 rounded w-1/3" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-blue-100 rounded w-2/3 mb-2" />
                  <div className="flex items-center mt-1">
                    <div className="h-3 bg-blue-100 rounded w-1/5 mr-2" />
                    <div className="h-3 bg-blue-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
              <div className="p-3">
                <div className="animate-pulse">
                  <div className="h-4 bg-blue-100 rounded w-1/2 mb-2" />
                  <div className="flex items-center mt-1">
                    <div className="h-3 bg-blue-100 rounded w-1/6 mr-2" />
                    <div className="h-3 bg-blue-100 rounded w-1/4" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200">
              <h3 className="text-xl font-serif font-bold mb-6 pb-2 border-b border-blue-200 flex items-center">
                <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="quick-actions-title">
                    <title id="quick-actions-title">Quick Actions</title>
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </span>
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/expenses" className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md group">
                  <svg className="h-6 w-6 text-blue-700 mb-3 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="expenses-icon-title">
                    <title id="expenses-icon-title">Expenses</title>
                    <path d="M12 2a10 10 0 1 0 10 10H12V2z" />
                    <path d="M20 12a8 8 0 1 0-16 0" />
                    <path d="M12 12H2" />
                  </svg>
                  <span className="font-medium text-blue-800 group-hover:text-blue-900">View Expenses</span>
                </Link>
                <Link href="/contributors" className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md group">
                  <svg className="h-6 w-6 text-blue-700 mb-3 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="contributors-icon-title">
                    <title id="contributors-icon-title">Contributors</title>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                  <span className="font-medium text-blue-800 group-hover:text-blue-900">View Contributors</span>
                </Link>
                <Link href="/gifts" className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md group">
                  <svg className="h-6 w-6 text-blue-700 mb-3 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="gifts-icon-title">
                    <title id="gifts-icon-title">Gifts</title>
                    <path d="M20 12v10H4V12" />
                    <path d="M2 7h20v5H2z" />
                    <path d="M12 22V7" />
                    <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                    <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                  </svg>
                  <span className="font-medium text-blue-800 group-hover:text-blue-900">View Gifts</span>
                </Link>
                <button 
                  className="flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 hover:border-blue-300 transition-all duration-300 hover:shadow-md group"
                  type="button"
                  onClick={() => window.location.reload()}
                >
                  <svg className="h-6 w-6 text-blue-700 mb-3 group-hover:scale-110 transition-transform duration-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="reload-icon-title">
                    <title id="reload-icon-title">Reload</title>
                    <path d="M23 4v6h-6" />
                    <path d="M1 20v-6h6" />
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                  </svg>
                  <span className="font-medium text-blue-800 group-hover:text-blue-900">Retry Connection</span>
                </button>
              </div>
            </div>
            
            <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200">
              <h3 className="text-xl font-serif font-bold mb-6 pb-2 border-b border-blue-200 flex items-center">
                <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                  <svg className="h-4 w-4 text-blue-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-labelledby="demo-data-title">
                    <title id="demo-data-title">Demo Data</title>
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                    <line x1="16" y1="2" x2="16" y2="6" />
                    <line x1="8" y1="2" x2="8" y2="6" />
                    <line x1="3" y1="10" x2="21" y2="10" />
                  </svg>
                </span>
                Demo Data
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-800">Sample Expenses</span>
                  <span className="font-mono text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200 text-blue-800">{3}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-800">Sample Contributors</span>
                  <span className="font-mono text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200 text-blue-800">{3}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg border border-blue-200">
                  <span className="font-medium text-blue-800">Sample Gifts</span>
                  <span className="font-mono text-sm bg-white px-3 py-1 rounded-full shadow-sm border border-blue-200 text-blue-800">{2}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 sm:px-6 py-8 max-w-7xl mx-auto">
      <QuickActionPanel exportData={exportData} />
      
      <div className="max-w-6xl mx-auto">
        {user && (
          <div className="mb-8">
            <WeddingDetails />
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
            <div className="p-6 border-t-4 border-t-blue-800">
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Total Budget</h3>
              <p className="text-4xl font-serif font-bold text-blue-800">{formatCurrency(stats.totalExpenses)}</p>
              <p className="text-sm text-blue-600 mt-2">Wedding budget</p>
            </div>
          </div>
          
          <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
            <div className="p-6 border-t-4 border-t-blue-600">
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Total Contributions</h3>
              <p className="text-4xl font-serif font-bold text-blue-800">
                {formatCurrency(contributors.reduce((sum, contributor) => sum + (contributor.totalGiftAmount || 0), 0))}
              </p>
              <p className="text-sm text-blue-600 mt-2">All gifts received</p>
            </div>
          </div>
          
          <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
            <div className="p-6 border-t-4 border-t-green-600">
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Paid So Far</h3>
              <p className="text-4xl font-serif font-bold text-green-700">{formatCurrency(stats.totalPaid)}</p>
              <p className="text-sm text-blue-600 mt-2">{stats.totalExpenses > 0 ? `${Math.round((stats.totalPaid / stats.totalExpenses) * 100)}% of total` : '0% of total'}</p>
            </div>
          </div>
          
          <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 transition-all duration-300">
            <div className="p-6 border-t-4 border-t-amber-500">
              <h3 className="text-sm font-medium text-blue-700 uppercase tracking-wider mb-1">Remaining Balance</h3>
              <p className="text-4xl font-serif font-bold text-amber-600">{formatCurrency(stats.totalRemaining)}</p>
              <p className="text-sm text-blue-600 mt-2">Outstanding balance</p>
            </div>
          </div>
        </div>
        
        {/* Budget Deficit/Surplus Card */}
        <div className="card card-hover bg-white/90 rounded-xl shadow-md overflow-hidden border border-blue-200 mb-8">
          <div className="p-6">
            {/* Calculate budget deficit (how much more contributions are needed to meet the budget) */}
            {(() => {
              const totalContributions = contributors.reduce(
                (sum, contributor) => sum + (contributor.totalGiftAmount || 0), 
                0
              );
              const budgetDeficit = stats.totalExpenses - totalContributions;
              const isDeficit = budgetDeficit > 0;
              
              return (
                <>
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-full ${isDeficit ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>
                      <TrendingDown size={24} />
                    </div>
                    <h3 className="text-lg font-medium text-blue-800">
                      {isDeficit ? 'Budget Deficit' : 'Budget Surplus'}
                    </h3>
                  </div>
                  
                  <p className={`text-3xl font-serif font-bold ${isDeficit ? 'text-red-600' : 'text-green-600'} mb-2`}>
                    {formatCurrency(Math.abs(budgetDeficit))}
                  </p>
                  
                  <p className="text-sm text-blue-600">
                    {isDeficit 
                      ? 'Additional contributions needed to meet budget' 
                      : 'Contributions exceed budget!'}
                  </p>
                </>
              );
            })()}
          </div>
        </div>
        
        {/* Financial Progress Bars - Simplified and Improved */}
        <div className="card bg-white/90 rounded-xl shadow-md p-6 border border-blue-200 mb-8">
          <h3 className="text-xl font-serif font-bold text-blue-800 mb-4">Financial Progress</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column - Summary metrics */}
            <div>
              {/* Budget Progress */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-700">Budget Paid Progress</span>
                  <span className="text-sm font-medium text-blue-700">
                    {stats.totalExpenses > 0 ? `${Math.round((stats.totalPaid / stats.totalExpenses) * 100)}%` : '0%'}
                  </span>
                </div>
                <div className="flex items-center text-xs text-blue-600 mb-1.5">
                  <span>{formatCurrency(stats.totalPaid)} paid of {formatCurrency(stats.totalExpenses)} total budget</span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ 
                      width: stats.totalExpenses > 0 
                        ? `${(stats.totalPaid / stats.totalExpenses) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
              
              {/* Contribution Usage */}
              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-blue-700">Contribution Usage</span>
                  <span className="text-sm font-medium text-blue-700">
                    {
                      (() => {
                        const totalContributions = contributors.reduce((sum, contributor) => sum + (contributor.totalGiftAmount || 0), 0);
                        return totalContributions > 0 
                          ? `${Math.round((stats.totalPaid / totalContributions) * 100)}%` 
                          : '0%';
                      })()
                    }
                  </span>
                </div>
                <div className="flex items-center text-xs text-blue-600 mb-1.5">
                  <span>{formatCurrency(stats.totalPaid)} spent of {formatCurrency(contributors.reduce((sum, contributor) => sum + (contributor.totalGiftAmount || 0), 0))} contributions</span>
                </div>
                <div className="w-full h-3 bg-blue-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full"
                    style={{ 
                      width: (() => {
                        const totalContributions = contributors.reduce((sum, contributor) => sum + (contributor.totalGiftAmount || 0), 0);
                        return totalContributions > 0 
                          ? `${Math.min(100, (stats.totalPaid / totalContributions) * 100)}%` 
                          : '0%';
                      })()
                    }}
                  />
                </div>
              </div>
              
              {/* Funds Summary */}
              <div>
                <h4 className="text-sm font-medium text-blue-700 mb-3">Funds Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="font-medium text-blue-800 mb-1">Available Funds</div>
                    <div className="font-bold text-blue-900">
                      {formatCurrency(
                        Math.max(0, contributors.reduce((sum, contributor) => sum + (contributor.totalGiftAmount || 0), 0) - stats.totalPaid)
                      )}
                    </div>
                    <div className="text-xs text-blue-600 mt-1">Unused contributions</div>
                  </div>
                  <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="font-medium text-amber-800 mb-1">Remaining Budget</div>
                    <div className="font-bold text-amber-900">
                      {formatCurrency(stats.totalRemaining)}
                    </div>
                    <div className="text-xs text-amber-600 mt-1">Still needs funding</div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Right column - Category breakdown */}
            <div>
              <h4 className="text-sm font-medium text-blue-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-1 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <title>Categories Icon</title>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
                </svg>
                Expense Categories
              </h4>
              
              {/* Show total first */}
              <div className="mb-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-blue-800">Total Budget</span>
                  <span className="font-bold text-blue-800">{formatCurrency(stats.totalExpenses)}</span>
                </div>
              </div>
              
              {/* Then show categories */}
              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {Object.entries(stats.expensesByCategory)
                  .sort(([, a], [, b]) => b - a) // Sort by amount descending
                  .map(([category, amount]) => {
                    const percentage = stats.totalExpenses > 0 
                      ? Math.round((amount / stats.totalExpenses) * 100) 
                      : 0;
                    // Generate a color based on the category
                    const colors = {
                      'Venue': 'bg-purple-500',
                      'Catering': 'bg-yellow-500',
                      'Photography': 'bg-pink-500',
                      'Attire': 'bg-blue-500',
                      'Flowers': 'bg-green-500',
                      'Music': 'bg-red-500',
                      'Decorations': 'bg-indigo-500',
                      'Transportation': 'bg-orange-500',
                      'Accommodation': 'bg-teal-500'
                    };
                    const defaultColor = 'bg-gray-500';
                    const color = colors[category as keyof typeof colors] || defaultColor;
                    
                    return (
                      <div key={category} className="p-2 rounded border border-gray-100 bg-white">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium text-gray-800">
                            {category}
                          </span>
                          <div className="flex items-center">
                            <span className="text-xs font-medium text-gray-600 mr-1">{percentage}%</span>
                            <span className="text-xs font-medium text-gray-800">{formatCurrency(amount)}</span>
                          </div>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div 
                            className={`h-full ${color} rounded-full`}
                            style={{ width: `${percentage}%` }} 
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>
        
        {/* Upcoming Payments */}
        <div className="mb-12">
          <UpcomingPayments onPayExpense={handlePayExpense} />
        </div>
        
        {/* Workspace Membership (new component) */}
        {user && (
          <div className="mb-12">
            <WorkspaceMembership />
          </div>
        )}
      </div>
      
      {/* Payment Dialog */}
      {selectedExpense && (
        <PaymentDialog
          isOpen={isPaymentDialogOpen}
          onClose={() => {
            setIsPaymentDialogOpen(false);
            setSelectedExpense(null);
          }}
          expense={selectedExpense}
        />
      )}
    </div>
  );
}
