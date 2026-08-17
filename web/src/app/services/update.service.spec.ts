import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { UpdateService, CURRENT_BUILD_INFO } from './update.service';

describe('UpdateService', () => {
  let service: UpdateService;

  beforeEach(() => {
    // Mock fetch for app-version.json
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appVersion: '1.2.0',
          buildHash: CURRENT_BUILD_INFO.buildHash,
          builtAt: Date.now(),
          datasetVersion: CURRENT_BUILD_INFO.datasetVersion,
          wordsCount: CURRENT_BUILD_INFO.wordsCount
        })
      })
    );

    TestBed.configureTestingModule({
      providers: [UpdateService]
    });

    service = TestBed.inject(UpdateService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
    expect(service.updateAvailable()).toBe(false);
  });

  it('should detect code update when buildHash changes', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appVersion: '1.3.0',
          buildHash: 'new-hash-xyz',
          builtAt: Date.now(),
          datasetVersion: CURRENT_BUILD_INFO.datasetVersion,
          wordsCount: CURRENT_BUILD_INFO.wordsCount
        })
      })
    );

    const hasUpdate = await service.checkForUpdates();
    expect(hasUpdate).toBe(true);
    expect(service.updateAvailable()).toBe(true);
    expect(service.updateReason()).toBe('code');
  });

  it('should detect dataset update when datasetVersion changes', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appVersion: CURRENT_BUILD_INFO.appVersion,
          buildHash: CURRENT_BUILD_INFO.buildHash,
          builtAt: Date.now(),
          datasetVersion: 3,
          wordsCount: 7000
        })
      })
    );

    const hasUpdate = await service.checkForUpdates();
    expect(hasUpdate).toBe(true);
    expect(service.updateAvailable()).toBe(true);
    expect(service.updateReason()).toBe('dataset');
  });

  it('should handle network error or offline response gracefully without error', async () => {
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.reject(new Error('Failed to fetch (offline)'))
    );

    const hasUpdate = await service.checkForUpdates();
    expect(hasUpdate).toBe(false);
    expect(service.updateAvailable()).toBe(false);
  });

  it('should dismiss update banner', () => {
    service.updateAvailable.set(true);
    expect(service.updateAvailable()).toBe(true);

    service.dismiss();
    expect(service.updateAvailable()).toBe(false);
  });

  it('should rate-limit requests to at most 1 per minute unless force=true', async () => {
    const fetchSpy = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({
          appVersion: CURRENT_BUILD_INFO.appVersion,
          buildHash: CURRENT_BUILD_INFO.buildHash,
          builtAt: Date.now(),
          datasetVersion: CURRENT_BUILD_INFO.datasetVersion,
          wordsCount: CURRENT_BUILD_INFO.wordsCount
        })
      })
    );
    globalThis.fetch = fetchSpy;

    // First call executes
    await service.checkForUpdates(true);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Second immediate call without force should be rate-limited (0 network request)
    await service.checkForUpdates(false);
    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Third call with force=true bypasses rate limiter
    await service.checkForUpdates(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});
