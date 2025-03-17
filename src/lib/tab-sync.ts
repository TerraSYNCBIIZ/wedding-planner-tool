'use client';

/**
 * TabSync - A utility for synchronizing state across browser tabs
 * Helps with collaborative workspaces by ensuring consistent state
 */

// Types for tab synchronization
export interface TabSyncOptions {
  // The key to use for storage (should be unique per feature)
  key: string;
  // Optional callback when data changes in another tab
  onChange?: (data: unknown) => void;
  // Optional callback when a tab becomes active
  onTabActive?: () => void;
  // Optional callback when a tab becomes inactive
  onTabInactive?: () => void;
  // Optional debounce time in ms for change events
  debounceTime?: number;
  // Whether to log debug information
  debug?: boolean;
}

type TabSyncData = {
  tabId: string;
  timestamp: number;
  value: unknown;
};

type TabStatus = {
  lastActive: number;
  isActive: boolean;
};

export class TabSync {
  private key: string;
  private onChange?: (data: unknown) => void;
  private onTabActive?: () => void;
  private onTabInactive?: () => void;
  private debounceTime: number;
  private debug: boolean;
  private tabId: string;
  private lastUpdate = 0;
  private debounceTimer: NodeJS.Timeout | null = null;
  private isActive = true;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private isProd = process.env.NODE_ENV === 'production';
  
  constructor(options: TabSyncOptions) {
    this.key = options.key;
    this.onChange = options.onChange;
    this.onTabActive = options.onTabActive;
    this.onTabInactive = options.onTabInactive;
    this.debounceTime = options.debounceTime || 100;
    this.debug = options.debug || false;
    
    // Generate a unique ID for this tab
    this.tabId = `tab_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    
    if (typeof window !== 'undefined') {
      // Listen for storage events from other tabs
      window.addEventListener('storage', this.handleStorageChange);
      
      // Listen for visibility changes
      document.addEventListener('visibilitychange', this.handleVisibilityChange);
      
      // Register this tab
      this.registerTab();
      
      // Set up periodic heartbeat to detect active tabs
      this.startHeartbeat();
      
      // Log initialization
      this.logDebug(`Initialized with key: ${this.key}, tabId: ${this.tabId}`);
    }
  }
  
  /**
   * Conditionally log debug info
   */
  private logDebug(message: string, ...data: unknown[]): void {
    if (this.debug && !this.isProd) {
      console.debug(`[TabSync ${this.key}]`, message, ...data);
    }
  }
  
  /**
   * Log errors regardless of debug setting
   */
  private logError(message: string, error: unknown): void {
    console.error(`[TabSync ${this.key}] ${message}`, error);
  }
  
  /**
   * Register this tab as active
   */
  private registerTab(): void {
    try {
      const tabKey = `${this.key}_tabs`;
      const now = Date.now();
      
      // Get existing tabs
      const tabsJson = localStorage.getItem(tabKey) || '{}';
      const tabs = JSON.parse(tabsJson) as Record<string, TabStatus>;
      
      // Add/update this tab
      tabs[this.tabId] = {
        lastActive: now,
        isActive: document.visibilityState === 'visible'
      };
      
      // Clean up old tabs (inactive for more than 1 minute)
      for (const id of Object.keys(tabs)) {
        if (now - tabs[id].lastActive > 60000) {
          delete tabs[id];
        }
      }
      
      // Save updated tabs
      localStorage.setItem(tabKey, JSON.stringify(tabs));
      
      this.logDebug(`Registered tab: ${this.tabId}, active tabs: ${Object.keys(tabs).length}`);
    } catch (error) {
      this.logError('Error registering tab:', error);
    }
  }
  
  /**
   * Start heartbeat to keep tab registration active
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      this.registerTab();
    }, 30000); // Every 30 seconds
  }
  
  /**
   * Handle visibility change events
   */
  private handleVisibilityChange = (): void => {
    const isVisible = document.visibilityState === 'visible';
    
    if (isVisible && !this.isActive) {
      // Tab became active
      this.isActive = true;
      this.registerTab();
      
      if (this.onTabActive) {
        this.onTabActive();
      }
      
      this.logDebug(`Tab ${this.tabId} became active`);
    } else if (!isVisible && this.isActive) {
      // Tab became inactive
      this.isActive = false;
      this.registerTab();
      
      if (this.onTabInactive) {
        this.onTabInactive();
      }
      
      this.logDebug(`Tab ${this.tabId} became inactive`);
    }
  };
  
  /**
   * Handle storage events from other tabs
   */
  private handleStorageChange = (event: StorageEvent): void => {
    // Only process events for our key
    if (event.key !== this.key) return;
    
    // Skip if null (item was removed)
    if (event.newValue === null) return;
    
    try {
      const data = JSON.parse(event.newValue) as TabSyncData;
      
      // Skip if this is our own update
      if (data.tabId === this.tabId) return;
      
      // Skip if the update is too old (older than our last update)
      if (data.timestamp < this.lastUpdate) return;
      
      this.logDebug(`Received update from tab ${data.tabId}:`, data.value);
      
      // Debounce the change callback
      if (this.onChange) {
        if (this.debounceTimer) {
          clearTimeout(this.debounceTimer);
        }
        
        this.debounceTimer = setTimeout(() => {
          if (this.onChange) {
            this.onChange(data.value);
          }
        }, this.debounceTime);
      }
    } catch (error) {
      this.logError('Error processing storage event:', error);
    }
  };
  
  /**
   * Update the shared state
   */
  public update(value: unknown): void {
    try {
      const now = Date.now();
      this.lastUpdate = now;
      
      const data: TabSyncData = {
        tabId: this.tabId,
        timestamp: now,
        value
      };
      
      localStorage.setItem(this.key, JSON.stringify(data));
      
      this.logDebug(`Updated state for key ${this.key}:`, value);
    } catch (error) {
      this.logError('Error updating state:', error);
    }
  }
  
  /**
   * Get the current shared state
   */
  public getState(): unknown {
    try {
      const json = localStorage.getItem(this.key);
      if (!json) return null;
      
      const data = JSON.parse(json) as TabSyncData;
      return data.value;
    } catch (error) {
      this.logError('Error getting state:', error);
      return null;
    }
  }
  
  /**
   * Get all active tabs
   */
  public getActiveTabs(): string[] {
    try {
      const tabKey = `${this.key}_tabs`;
      const tabsJson = localStorage.getItem(tabKey) || '{}';
      const tabs = JSON.parse(tabsJson) as Record<string, TabStatus>;
      
      // Filter to only active tabs
      return Object.keys(tabs).filter(id => tabs[id].isActive);
    } catch (error) {
      this.logError('Error getting active tabs:', error);
      return [];
    }
  }
  
  /**
   * Check if this is the only active tab
   */
  public isOnlyActiveTab(): boolean {
    const activeTabs = this.getActiveTabs();
    return activeTabs.length === 1 && activeTabs[0] === this.tabId;
  }
  
  /**
   * Clean up resources
   */
  public destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', this.handleStorageChange);
      document.removeEventListener('visibilitychange', this.handleVisibilityChange);
      
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = null;
      }
      
      if (this.heartbeatInterval) {
        clearInterval(this.heartbeatInterval);
        this.heartbeatInterval = null;
      }
      
      // Remove this tab from active tabs
      try {
        const tabKey = `${this.key}_tabs`;
        const tabsJson = localStorage.getItem(tabKey) || '{}';
        const tabs = JSON.parse(tabsJson) as Record<string, TabStatus>;
        
        delete tabs[this.tabId];
        localStorage.setItem(tabKey, JSON.stringify(tabs));
      } catch (error) {
        this.logError('Error removing tab:', error);
      }
      
      this.logDebug(`Destroyed instance for key: ${this.key}, tabId: ${this.tabId}`);
    }
  }
} 