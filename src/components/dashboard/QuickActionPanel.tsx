'use client';

import Link from 'next/link';
import { useState } from 'react';

interface QuickActionPanelProps {
  exportData: () => void;
}

export const QuickActionPanel: React.FC<QuickActionPanelProps> = ({ exportData }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <div className="hidden md:block">
      <div className="fixed right-3 sm:right-6 top-1/4 z-10">
        <div className={`bg-white shadow-lg rounded-lg border border-blue-200 overflow-hidden transition-all duration-300 ${isCollapsed ? "w-14" : "w-14 sm:w-64"}`}>
          <div className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-700 to-blue-600 text-white">
            <span className={`font-medium ${isCollapsed ? "hidden" : "hidden sm:inline"}`}>Quick Actions</span>
            <button 
              type="button"
              onClick={toggleCollapse} 
              className="p-1 hover:bg-blue-800 rounded-full transition-colors"
              aria-label={isCollapsed ? "Expand quick actions" : "Collapse quick actions"}
            >
              <svg 
                className="h-5 w-5 text-white" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2"
              >
                <title>{isCollapsed ? "Expand Panel" : "Collapse Panel"}</title>
                {isCollapsed ? (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" d="M11 19l-7-7 7-7M19 19l-7-7 7-7" />
                )}
              </svg>
            </button>
          </div>
          
          <div>
            <Link href="/expenses/new" className="flex items-center p-3 text-blue-800 hover:bg-blue-50 border-b border-blue-100 transition-colors">
              <svg className="h-5 w-5 text-blue-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <title>Add Expense</title>
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="16" />
                <line x1="8" y1="12" x2="16" y2="12" />
              </svg>
              <span className={`text-sm font-medium ml-3 ${isCollapsed ? "hidden" : "hidden sm:inline"}`}>Add Expense</span>
            </Link>
            
            <Link href="/gifts/new" className="flex items-center p-3 text-blue-800 hover:bg-blue-50 border-b border-blue-100 transition-colors">
              <svg className="h-5 w-5 text-blue-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <title>Record Gift</title>
                <path d="M20 12v10H4V12" />
                <path d="M2 7h20v5H2z" />
                <path d="M12 22V7" />
                <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
              </svg>
              <span className={`text-sm font-medium ml-3 ${isCollapsed ? "hidden" : "hidden sm:inline"}`}>Record Gift</span>
            </Link>
            
            <Link href="/contributors/new" className="flex items-center p-3 text-blue-800 hover:bg-blue-50 border-b border-blue-100 transition-colors">
              <svg className="h-5 w-5 text-blue-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <title>Add Contributor</title>
                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
              <span className={`text-sm font-medium ml-3 ${isCollapsed ? "hidden" : "hidden sm:inline"}`}>Add Contributor</span>
            </Link>
            
            <button 
              type="button"
              onClick={exportData} 
              className="w-full flex items-center p-3 text-blue-800 hover:bg-blue-50 border-b border-blue-100 transition-colors"
            >
              <svg className="h-5 w-5 text-blue-700 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <title>Export Data</title>
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              <span className={`text-sm font-medium ml-3 ${isCollapsed ? "hidden" : "hidden sm:inline"}`}>Export Data</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}; 