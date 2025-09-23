import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../service/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private authService: AuthService, private router: Router) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6) // mínimo 6 caracteres
      ]]
    });
  }

  onSubmit() {
    if (this.loginForm.valid) {
      debugger
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso:', response);
          // Redirigir o realizar acciones adicionales
        },
        error: (error) => {
          console.error('Error en el inicio de sesión:', error);
        }
      });
    } else {
      this.loginForm.markAllAsTouched(); // Marca todos los campos para mostrar errores
    }
  }
}
