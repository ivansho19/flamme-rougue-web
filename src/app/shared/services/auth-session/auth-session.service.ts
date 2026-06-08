import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { ToastService } from '../toast/toast.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable({
  providedIn: 'root'
})
export class AuthSessionService {
  private logoutInProgress = false;

  constructor(
    private router: Router,
    private toastService: ToastService,
    private notificationsService: NotificationsService
  ) {}

  logout(sessionExpired = false): void {
    if (this.logoutInProgress) {
      return;
    }

    this.logoutInProgress = true;
    this.notificationsService.disconnectSocket();
    this.clearSession();

    if (sessionExpired) {
      this.toastService.showToast(
        'Sesion expirada',
        'Tu tiempo de sesion expiro. Vuelve a iniciar sesion.',
        'error',
        5
      );
    }

    this.router.navigate(['/auth/login']).finally(() => {
      this.logoutInProgress = false;
    });
  }

  private clearSession(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('adult-consent');
    localStorage.removeItem('profileId');
    localStorage.removeItem('isAdmin');
    localStorage.removeItem('client');
  }
}
