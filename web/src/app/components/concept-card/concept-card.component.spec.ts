import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ConceptCardComponent } from './concept-card.component';
import { ConceptCard } from '../../models/concept.models';

describe('ConceptCardComponent', () => {
  let component: ConceptCardComponent;
  let fixture: ComponentFixture<ConceptCardComponent>;

  const mockCard: ConceptCard = {
    id: 'test01',
    seed: 42,
    timestamp: Date.now(),
    easy: [
      { text: 'Chien', difficulty: 0, theme: 'Animaux' },
      { text: 'Chat', difficulty: 0, theme: 'Animaux' },
      { text: 'Oiseau', difficulty: 0 }
    ],
    medium: [
      { text: 'Titanic', difficulty: 1, year: 1997 },
      { text: 'Inception', difficulty: 1, year: 2010 },
      { text: 'Avatar', difficulty: 1 }
    ],
    hard: [
      { text: 'Einstein', difficulty: 2 },
      { text: 'Newton', difficulty: 2 },
      { text: 'Curie', difficulty: 2 }
    ],
    themesSummary: ['Animaux', 'Cinéma']
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConceptCardComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ConceptCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('card', mockCard);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit selectWord when an item is clicked', () => {
    const spy = vi.spyOn(component.selectWord, 'emit');
    component.onItemClick(4);
    expect(spy).toHaveBeenCalledWith(4);
  });
});
