import { Component, Input } from '@angular/core';
import { FormControl } from '@angular/forms';

@Component({
  selector: 'app-input-custom',
  templateUrl: './custom-input.component.html',
  styleUrls: ['./custom-input.component.scss']
})
export class InputCustomComponent {
  @Input() type: string = 'text';
  @Input() placeholder: string = '';
  @Input() controles!: FormControl;
  @Input() name: string = '';
  showPassword: boolean = false;

  get inputType() {
    return this.type === 'password' ? (this.showPassword ? 'text' : 'password') : this.type;
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }
}