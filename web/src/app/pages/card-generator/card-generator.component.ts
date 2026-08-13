import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CardHistoryService } from '../../services/card-history.service';
import { WordStorageService } from '../../services/word-storage.service';
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

  showThemes = signal<boolean>(false);
  selectedWordIndex = signal<number | null>(null);
  toastMessage = signal<string | null>(null);
  private toastTimeout: any;

  // Touch gesture handling
  private touchStartX = 0;
  private touchStartY = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent): void {
    // Space or ArrowRight -> New / Next card
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

      // Check horizontal swipe (min 50px delta and not a vertical scroll)
      if (Math.abs(deltaX) > 60 && Math.abs(deltaY) < 80) {
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
    this.selectedWordIndex.set(null);
    this.history.generateNewCard();
    this.showToast('Nouvelle carte générée !');
  }

  onPrevious(): void {
    if (this.history.canGoBack()) {
      this.selectedWordIndex.set(null);
      this.history.goToPrevious();
      this.showToast('Carte précédente');
    }
  }

  onNextOrNew(): void {
    this.selectedWordIndex.set(null);
    if (this.history.canGoForward()) {
      this.history.goToNext();
      this.showToast('Carte suivante');
    } else {
      this.history.generateNewCard();
      this.showToast('Nouvelle carte générée !');
    }
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

  async copyShareLink(): Promise<void> {
    const card = this.history.currentCard();
    if (!card) return;

    const url = window.location.href;
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older web views
        const textArea = document.createElement('textarea');
        textArea.value = url;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      this.showToast('Lien de la carte copié dans le presse-papier !');
    } catch {
      this.showToast('Lien : ' + url);
    }
  }

  private showToast(msg: string): void {
    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastMessage.set(msg);
    this.toastTimeout = setTimeout(() => {
      this.toastMessage.set(null);
    }, 2200);
  }
}
