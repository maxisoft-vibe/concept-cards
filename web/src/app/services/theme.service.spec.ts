import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { ThemeService } from './theme.service';

describe('ThemeService', () => {
  let service: ThemeService;

  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');

    TestBed.configureTestingModule({
      providers: [ThemeService]
    });

    service = TestBed.inject(ThemeService);
  });

  afterEach(() => {
    localStorage.clear();
    document.documentElement.className = '';
    document.documentElement.removeAttribute('data-theme');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should default to auto theme mode if nothing is saved', () => {
    expect(service.currentTheme()).toBe('auto');
  });

  it('should switch to dark theme when explicitly requested', () => {
    service.setTheme('dark');
    TestBed.flushEffects();

    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);
    expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(true);
  });

  it('should switch to light theme and remove dark classes', () => {
    service.setTheme('dark');
    TestBed.flushEffects();
    expect(service.isDark()).toBe(true);

    service.setTheme('light');
    TestBed.flushEffects();

    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    expect(document.documentElement.classList.contains('dark-theme')).toBe(false);
  });

  it('should toggle theme between light and dark', () => {
    service.setTheme('light');
    TestBed.flushEffects();

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.currentTheme()).toBe('dark');
    expect(service.isDark()).toBe(true);

    service.toggleTheme();
    TestBed.flushEffects();
    expect(service.currentTheme()).toBe('light');
    expect(service.isDark()).toBe(false);
  });
});
