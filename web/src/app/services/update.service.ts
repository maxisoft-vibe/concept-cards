import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Capacitor } from '@capacitor/core';
import { CURRENT_BUILD_INFO, type AppVersionInfo } from '../version';

export { CURRENT_BUILD_INFO };
export type { AppVersionInfo };

// Max 1 remote version check per minute (global rate limiter / debounce)
export const MIN_UPDATE_CHECK_INTERVAL_MS = 60 * 1000;

@Injectable({
  providedIn: 'root'
})
export class UpdateService {
  private readonly platformId = inject(PLATFORM_ID);

  readonly isBrowser = isPlatformBrowser(this.platformId);
  readonly isNative = Capacitor.isNativePlatform();
  readonly updateAvailable = signal<boolean>(false);
  readonly updateReason = signal<'code' | 'dataset' | 'both'>('code');
  readonly remoteVersion = signal<AppVersionInfo | null>(null);
  readonly isChecking = signal<boolean>(false);

  private intervalId: any = null;
  private waitingWorker: ServiceWorker | null = null;
  private lastCheckTimestamp = 0;

  constructor() {
    // Only enable web polling & Service Worker updates on web browsers (not in offline native app)
    if (this.isBrowser && !this.isNative) {
      this.initUpdateListeners();
    }
  }

  private initUpdateListeners(): void {
    // 1. Initial check after 2 seconds (leaves startup completely non-blocking)
    setTimeout(() => {
      this.checkForUpdates();
    }, 2000);

    // 2. Listen to tab focus / visibilitychange
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.checkForUpdates();
        }
      });
    }

    // 3. Periodic check every 15 minutes
    this.intervalId = setInterval(() => {
      this.checkForUpdates();
    }, 15 * 60 * 1000);

    // 4. Hook into Service Worker native lifecycle
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        // If a worker is already waiting
        if (registration.waiting) {
          this.waitingWorker = registration.waiting;
          this.updateAvailable.set(true);
          this.updateReason.set('code');
        }

        // When a new service worker is installing
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                this.waitingWorker = newWorker;
                this.updateAvailable.set(true);
                this.updateReason.set('code');
                console.log('[UpdateService] New Service Worker installed & ready to activate.');
              }
            });
          }
        });
      }).catch(err => {
        console.warn('[UpdateService] Service Worker ready notice:', err);
      });
    }
  }

  /**
   * Silently checks app-version.json (~100 bytes) over network.
   * Throttled to at most 1 check per minute unless force=true.
   */
  async checkForUpdates(force = false): Promise<boolean> {
    if (!this.isBrowser || this.isNative || this.isChecking()) {
      return false;
    }

    const now = Date.now();
    if (!force && (now - this.lastCheckTimestamp < MIN_UPDATE_CHECK_INTERVAL_MS)) {
      return false;
    }

    this.isChecking.set(true);
    this.lastCheckTimestamp = now;
    try {
      const base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : window.location.href;
      const url = new URL(`app-version.json?t=${now}`, base).href;

      const res = await fetch(url, { cache: 'no-cache' });
      if (!res.ok) {
        return false;
      }

      const remote: AppVersionInfo & { offline?: boolean } = await res.json();
      if (remote.offline) {
        return false;
      }

      const codeChanged = remote.buildHash && remote.buildHash !== CURRENT_BUILD_INFO.buildHash;
      const datasetChanged = (remote.datasetVersion && remote.datasetVersion !== CURRENT_BUILD_INFO.datasetVersion) ||
                             (remote.wordsCount && remote.wordsCount !== CURRENT_BUILD_INFO.wordsCount);

      if (codeChanged || datasetChanged) {
        this.remoteVersion.set(remote);
        this.updateAvailable.set(true);
        if (codeChanged && datasetChanged) {
          this.updateReason.set('both');
        } else if (datasetChanged) {
          this.updateReason.set('dataset');
        } else {
          this.updateReason.set('code');
        }
        console.log(`[UpdateService] Update detected! Code: ${codeChanged}, Dataset: ${datasetChanged}`, remote);
        return true;
      }
      return false;
    } catch {
      // Offline / network failure: silently ignore
      return false;
    } finally {
      this.isChecking.set(false);
    }
  }

  /**
   * Applies the update immediately and reloads the application.
   */
  applyUpdate(): void {
    if (!this.isBrowser) return;

    if (this.waitingWorker) {
      this.waitingWorker.postMessage({ type: 'SKIP_WAITING' });
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        }, { once: true });
      }
      setTimeout(() => {
        window.location.reload();
      }, 500);
      return;
    }

    window.location.reload();
  }

  /**
   * User dismisses the update prompt for the current session.
   */
  dismiss(): void {
    this.updateAvailable.set(false);
  }
}
