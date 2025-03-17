'use client';

import { useState, useEffect } from 'react';
import { useWorkspace } from '@/context/WorkspaceContext';
import { cn } from '@/lib/utils';

interface TabProps {
  id: string;
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}

interface TabNavigationProps {
  tabs: {
    id: string;
    label: string;
    disabled?: boolean;
  }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  storageKey?: string;
  className?: string;
  variant?: 'default' | 'underline' | 'pill';
}

const Tab = ({ id, label, isActive, onClick, disabled = false }: TabProps) => {
  return (
    <button
      type="button"
      id={`tab-${id}`}
      role="tab"
      aria-selected={isActive}
      aria-controls={`tabpanel-${id}`}
      disabled={disabled}
      className={cn(
        "py-2 px-4 font-medium text-sm transition-colors relative",
        disabled && "opacity-50 cursor-not-allowed",
        isActive 
          ? "text-primary" 
          : "text-muted-foreground hover:text-foreground"
      )}
      onClick={() => !disabled && onClick()}
    >
      {label}
    </button>
  );
};

export function TabNavigation({
  tabs,
  activeTab,
  onChange,
  storageKey,
  className,
  variant = 'underline'
}: TabNavigationProps) {
  const { registerTabActivity, currentWorkspaceId } = useWorkspace();
  const [mounted, setMounted] = useState(false);
  
  // Initialize from storage if available
  useEffect(() => {
    setMounted(true);
    
    // Try to get saved tab from storage
    if (storageKey && typeof window !== 'undefined') {
      const savedTab = localStorage.getItem(storageKey);
      if (savedTab && tabs.some(tab => tab.id === savedTab)) {
        onChange(savedTab);
      }
    }
  }, [onChange, storageKey, tabs]);
  
  // Save to storage when tab changes
  useEffect(() => {
    if (!mounted) return;
    
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, activeTab);
      
      // Register tab activity to notify other users of tab change
      if (currentWorkspaceId) {
        registerTabActivity();
      }
    }
  }, [activeTab, storageKey, mounted, registerTabActivity, currentWorkspaceId]);
  
  // Handle tab change with animation frame to prevent jank
  const handleTabChange = (tabId: string) => {
    // Use requestAnimationFrame to ensure smooth tab transitions
    requestAnimationFrame(() => {
      onChange(tabId);
      
      // Focus the tab panel for accessibility
      const tabPanel = document.getElementById(`tabpanel-${tabId}`);
      if (tabPanel) {
        tabPanel.focus();
      }
      
      // Register this activity
      if (currentWorkspaceId) {
        registerTabActivity();
      }
    });
  };
  
  const variantStyles = {
    default: "space-x-2",
    underline: "border-b border-border",
    pill: "bg-muted p-1 rounded-md space-x-1"
  };
  
  return (
    <div 
      className={cn("flex", variantStyles[variant], className)}
      role="tablist"
      aria-orientation="horizontal"
    >
      {tabs.map((tab) => (
        <div 
          key={tab.id}
          className={cn(
            variant === 'underline' && activeTab === tab.id && "relative",
            variant === 'pill' && activeTab === tab.id && "bg-background shadow rounded-md"
          )}
        >
          <Tab
            id={tab.id}
            label={tab.label}
            isActive={activeTab === tab.id}
            onClick={() => handleTabChange(tab.id)}
            disabled={tab.disabled}
          />
          {variant === 'underline' && activeTab === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
          )}
        </div>
      ))}
    </div>
  );
} 