import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { IAuthRequest } from '../../models/IAuth.model';
import { GetCountries } from '../../../../shared/clases/getCountries';

interface Country {
    code: string;
    name: string;
    cities: string[];
}

@Component({
    selector: 'app-advertisers-register-form',
    standalone: false,
    templateUrl: './advertisers-register-form.component.html',
    styleUrls: ['./advertisers-register-form.component.scss']
})
export class AdvertisersRegisterFormComponent implements OnInit {
    countries: Country[] = [];
    cities: string[] = [];
    anuncianteForm: FormGroup;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.anuncianteForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
            country: ['', [Validators.required]],
            city: ['', [Validators.required]],
            phone: ['', [Validators.required, Validators.minLength(7), Validators.pattern('^[0-9]+$')]],
            gender: ['', [Validators.required, Validators.minLength(2)]],
        }, {
            validators: this.passwordMatchValidator
        });
    }
    ngOnInit(): void {
        this.countries = GetCountries.getAllCountries();
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

    onCountryChange(event: Event) {
        const code = (event.target as HTMLSelectElement).value;
        const found = this.countries.find(c => c.code === code);
        this.cities = found ? found.cities : [];
        this.anuncianteForm.get('city')?.setValue('');
    }

    onSubmitUser() {
        const { name, lastName, email, password, gender, city, country, phone } = this.anuncianteForm.value;
        if (this.anuncianteForm.valid) {
            // Aquí iría la lógica de registro
            const req: IAuthRequest = { 
                name,
                lastName,
                email,
                password,
                country,
                city,
                gender,
                phone
            }
            this.authService.registerClient(req).subscribe({
                next: (response) => {
                    console.log('Registro exitoso:', response);
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.name));
                    localStorage.setItem('userEmail', email);
                    this.router.navigate(['/create-profile'], { queryParams: { email } }); // Redirige a la página de culminar el registro y publicar el perfil
                },
                error: (error) => {
                    console.error('Error en el registro:', error);
                }
            });
        }
    }

    get name() {
        return this.anuncianteForm.get('name');
    }

    get email() {
        return this.anuncianteForm.get('email');
    }

    get password(): FormControl {
        return this.anuncianteForm.get('password') as FormControl;
    }

    get confirmPassword(): FormControl {
        return this.anuncianteForm.get('confirmPassword') as FormControl;
    }


}
