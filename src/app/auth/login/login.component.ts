import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../shared/clases/getFlagsOptions';
import { NotificationsService } from '../../shared/services/notifications/notifications.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm: FormGroup;
  loader: boolean = false;
  loaderSubscription: Subscription | undefined;
  showPassword: boolean = false;
  currentLang = 'es';
  turnstileToken: string = '';
  turnstileError: boolean = false;
  selectedFlagUrl = 'https://flagcdn.com/es.svg';
  flagOptions = GetFlags.getFlagsOptions();
  submitting = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private loaderService: LoaderService,
    private toastService: ToastService,
    private translate: TranslateService,
    private notificationsService: NotificationsService
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
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
    this.showLoader();
  }

  get passwordControl(): FormControl {
    return this.loginForm.get('password') as FormControl;
  }

  get emailControl(): FormControl {
    return this.loginForm.get('email') as FormControl;
  }

  onSubmit() {
    if (this.loginForm.valid && !this.submitting) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password, 
        // this.turnstileToken
      ).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso:', response);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.name));
          localStorage.setItem('userId', response._id);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('client', JSON.stringify(response.client));
          localStorage.setItem('profileId', response.profileId);
          localStorage.setItem('isAdmin', JSON.stringify(response.isAdmin));
          this.notificationsService.connectSocket();
          if(response.isAdmin){
            this.router.navigate(['/admin/dashboard']);
          }else{
            this.router.navigate(['/home']);
          }
          
        },
        error: (error) => {
          console.error('Error en el inicio de sesión:', error);
          this.submitting = false;
          this.turnstileToken = '';
          if(error.status === 400){
            this.toastService.showToast('Error', 'Correo electrónico o contraseña incorrecta', 'error', 5);
            return;
          } else {  
            this.toastService.showToast('Error', 'Ocurrió un error inesperado, intente loguearse de nuevo', 'error', 5);
          }
        }
      });
    } else {
      this.loginForm.markAllAsTouched();
    }
  }

  showLoader() {
    this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
      (response: any) => {
        this.loader = !!response?.state;
      }
    )
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  setFlag(flag: any) {
    this.selectedFlagUrl = flag.url;
    this.currentLang = flag.lang;
    localStorage.setItem('app-lang', flag.lang);
    this.translate.use(flag.lang);
  }

  onTurnstileToken(token: string): void {
    this.turnstileToken = token || '';
    this.turnstileError = false;
  }

  onTurnstileError(): void {
    this.turnstileToken = '';
    this.turnstileError = true;
  }

  get canSubmit(): boolean {
    return this.loginForm.valid && !this.submitting
    // !!this.turnstileToken
    ;
  }

  ngOnDestroy(): void {
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }
}
