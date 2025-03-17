'use client';

/**
 * ConnectionMonitor - Helps monitor and manage Firebase WebSocket connections
 * to improve reliability in collaborative multi-user environments
 */
export class ConnectionMonitor {
  private isOnline = true;
  private listeners: Map<string, (isOnline: boolean) => void> = new Map();
  private pingInterval: NodeJS.Timeout | null = null;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private instanceId: string;
  private logLevel: 'none' | 'error' | 'warn' | 'info' | 'debug';
  private isProd = process.env.NODE_ENV === 'production';
  private _lastStatusChangeTime: number | null = null;

  constructor(options?: {
    pingIntervalMs?: number;
    maxReconnectAttempts?: number;
    logLevel?: 'none' | 'error' | 'warn' | 'info' | 'debug';
  }) {
    this.instanceId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.maxReconnectAttempts = options?.maxReconnectAttempts || 5;
    this.logLevel = options?.logLevel || (this.isProd ? 'error' : 'info');
    
    // Set up event listeners if in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('online', this.handleOnline);
      window.addEventListener('offline', this.handleOffline);
      
      // Set up ping interval to check connection status
      if (options?.pingIntervalMs) {
        this.startPingInterval(options.pingIntervalMs);
      }
      
      // Check initial status
      this.isOnline = navigator.onLine;
      this.log('info', `Initial connection status: ${this.isOnline ? 'online' : 'offline'}`);
    }
  }

  /**
   * Conditionally log based on log level
   */
  private log(level: 'error' | 'warn' | 'info' | 'debug', message: string, ...data: unknown[]): void {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3,
      none: -1
    };
    
    if (levels[this.logLevel] >= levels[level]) {
      const prefix = `[ConnectionMonitor ${this.instanceId}]`;
      
      switch (level) {
        case 'error':
          console.error(prefix, message, ...data);
          break;
        case 'warn':
          console.warn(prefix, message, ...data);
          break;
        case 'info':
          console.log(prefix, message, ...data);
          break;
        case 'debug':
          if (!this.isProd) {
            console.debug(prefix, message, ...data);
          }
          break;
      }
    }
  }

  /**
   * Start the ping interval to actively check connection
   */
  private startPingInterval(intervalMs = 30000): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    this.pingInterval = setInterval(() => {
      this.pingServer();
    }, intervalMs);
  }

  /**
   * Ping a server to check connectivity
   */
  private pingServer(): void {
    // Use a tiny image to ping the server
    const img = new Image();
    const pingTimestamp = Date.now();
    
    img.onload = () => {
      const pingTime = Date.now() - pingTimestamp;
      this.log('debug', `Ping successful (${pingTime}ms)`);
      
      if (!this.isOnline) {
        this.log('info', 'Connection restored');
        this.setOnlineStatus(true);
      }
    };
    
    img.onerror = () => {
      this.log('warn', 'Ping failed');
      
      if (this.isOnline) {
        this.log('warn', 'Connection appears to be down');
        this.setOnlineStatus(false);
      }
    };
    
    // Use a random query param to prevent caching
    img.src = `https://www.google.com/favicon.ico?_=${Date.now()}`;
  }

  /**
   * Handle browser online event
   */
  private handleOnline = (): void => {
    this.log('info', 'Browser reports online');
    this.setOnlineStatus(true);
  };

  /**
   * Handle browser offline event
   */
  private handleOffline = (): void => {
    this.log('info', 'Browser reports offline');
    this.setOnlineStatus(false);
  };

  /**
   * Update the online status and notify listeners
   */
  private setOnlineStatus(isOnline: boolean): void {
    const statusChanged = this.isOnline !== isOnline;
    
    // Only proceed if status actually changed or it's returning to online state the first time
    // (not repeatedly when already online)
    if (statusChanged) {
      this.isOnline = isOnline;
      
      // Store last status change time to prevent excessive notifications
      const now = Date.now();
      const lastStatusChange = this._lastStatusChangeTime || 0;
      this._lastStatusChangeTime = now;
      
      // Prevent duplicate online notifications within 10 seconds
      if (!isOnline || (isOnline && (now - lastStatusChange > 10000))) {
        // Notify all listeners of the status change
        for (const [id, callback] of this.listeners.entries()) {
          try {
            callback(isOnline);
          } catch (error) {
            this.log('error', `Error in listener ${id}:`, error);
          }
        }
      }
      
      // Reset reconnect attempts if we're back online
      if (isOnline) {
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      }
    }
  }

  /**
   * Add a listener for connection status changes
   */
  addListener(callback: (isOnline: boolean) => void): string {
    const id = `listener_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    this.listeners.set(id, callback);
    
    // Immediately notify the listener of current status
    try {
      callback(this.isOnline);
    } catch (error) {
      this.log('error', 'Error in new listener:', error);
    }
    
    return id;
  }

  /**
   * Remove a listener
   */
  removeListener(id: string): boolean {
    return this.listeners.delete(id);
  }

  /**
   * Trigger a reconnection attempt for Firebase
   */
  triggerReconnect(callback?: () => void): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.log('warn', `Max reconnect attempts reached (${this.maxReconnectAttempts})`);
      return;
    }
    
    this.reconnectAttempts++;
    this.log('info', `Triggering reconnect attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);
    
    // Clear any existing reconnect timeout
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    // Execute the callback if provided (this should contain the reconnection logic)
    if (callback) {
      try {
        callback();
      } catch (error) {
        this.log('error', 'Error during reconnect:', error);
      }
    }
    
    // If we're below max attempts, schedule the next attempt with exponential backoff
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      const delay = Math.min(1000 * 2 ** this.reconnectAttempts, 30000);
      this.log('debug', `Scheduling next reconnect in ${delay}ms`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.triggerReconnect(callback);
      }, delay);
    }
  }

  /**
   * Check if we're currently online
   */
  getOnlineStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Clean up resources
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('online', this.handleOnline);
      window.removeEventListener('offline', this.handleOffline);
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.listeners.clear();
    this.log('debug', 'ConnectionMonitor destroyed');
  }
} 