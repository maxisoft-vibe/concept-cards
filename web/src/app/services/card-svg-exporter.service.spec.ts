import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TestBed } from '@angular/core/testing';
import { CardSvgExporterService } from './card-svg-exporter.service';
import { ConceptCard } from '../models/concept.models';

describe('CardSvgExporterService', () => {
  let service: CardSvgExporterService;

  const mockCard: ConceptCard = {
    id: 'test123',
    seed: 12345,
    timestamp: Date.now(),
    easy: [
      { text: 'Tom & Jerry <Special>', difficulty: 0 },
      { text: 'Chat "Mignon"', difficulty: 0 },
      { text: 'Titanic', difficulty: 0, year: 1997 }
    ],
    medium: [
      { text: 'Tour Eiffel', difficulty: 1, year: 1889 },
      { text: 'Victor Hugo', difficulty: 1 },
      { text: 'Football', difficulty: 1 }
    ],
    hard: [
      { text: 'Croissant', difficulty: 2 },
      { text: 'Photosynthèse', difficulty: 2 },
      { text: 'Relativité', difficulty: 2, year: 1915 }
    ],
    themesSummary: ['Cinéma', 'Histoire']
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [CardSvgExporterService]
    });
    service = TestBed.inject(CardSvgExporterService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should generate a valid SVG document with correct dimensions', () => {
    const svg = service.generateCardSvg(mockCard);

    expect(svg).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 480 660"');
    expect(svg).toContain('width="480"');
    expect(svg).toContain('height="660"');
  });

  it('should escape XML entities properly to avoid invalid SVG syntax', () => {
    const svg = service.generateCardSvg(mockCard);

    expect(svg).toContain('Tom &amp; Jerry &lt;Special&gt;');
    expect(svg).toContain('Chat &quot;Mignon&quot;');
    expect(svg).not.toContain('Tom & Jerry <Special>');
  });

  it('should include year formatting and card watermark ID', () => {
    const svg = service.generateCardSvg(mockCard);

    expect(svg).toContain('Titanic (1997)');
    expect(svg).toContain('Tour Eiffel (1889)');
    expect(svg).toContain('Relativité (1915)');
    expect(svg).toContain('CONCEPT • #test123');
  });

  it('should trigger browser download with correct filename', () => {
    const createElementSpy = vi.spyOn(document, 'createElement');
    const appendChildSpy = vi.spyOn(document.body, 'appendChild');
    const removeChildSpy = vi.spyOn(document.body, 'removeChild');

    // Mock URL.createObjectURL and revokeObjectURL
    const mockUrl = 'blob:http://localhost/test-blob-url';
    globalThis.URL.createObjectURL = vi.fn().mockReturnValue(mockUrl);
    globalThis.URL.revokeObjectURL = vi.fn();

    service.downloadCardAsSvg(mockCard);

    expect(createElementSpy).toHaveBeenCalledWith('a');
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
    expect(globalThis.URL.revokeObjectURL).toHaveBeenCalledWith(mockUrl);
  });
});
