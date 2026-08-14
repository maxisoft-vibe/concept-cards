import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CardGeneratorService } from './card-generator.service';
import { WordStorageService } from './word-storage.service';
import { signal } from '@angular/core';
import { WordsDataset } from '../models/concept.models';

describe('CardGeneratorService', () => {
  let service: CardGeneratorService;
  let mockDataset: WordsDataset;

  beforeEach(() => {
    mockDataset = {
      version: 1,
      count: 9,
      themes: {
        '0': 'Animaux',
        '1': 'Cinéma',
        '2': 'Histoire',
        '3': 'Sciences',
        '4': 'Littérature',
        '5': 'Musique',
        '6': 'Sports',
        '7': 'Géographie',
        '8': 'Gastronomie'
      },
      words: [
        // Easy words (d: 0)
        { w: 'Chien', d: 0, q: [0] },
        { w: 'Chat', d: 0, q: [0] },
        { w: 'Titanic', d: 0, q: [1], y: 1997 },
        { w: 'Tour Eiffel', d: 0, q: [2], y: 1889 },
        { w: 'Lune', d: 0, q: [3] },
        // Medium words (d: 1)
        { w: 'Victor Hugo', d: 1, q: [4] },
        { w: 'Mozart', d: 1, q: [5] },
        { w: 'Football', d: 1, q: [6] },
        { w: 'Everest', d: 1, q: [7] },
        // Hard words (d: 2)
        { w: 'Croissant', d: 2, q: [8] },
        { w: 'Photosynthèse', d: 2, q: [3] },
        { w: 'Révolution Française', d: 2, q: [2], y: 1789 },
        { w: 'Relativité Générale', d: 2, q: [3], y: 1915 }
      ]
    };

    const mockWordStorage = {
      dataset: signal(mockDataset),
      isLoaded: signal(true),
      easyWords: signal(mockDataset.words.filter(w => w.d === 0)),
      mediumWords: signal(mockDataset.words.filter(w => w.d === 1)),
      hardWords: signal(mockDataset.words.filter(w => w.d === 2)),
      getThemeTitle: (id: number) => mockDataset.themes[id.toString()] || `Thème #${id}`
    };

    TestBed.configureTestingModule({
      providers: [
        CardGeneratorService,
        { provide: WordStorageService, useValue: mockWordStorage }
      ]
    });

    service = TestBed.inject(CardGeneratorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a card with 3 easy, 3 medium, and 3 hard words', () => {
    const card = service.generateCard(42);
    expect(card).not.toBeNull();
    expect(card!.easy.length).toBe(3);
    expect(card!.medium.length).toBe(3);
    expect(card!.hard.length).toBe(3);
    expect(card!.seed).toBe(42);
    expect(card!.id).toBe((42).toString(36));
  });

  it('should be strictly deterministic with the same seed', () => {
    const cardA = service.generateCard(99999);
    const cardB = service.generateCard(99999);

    expect(cardA).toEqual(cardB);
    expect(cardA!.easy.map(e => e.text)).toEqual(cardB!.easy.map(e => e.text));
    expect(cardA!.medium.map(m => m.text)).toEqual(cardB!.medium.map(m => m.text));
    expect(cardA!.hard.map(h => h.text)).toEqual(cardB!.hard.map(h => h.text));
  });

  it('should retrieve a deterministic card by its base36 ID', () => {
    const seed = 1234567;
    const base36Id = seed.toString(36);
    const cardFromSeed = service.generateCard(seed);
    const cardFromId = service.getCardById(base36Id);

    expect(cardFromId).toEqual(cardFromSeed);
    expect(cardFromId?.id).toBe(base36Id);
  });

  it('should return null if invalid ID string is provided', () => {
    expect(service.getCardById('')).toBeNull();
    expect(service.getCardById('   ')).toBeNull();
  });

  it('should populate themes and year if present', () => {
    const card = service.generateCard(42);
    expect(card).not.toBeNull();
    const allItems = [...card!.easy, ...card!.medium, ...card!.hard];
    const itemWithYear = allItems.find(i => i.year !== undefined);
    if (itemWithYear) {
      expect(typeof itemWithYear.year).toBe('number');
    }
  });
});
