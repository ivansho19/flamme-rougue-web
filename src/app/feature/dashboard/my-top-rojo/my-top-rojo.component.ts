import { Component, OnInit, OnDestroy } from '@angular/core';
import { TopRojoService } from '../../../shared/services/top-rojo/top-rojo.service';
import { IMyTopRojoDashboard, ITopRojoResponse, TOP_ROJO_PLANS, TopRojoPlantType } from '../../../shared/models/top-rojo.model';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-top-rojo',
  templateUrl: './my-top-rojo.component.html',
  styleUrls: ['./my-top-rojo.component.scss']
})
export class MyTopRojoComponent implements OnInit, OnDestroy {
  dashboard: IMyTopRojoDashboard | null = null;
  loading = false;
  activeTab: 'active' | 'expired' = 'active';
  
  // Modal
  showTopRojoModal = false;
  profileId: string = '';
  city: string = '';
  country: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private topRojoService: TopRojoService,
    private toastService: ToastService
  ) { }

  ngOnInit(): void {
    this.loadDashboard();
    this.loadProfileInfo();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar dashboard de mis TOP ROJO
   */
  loadDashboard(): void {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      this.toastService.showToast('error', 'Usuario no autenticado');
      return;
    }

    this.loading = true;
    this.topRojoService
      .getMyTopRojo(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: IMyTopRojoDashboard) => {
          this.dashboard = data || { active: [], expired: [], statistics: { totalSpent: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 } };
          this.loading = false;
        },
        error: (error) => {
          console.error('Error loading dashboard:', error);
          this.toastService.showToast('error', 'Error al cargar los datos');
          this.loading = false;
        }
      });
  }

  /**
   * Cargar información del perfil
   */
  loadProfileInfo(): void {
    const profileId = localStorage.getItem('profileId');
    // Este método debería obtener city y country del perfil
    // Por ahora asumimos que vienen de un servicio de perfil
    if (profileId) {
      this.profileId = profileId;
      // TODO: Obtener city y country del servicio de perfil
    }
  }

  /**
   * Abrir modal para crear TOP ROJO
   */
  openTopRojoModal(): void {
    if (!this.profileId) {
      this.toastService.showToast('error', 'No hay perfil disponible');
      return;
    }
    this.showTopRojoModal = true;
  }

  /**
   * Callback cuando se compra un TOP ROJO
   */
  onPurchaseSuccess(): void {
    this.toastService.showToast('success', 'TOP ROJO activado exitosamente');
    this.showTopRojoModal = false;
    this.loadDashboard();
  }

  /**
   * Renovar TOP ROJO expirado
   */
  renewTopRojo(topRojoId: string): void {
    // Aquí se podría abrir un modal nuevo para seleccionar el plan
    // Por ahora simplemente recargamos
    this.loadDashboard();
  }

  /**
   * Cancelar TOP ROJO
   */
  cancelTopRojo(topRojoId: string): void {
    if (confirm('¿Deseas cancelar este TOP ROJO?')) {
      this.topRojoService
        .cancelTopRojo(topRojoId)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: () => {
            this.toastService.showToast('success', 'TOP ROJO cancelado');
            this.loadDashboard();
          },
          error: (error) => {
            console.error('Error cancelando TOP ROJO:', error);
            this.toastService.showToast('error', 'Error al cancelar TOP ROJO');
          }
        });
    }
  }

  /**
   * Obtener nombre del plan
   */
  getPlanName(planType: TopRojoPlantType): string {
    return TOP_ROJO_PLANS[planType]?.name || planType;
  }

  /**
   * Calcular porcentaje de progreso
   */
  getProgressPercentage(top: ITopRojoResponse): number {
    const totalHours = TOP_ROJO_PLANS[top.planType]?.duration || 24;
    const remainingHours = (top.daysRemaining * 24) + top.hoursRemaining;
    const progressPercentage = ((totalHours - remainingHours) / totalHours) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }
}
