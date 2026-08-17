import { Component, inject, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UpdateService } from '../../services/update.service';

@Component({
  selector: 'app-update-toast',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './update-toast.component.html',
  styleUrl: './update-toast.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UpdateToastComponent {
  readonly updateService = inject(UpdateService);

  readonly isVisible = computed(() => this.updateService.updateAvailable());

  readonly message = computed(() => {
    const reason = this.updateService.updateReason();
    const remote = this.updateService.remoteVersion();
    const count = remote?.wordsCount || 6175;

    if (reason === 'dataset') {
      return `Nouveau dictionnaire disponible (${count.toLocaleString('fr-FR')} mots curatés)`;
    } else if (reason === 'both') {
      return `Mise à jour disponible (${count.toLocaleString('fr-FR')} mots & améliorations)`;
    }
    return `Nouvelle version de l'application disponible`;
  });

  onRefresh(): void {
    this.updateService.applyUpdate();
  }

  onDismiss(): void {
    this.updateService.dismiss();
  }
}
