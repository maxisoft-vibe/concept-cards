import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { WordStorageService } from './word-storage.service';
import { WordsDataset } from '../models/concept.models';

describe('WordStorageService', () => {
  let service: WordStorageService;

  const mockData: WordsDataset = {
    version: 2,
    count: 3,
    themes: {
      '0': 'Animaux',
      '1': 'Cinéma'
    },
    words: [
      { w: 'Chien', d: 0, q: [0] },
      { w: 'Titanic', d: 1, q: [1] },
      { w: 'Einstein', d: 2, q: [] }
    ]
  };

  beforeEach(() => {
    // Mock global fetch
    globalThis.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve(mockData)
      })
    );

    TestBed.configureTestingModule({
      providers: [WordStorageService]
    });

    service = TestBed.inject(WordStorageService);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch dataset and populate computed signals', async () => {
    // Wait for async init
    await new Promise(r => setTimeout(r, 50));

    expect(service.isLoaded()).toBe(true);
    expect(service.totalWordsCount()).toBe(3);
    expect(service.easyWords().length).toBe(1);
    expect(service.mediumWords().length).toBe(1);
    expect(service.hardWords().length).toBe(1);
  });

  it('should resolve theme titles correctly', async () => {
    await new Promise(r => setTimeout(r, 50));

    expect(service.getThemeTitle(0)).toBe('Animaux');
    expect(service.getThemeTitle(1)).toBe('Cinéma');
    expect(service.getThemeTitle(999)).toBe('Thème #999');
  });
});
