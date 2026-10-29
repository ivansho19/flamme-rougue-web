import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Subscription, delay } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from '../service/auth.service';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { GetFlags } from '../../shared/clases/getFlagsOptions';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  form: FormGroup;
  loader = false;
  loaderSubscription: Subscription | undefined;
  currentLang = 'es';
  selectedFlagUrl = 'https://flagcdn.com/es.svg';
  flagOptions = GetFlags.getFlagsOptions();
  turnstileToken = '';
  turnstileError = false;
  submitting = false;
  sent = false;
  successMessage = '';
  /** Present in non-production API responses for QA. */
  resetUrl: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private translate: TranslateService
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
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
    this.loaderSubscription = this.loaderService
      .getLoaderState()
      .pipe(delay(0))
      .subscribe((response: any) => {
        this.loader = !!response?.state;
      });
  }

  get emailControl(): FormControl {
    return this.form.get('email') as FormControl;
  }

  get canSubmit(): boolean {
    return this.form.valid && !this.submitting && !!this.turnstileToken;
  }

  onSubmit(): void {
    if (!this.canSubmit) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting = true;
    const email = String(this.form.value.email || '').trim();

    this.authService.forgotPassword(email, this.turnstileToken).subscribe({
      next: (response) => {
        this.submitting = false;
        this.sent = true;
        this.successMessage =
          response?.message ||
          this.translate.instant('FORGOT_PASSWORD.SUCCESS_GENERIC');
        this.resetUrl = response?.resetUrl || null;
        this.turnstileToken = '';
      },
      error: (error) => {
        this.submitting = false;
        this.turnstileToken = '';
        const status = error?.status;
        const apiMessage = error?.error?.message;

        if (status === 429) {
          this.toastService.showToast(
            this.translate.instant('FORGOT_PASSWORD.ERROR_TITLE'),
            apiMessage || this.translate.instant('FORGOT_PASSWORD.ERROR_RATE_LIMIT'),
            'error',
            6
          );
          return;
        }

        if (status === 400) {
          this.toastService.showToast(
            this.translate.instant('FORGOT_PASSWORD.ERROR_TITLE'),
            apiMessage || this.translate.instant('FORGOT_PASSWORD.ERROR_INVALID'),
            'error',
            5
          );
          return;
        }

        this.toastService.showToast(
          this.translate.instant('FORGOT_PASSWORD.ERROR_TITLE'),
          apiMessage || this.translate.instant('FORGOT_PASSWORD.ERROR_GENERIC'),
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
