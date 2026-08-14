import { Component, inject, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { TrianglifyBackgroundComponent } from './components/trianglify-background/trianglify-background.component';
import { CardHistoryService } from './services/card-history.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, HeaderComponent, TrianglifyBackgroundComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class AppComponent {
  readonly history = inject(CardHistoryService);
  title = 'Concept - Générateur de Cartes';
}
