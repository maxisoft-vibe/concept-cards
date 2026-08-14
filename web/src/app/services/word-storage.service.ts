import { Injectable, signal, computed } from '@angular/core';
import { WordsDataset } from '../models/concept.models';

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

  getThemeTitle(themeId: number): string {
    const th = this.themes();
    return th[themeId] || `Thème #${themeId}`;
  }

  private async initDataset(): Promise<void> {
    this._isLoading.set(true);
    this._loadingError.set(null);

    try {
      // 1. Try loading from IndexedDB first for instant startup (0ms)
      const cached = await this.readFromIndexedDB();
      if (cached && cached.words && cached.words.length > 0) {
        this._dataset.set(cached);
        this._loadSource.set('indexedDB');
        this._isLoading.set(false);
        console.log(`[WordStorage] Loaded ${cached.words.length} words instantly from IndexedDB cache.`);
        return;
      }

      // 2. Fetch from static JSON
      await this.fetchAndCacheDataset();
    } catch (err) {
      console.warn('[WordStorage] IndexedDB read notice, falling back to direct network fetch:', err);
      try {
        await this.fetchAndCacheDataset();
      } catch (fetchErr: any) {
        console.error('[WordStorage] Critical fetch error:', fetchErr);
        this._loadingError.set(fetchErr?.message || 'Erreur lors du chargement des données.');
      }
    } finally {
      this._isLoading.set(false);
    }
  }

  private async fetchAndCacheDataset(): Promise<void> {
    // Resolve URL safely according to document baseURI
    const base = (typeof document !== 'undefined' && document.baseURI) ? document.baseURI : (typeof window !== 'undefined' ? window.location.href : '/');
    const jsonUrl = new URL('data/words.json', base).href;

    console.log(`[WordStorage] Fetching dataset from: ${jsonUrl}`);
    const res = await fetch(jsonUrl, { cache: 'default' });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: Impossible de récupérer ${jsonUrl}`);
    }
    const data: WordsDataset = await res.json();
    
    if (!data || !data.words || data.words.length === 0) {
      throw new Error('Le fichier de dictionnaire est vide ou invalide.');
    }

    this._dataset.set(data);
    this._loadSource.set('network');
    this._isLoading.set(false);
    console.log(`[WordStorage] Successfully loaded ${data.words.length} words via network.`);

    // Save to IndexedDB asynchronously in the background
    this.writeToIndexedDB(data).catch(err => {
      console.warn('[WordStorage] IndexedDB write notice (app will continue smoothly in memory):', err);
    });
  }

  private openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        reject(new Error('IndexedDB not supported in this environment'));
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
      return new Promise((resolve) => {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const req = store.get(DATASET_KEY);

        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => resolve(null);
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
    } catch {
      // Ignored
    }
  }
}
