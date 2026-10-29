import { Component, OnDestroy, OnInit } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormControl,
  FormGroup,
  ValidationErrors,
  Validators
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription, delay } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../service/auth.service';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { GetFlags } from '../../shared/clases/getFlagsOptions';

function passwordsMatchValidator(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirmPassword')?.value;
  if (!password || !confirm) {
    return null;
  }
  return password === confirm ? null : { mismatch: true };
}

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss']
})
export class ResetPasswordComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loader = false;
  loaderSubscription: Subscription | undefined;
  currentLang = 'es';
  selectedFlagUrl = 'https://flagcdn.com/es.svg';
  flagOptions = GetFlags.getFlagsOptions();
  turnstileToken = '';
  turnstileError = false;
  submitting = false;
  token = '';
  missingToken = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {
    this.form = this.fb.group(
      {
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', [Validators.required, Validators.minLength(6)]]
      },
      { validators: passwordsMatchValidator }
    );
  }

  ngOnInit(): void {
    const storedLang = localStorage.getItem('app-lang');
    this.currentLang = storedLang || 'es';
    this.translate.setDefaultLang('es');
    this.translate.use(this.currentLang);
    const activeFlag = this.flagOptions.find((flag: any) => flag.lang === this.currentLang);
    if (activeFlag) {
      this.selectedFlagUrl = activeFlag.url;
    }

    this.token = (this.route.snapshot.queryParamMap.get('token') || '').trim();
    this.missingToken = !this.token;

    this.loaderSubscription = this.loaderService
      .getLoaderState()
      .pipe(delay(0))
      .subscribe((response: any) => {
        this.loader = !!response?.state;
      });
  }

  get passwordControl(): FormControl {
    return this.form.get('password') as FormControl;
  }

  get confirmPasswordControl(): FormControl {
    return this.form.get('confirmPassword') as FormControl;
  }

  get canSubmit(): boolean {
    return (
      !this.missingToken &&
      this.form.valid &&
      !this.submitting &&
      !!this.turnstileToken
    );
  }

  get showMismatch(): boolean {
    return (
      !!this.form.hasError('mismatch') &&
      (this.confirmPasswordControl.touched || this.passwordControl.touched)
    );
  }

  onSubmit(): void {
    if (this.missingToken) {
      this.toastService.showToast(
        this.translate.instant('RESET_PASSWORD.ERROR_TITLE'),
        this.translate.instant('RESET_PASSWORD.ERROR_MISSING_TOKEN'),
        'error',
        5
      );
      return;
    }

    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const password = String(this.form.value.password || '');

    this.authService.resetPassword(this.token, password, this.turnstileToken).subscribe({
      next: (response) => {
        this.submitting = false;
        this.toastService.showToast(
          this.translate.instant('RESET_PASSWORD.SUCCESS_TITLE'),
          response?.message || this.translate.instant('RESET_PASSWORD.SUCCESS_MESSAGE'),
          'success',
          5
        );
        this.router.navigate(['/auth/login']);
      },
      error: (error) => {
        this.submitting = false;
        this.turnstileToken = '';
        const status = error?.status;
        const apiMessage = error?.error?.message;

        if (status === 429) {
          this.toastService.showToast(
            this.translate.instant('RESET_PASSWORD.ERROR_TITLE'),
            apiMessage || this.translate.instant('RESET_PASSWORD.ERROR_RATE_LIMIT'),
            'error',
            6
          );
          return;
        }

        if (status === 400) {
          this.toastService.showToast(
            this.translate.instant('RESET_PASSWORD.ERROR_TITLE'),
            apiMessage || this.translate.instant('RESET_PASSWORD.ERROR_INVALID_TOKEN'),
            'error',
            6
          );
          return;
        }

        this.toastService.showToast(
          this.translate.instant('RESET_PASSWORD.ERROR_TITLE'),
          apiMessage || this.translate.instant('RESET_PASSWORD.ERROR_GENERIC'),
          'error',
          5
        );
      }
    });
  }

  onTurnstileToken(token: string): void {
    this.turnstileToken = token || '';
    this.turnstileError = false;
  }

  onTurnstileError(): void {
    this.turnstileToken = '';
    this.turnstileError = true;
  }

  setFlag(flag: any): void {
    this.selectedFlagUrl = flag.url;
    this.currentLang = flag.lang;
    localStorage.setItem('app-lang', flag.lang);
    this.translate.use(flag.lang);
  }

  ngOnDestroy(): void {
    this.loaderSubscription?.unsubscribe();
  }
}
