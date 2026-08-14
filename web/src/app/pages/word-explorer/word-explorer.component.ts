import { Component, inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WordStorageService } from '../../services/word-storage.service';

@Component({
  selector: 'app-word-explorer',
  imports: [FormsModule, DecimalPipe],
  templateUrl: './word-explorer.component.html',
  styleUrls: ['./word-explorer.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class WordExplorerComponent {
  readonly storage = inject(WordStorageService);

  searchTerm = signal<string>('');
  selectedDifficulty = signal<number | null>(null); // null = all, 0 = easy, 1 = med, 2 = hard
  selectedTheme = signal<number | null>(null); // null = all
  currentPage = signal<number>(1);
  pageSize = 50;

  readonly themesList = computed(() => {
    const th = this.storage.themes();
    return Object.entries(th).map(([k, v]) => ({ id: parseInt(k, 10), title: v })).sort((a, b) => a.title.localeCompare(b.title));
  });

  readonly filteredWords = computed(() => {
    const ds = this.storage.dataset();
    if (!ds) return [];

    let list = ds.words;
    const term = this.searchTerm().trim().toLowerCase();
    const diff = this.selectedDifficulty();
    const theme = this.selectedTheme();

    if (diff !== null) {
      list = list.filter(w => w.d === diff);
    }

    if (theme !== null) {
      list = list.filter(w => w.q && w.q.includes(theme));
    }

    if (term) {
      list = list.filter(w => w.w.toLowerCase().includes(term));
    }

    return list;
  });

  readonly totalFilteredCount = computed(() => this.filteredWords().length);
  readonly totalPages = computed(() => Math.ceil(this.totalFilteredCount() / this.pageSize) || 1);

  readonly paginatedWords = computed(() => {
    const list = this.filteredWords();
    const page = this.currentPage();
    const start = (page - 1) * this.pageSize;
    return list.slice(start, start + this.pageSize);
  });

  setDifficulty(d: number | null): void {
    this.selectedDifficulty.set(d);
    this.currentPage.set(1);
  }

  onThemeChange(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    this.selectedTheme.set(val === '' ? null : parseInt(val, 10));
    this.currentPage.set(1);
  }

  onSearchChange(): void {
    this.currentPage.set(1);
  }

  goToPage(p: number): void {
    if (p >= 1 && p <= this.totalPages()) {
      this.currentPage.set(p);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  getDifficultyLabel(d: number): string {
    switch (d) {
      case 0: return 'Facile';
      case 1: return 'Moyen';
      case 2: return 'Difficile';
      default: return '';
    }
  }
}
