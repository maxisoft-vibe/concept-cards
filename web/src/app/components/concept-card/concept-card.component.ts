import { Component, input, output, signal, ChangeDetectionStrategy } from '@angular/core';
import { ConceptCard } from '../../models/concept.models';

@Component({
  selector: 'app-concept-card',
  templateUrl: './concept-card.component.html',
  styleUrls: ['./concept-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ConceptCardComponent {
  readonly card = input.required<ConceptCard>();
  readonly showDetails = input<boolean>(false);
  readonly activeWordIndex = input<number | null>(null);
  readonly selectWord = output<number>();

  copied = signal<boolean>(false);

  onItemClick(num: number): void {
    this.selectWord.emit(num);
  }
}
