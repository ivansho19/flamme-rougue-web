import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ToastAlertComponent } from '../../components/toast-alert/toast-alert.component';

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  constructor(private snackBar: MatSnackBar) {}

  showToast(
    title: string,
    message: string,
    type: 'error' | 'success' = 'error',
    duration = 3
  ) {
    this.snackBar.openFromComponent(ToastAlertComponent, {
      data: { title, message, type },
      duration: duration * 1000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: 'toast-snackbar'
    });
  }
}
