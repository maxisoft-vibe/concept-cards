import { Injectable, signal, effect } from '@angular/core';

export type ThemeMode = 'light' | 'dark' | 'auto';

const STORAGE_KEY = 'concept_theme_preference';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  readonly currentTheme = signal<ThemeMode>(this.getInitialTheme());
  readonly isDark = signal<boolean>(false);

  constructor() {
    // Initial evaluation
    this.updateEffectiveTheme(this.currentTheme());

    // Update whenever theme signal changes
    effect(() => {
      const theme = this.currentTheme();
      this.updateEffectiveTheme(theme);
      try {
        localStorage.setItem(STORAGE_KEY, theme);
      } catch {
        // Ignore localStorage errors (e.g. private browsing storage quota)
      }
    });

    // Listen to system preference changes if in auto mode
    if (typeof window !== 'undefined' && window.matchMedia) {
      window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (this.currentTheme() === 'auto') {
          this.setDarkState(e.matches);
        }
      });
    }
  }

  toggleTheme(): void {
    const next: ThemeMode = this.isDark() ? 'light' : 'dark';
    this.currentTheme.set(next);
  }

  setTheme(mode: ThemeMode): void {
    this.currentTheme.set(mode);
  }

  private getInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') return 'auto';
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
      if (saved && (saved === 'light' || saved === 'dark' || saved === 'auto')) {
        return saved;
      }
    } catch {
      // Ignore
    }
    return 'auto';
  }

  private updateEffectiveTheme(mode: ThemeMode): void {
    if (typeof window === 'undefined') return;

    let dark = false;
    if (mode === 'dark') {
      dark = true;
    } else if (mode === 'light') {
      dark = false;
    } else {
      // Auto: detect system preference
      dark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    }

    this.setDarkState(dark);
  }

  private setDarkState(dark: boolean): void {
    this.isDark.set(dark);
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      if (dark) {
        root.classList.add('dark-theme');
        root.setAttribute('data-theme', 'dark');
      } else {
        root.classList.remove('dark-theme');
        root.setAttribute('data-theme', 'light');
      }
    }
  }
}
