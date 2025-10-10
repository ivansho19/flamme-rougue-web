import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.scss']
})
export class WarningDialogComponent {
  constructor(public dialogRef: MatDialogRef<WarningDialogComponent>) {}

  onAccept(): void {
  localStorage.setItem('adult-consent', 'true');
  this.dialogRef.close(true);
}

  onSettings(): void {
    this.dialogRef.close('settings');
  }
}