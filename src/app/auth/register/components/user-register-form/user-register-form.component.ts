import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../service/auth.service';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../../../shared/clases/getFlagsOptions';
import { CfTurnstileComponent } from '../../../../shared/components/cf-turnstile/cf-turnstile.component';
import { ToastService } from '../../../../shared/services/toast/toast.service';

@Component({
    selector: 'app-user-register-form',
    standalone: false,
    templateUrl: './user-register-form.component.html',
    styleUrls: ['./user-register-form.component.scss']
})
export class UserRegisterFormComponent implements OnInit {
    @ViewChild(CfTurnstileComponent) turnstile?: CfTurnstileComponent;

    userForm: FormGroup;
    anuncianteForm: FormGroup;
    currentLang = 'es';
    selectedFlagUrl = 'https://flagcdn.com/es.svg';
    flagOptions = GetFlags.getFlagsOptions();
    cfTurnstileToken = '';
    turnstileError = false;
    submitting = false;

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService,
        private translate: TranslateService,
        private toastService: ToastService
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

    onTurnstileToken(token: string): void {
        this.cfTurnstileToken = token || '';
        this.turnstileError = false;
    }

    onTurnstileError(): void {
        this.cfTurnstileToken = '';
        this.turnstileError = true;
    }

    onSubmitUser() {
        if (this.userForm.invalid || this.submitting) {
            this.userForm.markAllAsTouched();
            return;
        }

        if (!this.cfTurnstileToken) {
            this.toastService.showToast(
                this.translate.instant('REGISTER_FORM.TURNSTILE_REQUIRED_TITLE'),
                this.translate.instant('REGISTER_FORM.TURNSTILE_REQUIRED'),
                'error',
                4
            );
            return;
        }

        const { name, lastName, email, password } = this.userForm.value;
        this.submitting = true;

        this.authService.registerUser(name, lastName, email, password).subscribe({
            next: (response) => {
                localStorage.setItem('token', response.token);
                localStorage.setItem('user', JSON.stringify(response.name));
                localStorage.setItem('userEmail', email);
                localStorage.setItem('userId', response._id);
                localStorage.setItem('client', 'false');
                this.submitting = false;
                this.router.navigate(['/home']);
            },
            error: (error) => {
                console.error('Error en el registro:', error);
                this.submitting = false;
                this.cfTurnstileToken = '';
                this.turnstile?.reset();
                const code = error?.error?.code;
                const messageKey = code === 'TURNSTILE_FAILED' || code === 'TURNSTILE_REQUIRED'
                    ? 'REGISTER_FORM.TURNSTILE_FAILED'
                    : 'REGISTER_FORM.REGISTER_ERROR';
                this.toastService.showToast(
                    this.translate.instant('REGISTER_FORM.REGISTER_ERROR_TITLE'),
                    error?.error?.message || this.translate.instant(messageKey),
                    'error',
                    5
                );
            }
        });
    }

    setFlag(flag: { url: string; label: string; lang: string }) {
        this.selectedFlagUrl = flag.url;
        this.currentLang = flag.lang;
        localStorage.setItem('app-lang', flag.lang);
        this.translate.use(flag.lang);
        this.cfTurnstileToken = '';
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

    get canSubmit(): boolean {
        return this.userForm.valid  && !this.submitting
        // && !!this.cfTurnstileToken
        ;
    }
}
