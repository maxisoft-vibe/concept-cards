import { Component, inject, signal, HostListener, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardHistoryService } from '../../services/card-history.service';
import { WordStorageService } from '../../services/word-storage.service';
import { CardSvgExporterService } from '../../services/card-svg-exporter.service';
import { ConceptCardComponent } from '../../components/concept-card/concept-card.component';

@Component({
  selector: 'app-card-generator',
  standalone: true,
  imports: [CommonModule, ConceptCardComponent],
  templateUrl: './card-generator.component.html',
  styleUrls: ['./card-generator.component.scss']
})
export class CardGeneratorComponent {
  readonly history = inject(CardHistoryService);
  readonly storage = inject(WordStorageService);
  readonly svgExporter = inject(CardSvgExporterService);

  showThemes = signal<boolean>(false);
  selectedWordIndex = signal<number | null>(null);
  toastMessage = signal<string | null>(null);
  private toastTimeout: any;

  // Animation state
  animClass = signal<'anim-slide-left' | 'anim-slide-right' | 'anim-deal'>('anim-deal');
  animKey = signal<number>(0);

  // Touch gesture handling
  private touchStartX = 0;
  private touchStartY = 0;

  constructor() {
    // Whenever the card ID changes, trigger the deal/slide animation
    effect(() => {
      const card = this.history.currentCard();
      if (card) {
        this.triggerCardAnimation();
      }
    });
  }

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    if (event.code === 'Space' || event.code === 'ArrowRight') {
      if ((event.target as HTMLElement)?.tagName !== 'INPUT') {
        event.preventDefault();
        this.onNextOrNew();
      }
    } else if (event.code === 'ArrowLeft') {
      if ((event.target as HTMLElement)?.tagName !== 'INPUT') {
        event.preventDefault();
        this.onPrevious();
      }
    }
  }

  @HostListener('touchstart', ['$event'])
  handleTouchStart(event: TouchEvent): void {
    if (event.touches.length === 1) {
      this.touchStartX = event.touches[0].clientX;
      this.touchStartY = event.touches[0].clientY;
    }
  }

  @HostListener('touchend', ['$event'])
  handleTouchEnd(event: TouchEvent): void {
    if (event.changedTouches.length === 1) {
      const deltaX = event.changedTouches[0].clientX - this.touchStartX;
      const deltaY = event.changedTouches[0].clientY - this.touchStartY;

      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 90) {
        if (deltaX < 0) {
          // Swipe Left -> Next / New
          this.onNextOrNew();
        } else {
          // Swipe Right -> Previous
          this.onPrevious();
        }
      }
    }
  }

  onGenerateNew(): void {
    this.animClass.set('anim-slide-left');
    this.selectedWordIndex.set(null);
    this.history.generateNewCard();
    this.showToast('Nouvelle carte générée !');
  }

  onPrevious(): void {
    if (this.history.canGoBack()) {
      this.animClass.set('anim-slide-right');
      this.selectedWordIndex.set(null);
      this.history.goToPrevious();
      this.showToast('Carte précédente');
    }
  }

  onNextOrNew(): void {
    this.animClass.set('anim-slide-left');
    this.selectedWordIndex.set(null);
    if (this.history.canGoForward()) {
      this.history.goToNext();
      this.showToast('Carte suivante');
    } else {
      this.history.generateNewCard();
      this.showToast('Nouvelle carte générée !');
    }
  }

  trackByCardId(index: number, card: any): string {
    return card?.id ?? String(index);
  }

  private triggerCardAnimation(): void {
    this.animKey.update(k => k + 1);
  }

  toggleThemes(): void {
    this.showThemes.update(v => !v);
  }

  onSelectWord(index: number): void {
    if (this.selectedWordIndex() === index) {
      this.selectedWordIndex.set(null);
    } else {
      this.selectedWordIndex.set(index);
    }
  }

  getSelectedWordItem(): { text: string; theme?: string; year?: number } | null {
    const card = this.history.currentCard();
    const idx = this.selectedWordIndex();
    if (!card || idx === null) return null;

    if (idx >= 1 && idx <= 3) {
      return card.easy[idx - 1] ?? null;
    } else if (idx >= 4 && idx <= 6) {
      return card.medium[idx - 4] ?? null;
    } else if (idx >= 7 && idx <= 9) {
      return card.hard[idx - 7] ?? null;
    }
    return null;
  }

  getDuckDuckGoSearchUrl(): string {
    const item = this.getSelectedWordItem();
    if (!item) return '#';

    // Search for word + year if present
    const query = item.year ? `${item.text} ${item.year}` : item.text;
    
    // Privacy-preserving parameters:
    // kl=fr-fr : French region
    // ia=web : Instant Answer / DuckAssist AI activated
    // k1=-1 : Ads disabled / non-tracking param
    // kd=-1 : Disable search suggest telemetry
    // kn=1 : Open in new tab
    const params = new URLSearchParams({
      q: query,
      kl: 'fr-fr',
      ia: 'web',
      k1: '-1',
      kd: '-1'
    });

    return `https://duckduckgo.com/?${params.toString()}`;
  }

  downloadSvg(): void {
    const card = this.history.currentCard();
    if (!card) return;
    this.svgExporter.downloadCardAsSvg(card);
    this.showToast('Téléchargement du SVG lancé !');
  }

  async copyShareLink(): Promise<void> {
    const card = this.history.currentCard();
    if (!card) return;

    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      this.showToast('Lien de la carte copié !');
    } catch {
      this.showToast('Lien : ' + url);
    }
  }

  private showToast(msg: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2000);
  }
}
