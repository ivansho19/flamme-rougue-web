import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { ToastService } from '../../shared/services/toast/toast.service';
import { TranslateService } from '@ngx-translate/core';
import { GetFlags } from '../../shared/clases/getFlagsOptions';

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
  selectedFlagUrl = 'https://flagcdn.com/es.svg';
  flagOptions = GetFlags.getFlagsOptions();

  constructor(private fb: FormBuilder, private authService: AuthService, 
    private router: Router, private loaderService: LoaderService, 
    private toastService: ToastService, private translate: TranslateService) {
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
    if (this.loginForm.valid) {
      const { email, password } = this.loginForm.value;
      this.authService.login(email, password).subscribe({
        next: (response) => {
          console.log('Inicio de sesión exitoso:', response);
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.name));
          localStorage.setItem('userId', response._id);
          localStorage.setItem('userEmail', email);
          localStorage.setItem('profileId', response.profileId);
          this.router.navigate(['/home']);
        },
        error: (error) => {
          console.error('Error en el inicio de sesión:', error);
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

  ngOnDestroy(): void {
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }
}
