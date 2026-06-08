import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { TopRojoService } from '../../../shared/services/top-rojo/top-rojo.service';
import { CloudinaryService } from '../../../shared/services/cloudinary/cloudinary.service';
import { ProfileService } from '../../../shared/services/profile/profile.service';
import { IMyTopRojoDashboard, ITopRojoResponse, TOP_ROJO_PLANS, TopRojoPlantType } from '../../../shared/models/top-rojo.model';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { CreateTopRojoFormComponent } from './create-top-rojo-form/create-top-rojo-form.component';
import { TopRojoPlanOption } from './plan-selection-modal-top-rojo/plan-selection-modal-top-rojo.component';
import { Subject } from 'rxjs';
import { finalize, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-top-rojo',
  templateUrl: './my-top-rojo.component.html',
  styleUrls: ['./my-top-rojo.component.scss']
})
export class MyTopRojoComponent implements OnInit, OnDestroy {
  @ViewChild(CreateTopRojoFormComponent) createFormComponent!: CreateTopRojoFormComponent;
  
  dashboard: IMyTopRojoDashboard | null = {
    active: [],
    pending: [],
    expired: [],
    statistics: { totalSpent: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 }
  };
  loading = false;
  activeTab: 'active' | 'pending' | 'expired' = 'active';
  
  // Modal de creación
  showCreateForm = false;
  showRenewPlanModal = false;
  renewTargetId: string | null = null;
  topRojoId: string = '';
  
  // Profile info
  profileId: string = '';
  displayName: string = '';
  city: string = '';
  country: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private topRojoService: TopRojoService,
    private cloudinaryService: CloudinaryService,
    private profileService: ProfileService,
    private toastService: ToastService,
    private router: Router
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
      return;
    }

    this.loading = true;
    this.topRojoService
      .getMyTopRojo(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: IMyTopRojoDashboard) => {
          this.dashboard = data || { active: [], pending: [], expired: [], statistics: { totalSpent: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 } };
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
    const userId = localStorage.getItem('userId');
    
    console.log('[MyTopRojo] loadProfileInfo:');
    console.log('  - profileId from localStorage:', profileId);
    console.log('  - userId from localStorage:', userId);
    
    if (!profileId || !userId) {
      console.log('  - FALTA profileId o userId, abortando');
      return;
    }
    
    this.profileId = profileId;
    console.log('  - this.profileId asiganado:', this.profileId);

    // Obtener datos del perfil (displayName, city, country)
    this.profileService
      .getProfileByUser(userId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (profile: any) => {
          this.displayName = profile?.displayName || '';
          this.city = profile?.city || '';
          this.country = profile?.country || '';
        },
        error: (error) => {
          console.error('Error loading profile:', error);
        }
      });
  }

  /**
   * Abrir modal para crear TOP ROJO
   */
  openCreateForm(): void {
    const profileIdFromLS = localStorage.getItem('profileId');
    const finalProfileId = profileIdFromLS || this.profileId;

    if (!finalProfileId) {
      this.toastService.showToast('Error','Primero debes crear tu perfil para publicar un TOP ROJO', 'error', 5);
      setTimeout(() => {
        this.router.navigate(['/create-profile']);
      }, 5000);
      return;
    }
    this.showCreateForm = true;
  }

  /**
   * Cerrar el formulario de creación
   */
  closeCreateForm(): void {
    console.log('[MyTopRojo] closeCreateForm - Cerrando formulario');
    
    // Resetear el formulario hijo
    if (this.createFormComponent) {
      console.log('[MyTopRojo] Reseteando formulario hijo al cerrar...');
      this.createFormComponent.resetFormFromParent();
    }
    
    this.showCreateForm = false;
  }

  closeRenewPlanModal(): void {
    this.showRenewPlanModal = false;
    this.topRojoId = '';
  }

  onRenewPlanSelected(plan: TopRojoPlanOption): void {
    const planType = plan.id;
    const topRojoId = this.topRojoId;

    if (!topRojoId) {
      this.toastService.showToast('ERROR', 'No se encontro el TOP ROJO a renovar', 'error', 5);
      this.closeRenewPlanModal();
      return;
    }

    if (!planType || !['top_24h', 'top_3d', 'top_7d'].includes(planType)) {
      this.toastService.showToast('ERROR', 'Plan invalido', 'error', 5);
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;
    this.topRojoService
      .renewTopRojo(topRojoId, planType)
      .pipe(
        takeUntil(this.destroy$),
        finalize(() => {
          this.loading = false;
        })
      )
      .subscribe({
        next: () => {
          this.toastService.showToast('FELICIDADES', 'TOP ROJO renovado exitosamente', 'success', 5);
          this.closeRenewPlanModal();
          this.loadDashboard();
        },
        error: (error) => {
          console.error('Error renovando TOP ROJO:', error);
          this.toastService.showToast('ERROR', 'Ocurrio un error al renovar TOP ROJO', 'error', 5);
        }
      });
  }

  /**
   * Manejar selección de plan y creación de TOP ROJO
   */
  onPlanSelectedForTopRojo(event: { formData: any; plan: TopRojoPlanOption; status: 'active' | 'pending' }): void {
    this.showRenewPlanModal = true;
    const { formData, plan, status } = event;
    const { country, city, title, description, phone, photo1File, photo2File } = formData;
    const planType = plan.id;
    
    // Obtener profileId y displayName desde localStorage EN EL MOMENTO
    const profileIdFromLS = localStorage.getItem('profileId');
    const userIdFromLS = localStorage.getItem('userId');

    // Validar que el plan sea válido
    if (!planType || !['top_24h', 'top_3d', 'top_7d'].includes(planType)) {
      console.error('[MyTopRojo] Plan inválido, abortando');
      this.toastService.showToast('error', 'Plan inválido');
      return;
    }

    // Usar profileId del localStorage si está disponible, sino usar this.profileId
    const finalProfileId = profileIdFromLS || this.profileId;
    
    if (!finalProfileId || !country || !city) {
      this.toastService.showToast('error', 'Faltan datos del perfil o ubicación');
      return;
    }
    this.closeCreateForm();
    this.closeRenewPlanModal();
    this.loading = true;

    // Llamar al servicio para crear TOP ROJO con fotos
    this.topRojoService
      .createTopRojoWithPhotos(
        finalProfileId,
        this.displayName,
        title,
        description,
        phone,
        photo1File,
        photo2File,
        city,
        country,
        planType,
        status,
        this.cloudinaryService
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: () => {
          // Resetear el formulario hijo ANTES de cerrar
          if (this.createFormComponent) {
            this.createFormComponent.resetFormFromParent();
          }
          
          this.toastService.showToast('FELICIDADES', 'TOP ROJO creado exitosamente 🎉', 'success', 5);
          // Esperar un poco para que el backend procese el TOP ROJO
          this.loadDashboard();
          this.showCreateForm = false;
          this.loading = false;
        },
        error: (error) => {
          console.error('[MyTopRojo] Error creating TOP ROJO:', error);
          this.loading = false;
          this.toastService.showToast('ERROR', 'Ocurrio un error al crear TOP ROJO, Intente nuevamente', 'error', 5);
        }
      });
  }

  /**
   * Mapear ID del plan a TopRojoPlantType
   */
  private mapPlanIdToType(planId: number): TopRojoPlantType | null {
    const planMap: { [key: number]: TopRojoPlantType } = {
      1: 'top_24h',
      2: 'top_3d',
      3: 'top_7d'
    };
    return planMap[planId] || null;
  }

  /**
   * Renovar TOP ROJO expirado
   */
  renewTopRojo(topRojoId: string): void {
    // Aquí se podría abrir un modal nuevo para seleccionar el plan
    // Por ahora simplemente recargamos
    this.showRenewPlanModal = true;
    this.topRojoId = topRojoId;
    // this.loadDashboard();
    // this.topRojoService.renewTopRojo(topRojoId, ).subscribe({
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
    const remainingHours = this.getRemainingTime(top).totalHours;
    const progressPercentage = ((totalHours - remainingHours) / totalHours) * 100;
    return Math.min(100, Math.max(0, progressPercentage));
  }

  /**
   * Obtener tiempo restante en dias/horas
   */
  getRemainingTime(top: ITopRojoResponse): {
    days: number;
    hours: number;
    totalHours: number;
    elapsedHours: number;
  } {
    const daysRemaining = Number.isFinite(top.daysRemaining) ? top.daysRemaining : null;
    const hoursRemaining = Number.isFinite(top.hoursRemaining) ? top.hoursRemaining : null;

    if (daysRemaining !== null && hoursRemaining !== null) {
      const totalHours = Math.max(0, (daysRemaining * 24) + hoursRemaining);
      return {
        days: Math.floor(totalHours / 24),
        hours: totalHours % 24,
        totalHours,
        elapsedHours: this.getElapsedHours(top.startDate, top.endDate, totalHours)
      };
    }

    const endDate = new Date(top.endDate);
    if (Number.isNaN(endDate.getTime())) {
      return { days: 0, hours: 0, totalHours: 0, elapsedHours: 0 };
    }

    const now = new Date();
    const diffMs = endDate.getTime() - now.getTime();
    const totalHours = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60)));

    return {
      days: Math.floor(totalHours / 24),
      hours: totalHours % 24,
      totalHours,
      elapsedHours: this.getElapsedHours(top.startDate, top.endDate, totalHours)
    };
  }

  private getElapsedHours(startDate: Date | string, endDate: Date | string, remainingHours: number): number {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
      return 0;
    }

    const totalMs = end.getTime() - start.getTime();
    const totalHours = Math.max(0, Math.ceil(totalMs / (1000 * 60 * 60)));
    const elapsedHours = Math.max(0, totalHours - remainingHours);
    return Math.min(totalHours, elapsedHours);
  }
}
