import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CardHistoryService } from './card-history.service';
import { CardGeneratorService } from './card-generator.service';
import { WordStorageService } from './word-storage.service';
import { signal } from '@angular/core';
import { ConceptCard } from '../models/concept.models';

describe('CardHistoryService', () => {
  let service: CardHistoryService;
  let mockGenerator: any;

  const makeCard = (id: string): ConceptCard => ({
    id,
    seed: parseInt(id, 36) || 1,
    timestamp: Date.now(),
    easy: [
      { text: `Word 1 (${id})`, difficulty: 0 },
      { text: `Word 2 (${id})`, difficulty: 0 },
      { text: `Word 3 (${id})`, difficulty: 0 }
    ],
    medium: [
      { text: `Word 4 (${id})`, difficulty: 1 },
      { text: `Word 5 (${id})`, difficulty: 1 },
      { text: `Word 6 (${id})`, difficulty: 1 }
    ],
    hard: [
      { text: `Word 7 (${id})`, difficulty: 2 },
      { text: `Word 8 (${id})`, difficulty: 2 },
      { text: `Word 9 (${id})`, difficulty: 2 }
    ],
    themesSummary: ['Thème A']
  });

  beforeEach(() => {
    let counter = 100;
    mockGenerator = {
      generateCard: vi.fn(() => makeCard((++counter).toString(36))),
      getCardById: vi.fn((id: string) => makeCard(id))
    };

    const mockStorage = {
      isLoaded: signal(false)
    };

    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        CardHistoryService,
        { provide: CardGeneratorService, useValue: mockGenerator },
        { provide: WordStorageService, useValue: mockStorage }
      ]
    });

    service = TestBed.inject(CardHistoryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should start with empty history state', () => {
    expect(service.currentCard()).toBeNull();
    expect(service.canGoBack()).toBe(false);
    expect(service.canGoForward()).toBe(false);
    expect(service.historyTotal()).toBe(0);
  });

  it('should add cards to history stack on generateNewCard', () => {
    const card1 = service.generateNewCard();
    expect(card1).not.toBeNull();
    expect(service.currentCard()?.id).toBe(card1?.id);
    expect(service.historyTotal()).toBe(1);
    expect(service.historyIndex()).toBe(1);
    expect(service.canGoBack()).toBe(false);
    expect(service.canGoForward()).toBe(false);

    const card2 = service.generateNewCard();
    expect(card2).not.toBeNull();
    expect(service.historyTotal()).toBe(2);
    expect(service.historyIndex()).toBe(2);
    expect(service.canGoBack()).toBe(true);
    expect(service.canGoForward()).toBe(false);
  });

  it('should navigate backward and forward through history stack', () => {
    const card1 = service.generateNewCard();
    const card2 = service.generateNewCard();
    const card3 = service.generateNewCard();

    expect(service.historyIndex()).toBe(3);
    expect(service.currentCard()?.id).toBe(card3?.id);

    // Go back to card 2
    const back1 = service.goToPrevious();
    expect(back1).toBe(true);
    expect(service.currentCard()?.id).toBe(card2?.id);
    expect(service.historyIndex()).toBe(2);
    expect(service.canGoForward()).toBe(true);

    // Go back to card 1
    const back2 = service.goToPrevious();
    expect(back2).toBe(true);
    expect(service.currentCard()?.id).toBe(card1?.id);
    expect(service.historyIndex()).toBe(1);
    expect(service.canGoBack()).toBe(false);

    // Go forward to card 2
    const forward1 = service.goToNext();
    expect(forward1).toBe(true);
    expect(service.currentCard()?.id).toBe(card2?.id);
    expect(service.historyIndex()).toBe(2);
  });

  it('should truncate forward history when generating a new card from past position', () => {
    service.generateNewCard(); // card 1
    service.generateNewCard(); // card 2
    service.generateNewCard(); // card 3

    // Go back to card 1
    service.goToPrevious();
    service.goToPrevious();
    expect(service.historyIndex()).toBe(1);

    // Branch with a new generation
    const branchCard = service.generateNewCard(); // card 4
    expect(service.historyTotal()).toBe(2);
    expect(service.historyIndex()).toBe(2);
    expect(service.currentCard()?.id).toBe(branchCard?.id);
    expect(service.canGoForward()).toBe(false);
  });
});
