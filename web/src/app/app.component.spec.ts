import { describe, it, expect, beforeEach } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { CardHistoryService } from './services/card-history.service';
import { WordStorageService } from './services/word-storage.service';
import { signal } from '@angular/core';

describe('AppComponent', () => {
  beforeEach(async () => {
    const mockHistory = {
      currentCard: signal(null)
    };
    const mockStorage = {
      isLoaded: signal(false),
      isLoading: signal(false),
      totalWordsCount: signal(0),
      loadSource: signal('network')
    };

    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [
        provideRouter([]),
        { provide: CardHistoryService, useValue: mockHistory },
        { provide: WordStorageService, useValue: mockStorage }
      ]
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should have the Concept title', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toContain('Concept');
  });
});
