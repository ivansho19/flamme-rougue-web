import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirm-action-modal',
  templateUrl: './confirm-action-modal.component.html',
  styleUrls: ['./confirm-action-modal.component.scss']
})
export class ConfirmActionModalComponent {
  @Input() isOpen = false;
  @Input() title = 'Confirmar accion';
  @Input() message = '';
  @Input() confirmLabel = 'Continuar';
  @Input() cancelLabel = 'Cancelar';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  onConfirm(): void {
    this.confirm.emit();
  }

  onCancel(): void {
    this.cancel.emit();
  }
}
