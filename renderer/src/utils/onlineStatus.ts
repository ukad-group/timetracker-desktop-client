/**
 * Online status utility using navigator.onLine
 * Provides a reactive way to check online status without external dependencies
 */

export interface OnlineStatusListener {
  (online: boolean): void;
}

class OnlineStatusManager {
  private listeners: Set<OnlineStatusListener> = new Set();
  private isOnline: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;

  constructor() {
    // Only add event listeners if we're in a browser environment
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnlineChange);
      window.addEventListener("offline", this.handleOfflineChange);
    }
  }

  private handleOnlineChange = () => {
    this.isOnline = true;
    this.notifyListeners();
  };

  private handleOfflineChange = () => {
    this.isOnline = false;
    this.notifyListeners();
  };

  private notifyListeners = () => {
    this.listeners.forEach((listener) => listener(this.isOnline));
  };

  /**
   * Get current online status
   * @returns boolean indicating if the browser is online
   */
  public getStatus(): boolean {
    return this.isOnline;
  }

  /**
   * Add a listener for online status changes
   * @param listener callback function that receives online status
   * @returns cleanup function to remove the listener
   */
  public addListener(listener: OnlineStatusListener): () => void {
    this.listeners.add(listener);

    // Return cleanup function
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Remove a specific listener
   * @param listener the listener to remove
   */
  public removeListener(listener: OnlineStatusListener): void {
    this.listeners.delete(listener);
  }

  /**
   * Clean up all event listeners (call when component unmounts)
   */
  public cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnlineChange);
      window.removeEventListener("offline", this.handleOfflineChange);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const onlineStatusManager = new OnlineStatusManager();

// Export simple function for one-time checks
export const isOnline = (): boolean => onlineStatusManager.getStatus();

// Export React hook for components
export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = React.useState(isOnline());

  React.useEffect(() => {
    const cleanup = onlineStatusManager.addListener((status: boolean) => {
      setOnline(status);
    });

    return cleanup;
  }, []);

  return online;
};

// Add React import for the hook
import React from "react";
