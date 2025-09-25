import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: false,
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  activeSection: 'choose' | 'usuario' | 'anunciante' = 'choose';
 
  handleActivateSection(section: 'choose' | 'usuario' | 'anunciante') {
    this.activeSection = section;
  }

}
