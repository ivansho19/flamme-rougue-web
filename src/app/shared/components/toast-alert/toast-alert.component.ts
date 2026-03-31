import { Component, Inject, Input, Optional } from '@angular/core';
import { MAT_SNACK_BAR_DATA, MatSnackBarRef } from '@angular/material/snack-bar';

@Component({
  selector: 'app-toast-alert',
  templateUrl: './toast-alert.component.html',
  styleUrls: ['./toast-alert.component.scss']
})
export class ToastAlertComponent {
  @Input() message = '';
  @Input() title = '';
  @Input() type: 'success' | 'error' = 'success';

  constructor(
    @Optional() @Inject(MAT_SNACK_BAR_DATA)
    data?: { title?: string; message?: string; type?: 'success' | 'error' },
    @Optional() private snackBarRef?: MatSnackBarRef<ToastAlertComponent>
  ) {
    if (data) {
      this.title = data.title ?? this.title;
      this.message = data.message ?? this.message;
      this.type = data.type ?? this.type;
    }
  }

  get isVisible(): boolean {
    return this.message.trim().length > 0;
  }

  close(): void {
    this.snackBarRef?.dismiss();
  }
}
