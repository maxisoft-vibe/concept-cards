import { Routes } from '@angular/router';
import { CardGeneratorComponent } from './pages/card-generator/card-generator.component';
import { WordExplorerComponent } from './pages/word-explorer/word-explorer.component';

export const routes: Routes = [
  { path: '', component: CardGeneratorComponent, title: 'Concept - Générateur de Cartes' },
  { path: 'explorer', component: WordExplorerComponent, title: 'Concept - Dictionnaire des 8 695 mots' },
  { path: '**', redirectTo: '' }
];
