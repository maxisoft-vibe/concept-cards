export interface WordItem {
  w: string;       // Word or expression text
  d: number;       // Difficulty: 0 (Easy), 1 (Medium), 2 (Hard)
  q: number[];     // Query/Topic indices
  y?: number;      // Year if applicable
  c?: number;      // Complexity score
  cc?: number;     // Commonness score
}

export interface WordsDataset {
  version: number;
  count: number;
  themes: { [id: string]: string };
  words: WordItem[];
}

export interface ConceptCardItem {
  text: string;
  difficulty: number;
  theme?: string;
  year?: number;
  wordIndex?: number;
}

export interface ConceptCard {
  id: string;                               // Unique card hash or seed
  seed?: number;                            // Numeric seed used for generation
  timestamp: number;                        // Generation timestamp
  easy: [ConceptCardItem, ConceptCardItem, ConceptCardItem];
  medium: [ConceptCardItem, ConceptCardItem, ConceptCardItem];
  hard: [ConceptCardItem, ConceptCardItem, ConceptCardItem];
  themesSummary: string[];
}

export interface BoardIconItem {
  id: number;
  icon: string;
  title: string;
  desc: string;
  hex?: string;
}

export interface BoardSection {
  id: string;
  name: string;
  color: string;
  items: BoardIconItem[];
}
