import { Injectable, signal, computed } from '@angular/core';
import { WordItem, WordsDataset } from '../models/concept.models';

const DB_NAME = 'ConceptCardDB';
const DB_VERSION = 1;
const STORE_NAME = 'dataset_store';
const DATASET_KEY = 'words_dataset_v1';

@Injectable({
  providedIn: 'root'
})
export class WordStorageService {
  private readonly _dataset = signal<WordsDataset | null>(null);
  private readonly _isLoading = signal<boolean>(true);
  private readonly _loadingError = signal<string | null>(null);
  private readonly _loadSource = signal<'indexedDB' | 'network' | 'fallback'>('network');

  readonly dataset = this._dataset.asReadonly();
  readonly isLoading = this._isLoading.asReadonly();
  readonly loadingError = this._loadingError.asReadonly();
  readonly loadSource = this._loadSource.asReadonly();

  readonly isLoaded = computed(() => this._dataset() !== null);
  readonly totalWordsCount = computed(() => this._dataset()?.count ?? 0);
  readonly themes = computed(() => this._dataset()?.themes ?? {});

  // Grouped words for O(1) instant sampling
  readonly easyWords = computed(() => {
    const ds = this._dataset();
    return ds ? ds.words.filter(w => w.d === 0) : [];
  });

  readonly mediumWords = computed(() => {
    const ds = this._dataset();
    return ds ? ds.words.filter(w => w.d === 1) : [];
  });

  readonly hardWords = computed(() => {
    const ds = this._dataset();
    return ds ? ds.words.filter(w => w.d === 2) : [];
  });

  constructor() {
    this.initDataset();
  }

  private async initDataset(): Promise<void> {
    this._isLoading.set(true);
    this._loadingError.set(null);

    try {
      // 1. Try loading from IndexedDB first for instant startup
      const cached = await this.readFromIndexedDB();
      if (cached && cached.words && cached.words.length > 0) {
        this._dataset.set(cached);
        this._loadSource.set('indexedDB');
        this._isLoading.set(false);
        return;
      }

      // 2. Fetch from static JSON
      await this.fetchAndCacheDataset();
    } catch (err) {
      console.warn('IndexedDB unavailable or failed, falling back to direct network fetch:', err);
      try {
        await this.fetchAndCacheDataset();
      } catch (fetchErr: any) {
        this._loadingError.set(fetchErr?.message || 'Erreur de chargement du dictionnaire');
        this._isLoading.set(false);
      }
    }
  }

  private async fetchAndCacheDataset(): Promise<void> {
    const res = await fetch('data/words.json');
    if (!res.ok) {
      throw new Error(`HTTP error ${res.status}: Impossible de charger les données`);
    }
    const data: WordsDataset = await res.json();
    this._dataset.set(data);
    this._loadSource.set('network');
    this._isLoading.set(false);

    // Save to IndexedDB asynchronously without blocking UI
    this.writeToIndexedDB(data).catch(err => {
      console.warn('Failed to save dataset in IndexedDB:', err);
    });
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported'));
        return;
      }

      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  private async readFromIndexedDB(): Promise<WordsDataset | null> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(DATASET_KEY);

        req.onsuccess = () => {
          resolve(req.result || null);
        };
        req.onerror = () => reject(req.error);
      });
    } catch {
      return null;
    }
  }

  private async writeToIndexedDB(data: WordsDataset): Promise<void> {
    try {
      const db = await this.openDB();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        const req = store.put(data, DATASET_KEY);

        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('Could not cache dataset in IndexedDB:', e);
    }
  }

  getThemeTitle(queryIndex?: number): string {
    if (queryIndex === undefined || queryIndex === null) return 'Général';
    const themes = this.themes();
    return themes[queryIndex.toString()] || `Thème #${queryIndex}`;
  }
}
