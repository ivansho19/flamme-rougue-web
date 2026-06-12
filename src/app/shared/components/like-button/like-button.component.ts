import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-like-button',
  templateUrl: './like-button.component.html',
  styleUrls: ['./like-button.component.scss']
})
export class LikeButtonComponent {
  /** Número actual de likes */
  @Input() likeCount: number = 0;

  /** Si el usuario ya dio like */
  @Input() isActive: boolean = false;

  /** Mensaje de error a mostrar debajo del botón */
  @Input() errorMessage: string = '';

  /** Emite cuando el usuario hace click en el botón */
  @Output() likeToggled = new EventEmitter<void>();

  animating = false;

  onClick(): void {
    this.animating = true;
    setTimeout(() => { this.animating = false; }, 1150);
    this.likeToggled.emit();
  }
}
