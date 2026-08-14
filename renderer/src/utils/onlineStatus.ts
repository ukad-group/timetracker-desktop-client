import React from "react";

/**
 * Online status utility with active HTTPS connectivity probing.
 * navigator.onLine only reflects local network link state, not internet reachability.
 */

const PROBE_URLS = ["https://icanhazip.com", "https://api.ipify.org?format=json"];
const PROBE_TIMEOUT_MS = 3000;
const CACHE_TTL_MS = 3000;

export interface OnlineStatusListener {
  (online: boolean): void;
}

const probeUrl = async (url: string, signal: AbortSignal): Promise<boolean> => {
  const response = await fetch(url, {
    method: "HEAD",
    cache: "no-store",
    signal,
  });

  return response.ok;
};

const runConnectivityProbe = async (): Promise<boolean> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);

  try {
    await Promise.any(PROBE_URLS.map((url) => probeUrl(url, controller.signal)));
    return true;
  } catch {
    return false;
  } finally {
    clearTimeout(timeoutId);
  }
};

class OnlineStatusManager {
  private listeners: Set<OnlineStatusListener> = new Set();
  private cachedStatus: boolean = typeof navigator !== "undefined" ? navigator.onLine : true;
  private lastProbeAt = 0;
  private probeInFlight: Promise<boolean> | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnlineChange);
      window.addEventListener("offline", this.handleOfflineChange);
    }
  }

  private handleOnlineChange = () => {
    void this.checkConnectivity(true);
  };

  private handleOfflineChange = () => {
    this.setStatus(false);
  };

  private setStatus(online: boolean) {
    this.cachedStatus = online;
    this.notifyListeners();
  }

  private notifyListeners = () => {
    this.listeners.forEach((listener) => listener(this.cachedStatus));
  };

  public getStatus(): boolean {
    return this.cachedStatus;
  }

  public async checkConnectivity(forceProbe = false): Promise<boolean> {
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setStatus(false);
      return false;
    }

    const now = Date.now();
    if (!forceProbe && now - this.lastProbeAt < CACHE_TTL_MS) {
      return this.cachedStatus;
    }

    if (this.probeInFlight) {
      return this.probeInFlight;
    }

    this.probeInFlight = runConnectivityProbe()
      .then((online) => {
        this.lastProbeAt = Date.now();
        this.setStatus(online);
        return online;
      })
      .finally(() => {
        this.probeInFlight = null;
      });

    return this.probeInFlight;
  }

  public addListener(listener: OnlineStatusListener): () => void {
    this.listeners.add(listener);

    return () => {
      this.listeners.delete(listener);
    };
  }

  public removeListener(listener: OnlineStatusListener): void {
    this.listeners.delete(listener);
  }

  public cleanup(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnlineChange);
      window.removeEventListener("offline", this.handleOfflineChange);
    }
    this.listeners.clear();
  }
}

export const onlineStatusManager = new OnlineStatusManager();

export const isOnline = (): Promise<boolean> => onlineStatusManager.checkConnectivity();

export const getCachedOnlineStatus = (): boolean => onlineStatusManager.getStatus();

export const useOnlineStatus = (): boolean => {
  const [online, setOnline] = React.useState(getCachedOnlineStatus());

  React.useEffect(() => {
    const cleanup = onlineStatusManager.addListener((status: boolean) => {
      setOnline(status);
    });

    void onlineStatusManager.checkConnectivity();

    return cleanup;
  }, []);

  return online;
};
