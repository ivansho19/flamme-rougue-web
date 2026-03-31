import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../service/auth.service';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { ToastService } from '../../shared/services/toast/toast.service';

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

  constructor(private fb: FormBuilder, private authService: AuthService, 
    private router: Router, private loaderService: LoaderService, 
    private toastService: ToastService) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [
        Validators.required,
        Validators.minLength(6)
      ]]
    });
  }

  ngOnInit(): void {
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

  ngOnDestroy(): void {
    if (this.loaderSubscription) {
      this.loaderSubscription.unsubscribe();
    }
  }
}
