import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { trigger, style, animate, transition } from '@angular/animations';
import { GetUserName } from '../../clases/getUserName';

@Component({
  selector: 'app-logout-confirm-dialog',
  templateUrl: './logout-confirm-dialog.component.html',
  styleUrls: ['./logout-confirm-dialog.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [ // Animación al aparecer
        style({ opacity: 0, transform: 'scale(0.9)' }),
        animate('250ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [ // Animación al cerrar
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.9)' }))
      ])
    ])
  ]
})
export class LogoutConfirmDialogComponent {

  userName: string | null = null;

  constructor(
    private dialogRef: MatDialogRef<LogoutConfirmDialogComponent>
  ) {
    this.userName = new GetUserName().getUserName();
  }

  onConfirm(): void {
    this.dialogRef.close(true);
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }
}
