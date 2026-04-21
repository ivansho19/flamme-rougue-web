import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { IAuthRequest } from '../../models/IAuth.model';
import { GetCountries } from '../../../../shared/clases/getCountries';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../../../shared/clases/getFlagsOptions';

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
    currentLang = 'es';
    selectedFlagUrl = 'https://flagcdn.com/es.svg';
    flagOptions = GetFlags.getFlagsOptions();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private translate: TranslateService
    ) {
        this.anuncianteForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', [Validators.required]],
        }, {
            validators: this.passwordMatchValidator
        });
    }
    ngOnInit(): void {
        const storedLang = localStorage.getItem('app-lang');
        this.currentLang = storedLang || 'es';
        this.translate.setDefaultLang('es');
        this.translate.use(this.currentLang);
        const activeFlag = this.flagOptions.find((flag: { url: string; label: string; lang: string }) => flag.lang === this.currentLang);
        if (activeFlag) {
            this.selectedFlagUrl = activeFlag.url;
        }
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
        const { name, lastName, email, password } = this.anuncianteForm.value;
        if (this.anuncianteForm.valid) {
            // Aquí iría la lógica de registro
            const req: IAuthRequest = { 
                name,
                lastName,
                email,
                password
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

    setFlag(flag: { url: string; label: string; lang: string }) {
        this.selectedFlagUrl = flag.url;
        this.currentLang = flag.lang;
        localStorage.setItem('app-lang', flag.lang);
        this.translate.use(flag.lang);
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
