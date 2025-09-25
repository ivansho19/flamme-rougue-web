import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { last } from 'rxjs';

@Component({
    selector: 'app-user-register-form',
    standalone: false,
    templateUrl: './user-register-form.component.html',
    styleUrls: ['./user-register-form.component.scss']
})
export class UserRegisterFormComponent {

    userForm: FormGroup;
    anuncianteForm: FormGroup

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.userForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastname: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });

        this.anuncianteForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]]
        }, {
            validators: this.passwordMatchValidator
        });
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');

        if (password && confirmPassword && password.value !== confirmPassword.value) {
            confirmPassword.setErrors({ passwordMismatch: true });
        } else {
            confirmPassword?.setErrors(null);
        }

        return null;
    }

    onSubmitAnunciante() {
        if (this.anuncianteForm.valid) {
            // Aquí iría la lógica de registro para anunciante
            console.log('Anunciante form submitted:', this.anuncianteForm.value);
        }
    }

    onSubmitUser() {
        debugger;
        const { name, email, password } = this.userForm.value;
        if (this.userForm.valid) {
            // Aquí iría la lógica de registro
            this.authService.registerUser(name, email, password).subscribe({
                next: (response) => {
                    console.log('Registro exitoso:', response);
                    // Redirigir o realizar acciones adicionales
                },
                error: (error) => {
                    console.error('Error en el registro:', error);
                }
            });
        }
    }

    get name() {
        return this.userForm.get('name');
    }

    get email() {
        return this.userForm.get('email');
    }

    get password() {
        return this.userForm.get('password');
    }

    get confirmPassword() {
        return this.userForm.get('confirmPassword');
    }


}
