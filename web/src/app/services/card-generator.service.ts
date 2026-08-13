import { Injectable, inject } from '@angular/core';
import { WordStorageService } from './word-storage.service';
import { ConceptCard, ConceptCardItem, WordItem } from '../models/concept.models';

/**
 * Fast, lightweight pseudo-random number generator (Mulberry32)
 */
function mulberry32(seed: number) {
  return function () {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

@Injectable({
  providedIn: 'root'
})
export class CardGeneratorService {
  private readonly storage = inject(WordStorageService);

  /**
   * Generates a new Concept Card with 9 words (3 Easy, 3 Medium, 3 Hard)
   * with guaranteed thematic diversity and optional deterministic seed.
   */
  generateCard(seed?: number): ConceptCard | null {
    const easyList = this.storage.easyWords();
    const mediumList = this.storage.mediumWords();
    const hardList = this.storage.hardWords();

    if (easyList.length < 3 || mediumList.length < 3 || hardList.length < 3) {
      return null;
    }

    const actualSeed = seed !== undefined ? seed : Math.floor(Math.random() * 2147483647);
    const rng = mulberry32(actualSeed);

    const usedWordTexts = new Set<string>();
    const usedThemeIndices = new Set<number>();
    const cardThemes: string[] = [];

    // Helper to sample N words with maximum thematic diversity
    const sampleWords = (pool: WordItem[], count: number, difficulty: number): ConceptCardItem[] => {
      const selected: ConceptCardItem[] = [];
      const shuffledIndices = this.shuffleIndices(pool.length, rng);

      // Pass 1: Try finding words from new, unused themes
      for (const idx of shuffledIndices) {
        if (selected.length >= count) break;
        const w = pool[idx];
        if (usedWordTexts.has(w.w)) continue;

        const primaryTheme = w.q && w.q.length > 0 ? w.q[0] : -1;
        if (primaryTheme !== -1 && usedThemeIndices.has(primaryTheme)) {
          continue; // Skip already represented topic for higher diversity
        }

        // Add word
        usedWordTexts.add(w.w);
        if (primaryTheme !== -1) {
          usedThemeIndices.add(primaryTheme);
          const themeName = this.storage.getThemeTitle(primaryTheme);
          if (themeName && !cardThemes.includes(themeName)) {
            cardThemes.push(themeName);
          }
        }

        selected.push({
          text: w.w,
          difficulty,
          theme: primaryTheme !== -1 ? this.storage.getThemeTitle(primaryTheme) : undefined,
          year: w.y,
          wordIndex: idx
        });
      }

      // Pass 2: Fallback if strict theme separation didn't fill all slots
      if (selected.length < count) {
        for (const idx of shuffledIndices) {
          if (selected.length >= count) break;
          const w = pool[idx];
          if (usedWordTexts.has(w.w)) continue;

          usedWordTexts.add(w.w);
          selected.push({
            text: w.w,
            difficulty,
            theme: w.q && w.q.length > 0 ? this.storage.getThemeTitle(w.q[0]) : undefined,
            year: w.y,
            wordIndex: idx
          });
        }
      }

      return selected;
    };

    const easyItems = sampleWords(easyList, 3, 0) as [ConceptCardItem, ConceptCardItem, ConceptCardItem];
    const mediumItems = sampleWords(mediumList, 3, 1) as [ConceptCardItem, ConceptCardItem, ConceptCardItem];
    const hardItems = sampleWords(hardList, 3, 2) as [ConceptCardItem, ConceptCardItem, ConceptCardItem];

    const cardId = actualSeed.toString(36);

    return {
      id: cardId,
      seed: actualSeed,
      timestamp: Date.now(),
      easy: easyItems,
      medium: mediumItems,
      hard: hardItems,
      themesSummary: cardThemes.slice(0, 5)
    };
  }

  /**
   * Generates or recreates a card deterministically from an ID/seed string.
   */
  getCardById(idString: string): ConceptCard | null {
    if (!idString) return null;
    const cleanId = idString.trim().toLowerCase();
    const seed = parseInt(cleanId, 36);
    if (isNaN(seed)) return null;
    return this.generateCard(seed);
  }

  private shuffleIndices(length: number, rng: () => number): number[] {
    const indices = Array.from({ length }, (_, i) => i);
    for (let i = indices.length - 1; i > 0; i--) {
      const j = Math.floor(rng() * (i + 1));
      [indices[i], indices[j]] = [indices[j], indices[i]];
    }
    return indices;
  }
}
