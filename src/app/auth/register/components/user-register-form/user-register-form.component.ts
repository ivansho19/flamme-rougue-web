import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../../../shared/clases/getFlagsOptions';

@Component({
    selector: 'app-user-register-form',
    standalone: false,
    templateUrl: './user-register-form.component.html',
    styleUrls: ['./user-register-form.component.scss']
})
export class UserRegisterFormComponent implements OnInit {

    userForm: FormGroup;
    anuncianteForm: FormGroup
    currentLang = 'es';
    selectedFlagUrl = 'https://flagcdn.com/es.svg';
    flagOptions = GetFlags.getFlagsOptions();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private translate: TranslateService
    ) {
        this.userForm = this.fb.group({
            name: ['', [Validators.required, Validators.minLength(2)]],
            lastName: ['', [Validators.required, Validators.minLength(2)]],
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

    ngOnInit(): void {
        const storedLang = localStorage.getItem('app-lang');
        this.currentLang = storedLang || 'es';
        this.translate.setDefaultLang('es');
        this.translate.use(this.currentLang);
        const activeFlag = this.flagOptions.find((flag: { url: string; label: string; lang: string }) => flag.lang === this.currentLang);
        if (activeFlag) {
            this.selectedFlagUrl = activeFlag.url;
        }
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

    onSubmitUser() {
        const { name, lastName, email, password } = this.userForm.value;
        if (this.userForm.valid) {
            // Aquí iría la lógica de registro
            this.authService.registerUser(name, lastName, email, password).subscribe({
                next: (response) => {
                    console.log('Registro exitoso:', response);
                    localStorage.setItem('token', response.token);
                    localStorage.setItem('user', JSON.stringify(response.name));
                    localStorage.setItem('userEmail', email);
                    localStorage.setItem('userId', response._id);
                    localStorage.setItem('client', 'false');
                    this.router.navigate(['/home']);
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

    get name(): FormControl {
        return this.userForm.get('name') as FormControl;
    }

    get email(): FormControl {
        return this.userForm.get('email') as FormControl;
    }

    get password(): FormControl {
        return this.userForm.get('password') as FormControl;
    }

    get confirmPassword(): FormControl {
        return this.userForm.get('confirmPassword') as FormControl;
    }


}
