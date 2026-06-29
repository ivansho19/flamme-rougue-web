import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';

@Component({
  selector: 'app-warning-dialog',
  templateUrl: './warning-dialog.component.html',
  styleUrls: ['./warning-dialog.component.scss']
})
export class WarningDialogComponent {
  constructor(public dialogRef: MatDialogRef<WarningDialogComponent>, private router: Router) {}

  onAccept(): void {
  localStorage.setItem('adult-consent', 'true');
  this.dialogRef.close(true);
}

  onSettings(): void {
    localStorage.setItem('adult-consent', 'false');
    this.dialogRef.close(true);
    this.router.navigate(['/auth/login']);
  }
}