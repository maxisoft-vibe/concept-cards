import { Component, Input, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConceptCard } from '../../models/concept.models';

@Component({
  selector: 'app-concept-card',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './concept-card.component.html',
  styleUrls: ['./concept-card.component.scss']
})
export class ConceptCardComponent {
  @Input({ required: true }) card!: ConceptCard;
  @Input() showDetails = false;
  @Input() activeWordIndex: number | null = null;
  @Output() selectWord = new EventEmitter<number>();

  copied = signal<boolean>(false);

  onItemClick(num: number): void {
    this.selectWord.emit(num);
  }
}
