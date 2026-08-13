import { Injectable, inject, signal, computed, effect, untracked } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { CardGeneratorService } from './card-generator.service';
import { WordStorageService } from './word-storage.service';
import { ConceptCard } from '../models/concept.models';

@Injectable({
  providedIn: 'root'
})
export class CardHistoryService {
  private readonly generator = inject(CardGeneratorService);
  private readonly storage = inject(WordStorageService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  // Stack of seen card IDs for in-session navigation
  private readonly _history = signal<string[]>([]);
  private readonly _currentIndex = signal<number>(-1);
  private readonly _currentCard = signal<ConceptCard | null>(null);

  readonly currentCard = this._currentCard.asReadonly();
  readonly canGoBack = computed(() => this._currentIndex() > 0);
  readonly canGoForward = computed(() => this._currentIndex() < this._history().length - 1);
  readonly historyIndex = computed(() => this._currentIndex() + 1);
  readonly historyTotal = computed(() => this._history().length);

  private hasInitialCardLoaded = false;

  constructor() {
    // When dataset becomes ready, generate initial card or load from URL
    effect(() => {
      const isLoaded = this.storage.isLoaded();
      if (isLoaded && !this.hasInitialCardLoaded) {
        this.hasInitialCardLoaded = true;
        untracked(() => {
          this.initFirstCard();
        });
      }
    });

    // Handle browser native back/forward buttons
    if (typeof window !== 'undefined') {
      window.addEventListener('popstate', () => {
        const hash = window.location.hash;
        const queryStr = hash.includes('?') ? hash.split('?')[1] : window.location.search.replace('?', '');
        const params = new URLSearchParams(queryStr);
        const cardId = params.get('card') || params.get('id');

        if (cardId && cardId !== this._currentCard()?.id) {
          this.loadCardById(cardId, false);
        }
      });
    }
  }

  private initFirstCard(): void {
    if (typeof window === 'undefined') return;

    // Parse URL query parameter: handles both ?card=xxx and #/?card=xxx
    const searchParams = new URLSearchParams(window.location.search);
    const hash = window.location.hash;
    const hashQuery = hash.includes('?') ? hash.split('?')[1] : '';
    const hashParams = new URLSearchParams(hashQuery);

    const cardParam = hashParams.get('card') || hashParams.get('id') || searchParams.get('card') || searchParams.get('id');

    if (cardParam) {
      const loaded = this.loadCardById(cardParam, false);
      if (!loaded) {
        this.generateNewCard();
      }
    } else if (!this._currentCard()) {
      this.generateNewCard();
    }
  }

  /**
   * Generates and displays a brand new card, adding it to browser history.
   */
  generateNewCard(): ConceptCard | null {
    const card = this.generator.generateCard();
    if (!card) return null;

    const history = this._history();
    const curIdx = this._currentIndex();

    // Truncate any 'forward' history if we branch out with a new generation
    const newHistory = history.slice(0, curIdx + 1);
    newHistory.push(card.id);

    this._history.set(newHistory);
    this._currentIndex.set(newHistory.length - 1);
    this._currentCard.set(card);

    this.updateUrl(card.id, false);
    return card;
  }

  /**
   * Navigates back to the previous card in history.
   */
  goToPrevious(): boolean {
    if (!this.canGoBack()) return false;
    const prevIdx = this._currentIndex() - 1;
    const prevId = this._history()[prevIdx];
    const card = this.generator.getCardById(prevId);

    if (card) {
      this._currentIndex.set(prevIdx);
      this._currentCard.set(card);
      this.updateUrl(card.id, true);
      return true;
    }
    return false;
  }

  /**
   * Navigates forward to the next card in history.
   */
  goToNext(): boolean {
    if (!this.canGoForward()) return false;
    const nextIdx = this._currentIndex() + 1;
    const nextId = this._history()[nextIdx];
    const card = this.generator.getCardById(nextId);

    if (card) {
      this._currentIndex.set(nextIdx);
      this._currentCard.set(card);
      this.updateUrl(card.id, true);
      return true;
    }
    return false;
  }

  /**
   * Loads a specific card by its ID/seed.
   */
  loadCardById(id: string, replaceUrl = false): boolean {
    const card = this.generator.getCardById(id);
    if (!card) return false;

    // Check if ID is in history
    const history = this._history();
    const existingIndex = history.indexOf(card.id);

    if (existingIndex !== -1) {
      this._currentIndex.set(existingIndex);
    } else {
      const newHistory = [...history, card.id];
      this._history.set(newHistory);
      this._currentIndex.set(newHistory.length - 1);
    }

    this._currentCard.set(card);
    this.updateUrl(card.id, replaceUrl);
    return true;
  }

  private updateUrl(cardId: string, replace: boolean): void {
    if (typeof window === 'undefined') return;

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { card: cardId },
      queryParamsHandling: 'merge',
      replaceUrl: replace
    }).catch(() => {
      // Ignored
    });
  }
}
