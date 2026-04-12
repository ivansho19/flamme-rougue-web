import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { TopRojoService } from '../../../shared/services/top-rojo/top-rojo.service';
import { CloudinaryService } from '../../../shared/services/cloudinary/cloudinary.service';
import { ProfileService } from '../../../shared/services/profile/profile.service';
import { IMyTopRojoDashboard, ITopRojoResponse, TOP_ROJO_PLANS, TopRojoPlantType } from '../../../shared/models/top-rojo.model';
import { ToastService } from '../../../shared/services/toast/toast.service';
import { CreateTopRojoFormComponent } from './create-top-rojo-form/create-top-rojo-form.component';
import { TopRojoPlanOption } from './plan-selection-modal-top-rojo/plan-selection-modal-top-rojo.component';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-my-top-rojo',
  templateUrl: './my-top-rojo.component.html',
  styleUrls: ['./my-top-rojo.component.scss']
})
export class MyTopRojoComponent implements OnInit, OnDestroy {
  @ViewChild(CreateTopRojoFormComponent) createFormComponent!: CreateTopRojoFormComponent;
  
  dashboard: IMyTopRojoDashboard | null = {
    active: [],
    expired: [],
    statistics: { totalSpent: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 }
  };
  loading = false;
  activeTab: 'active' | 'expired' = 'active';
  
  // Modal de creación
  showCreateForm = false;
  isCreating = false;
  
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
          console.log('[MyTopRojo] Perfil cargado:');
          console.log('  - displayName:', profile?.displayName);
          console.log('  - city:', profile?.city);
          console.log('  - country:', profile?.country);
          
          this.displayName = profile?.displayName || '';
          this.city = profile?.city || '';
          this.country = profile?.country || '';
          
          console.log('[MyTopRojo] Valores asignados al componente:');
          console.log('  - this.displayName:', this.displayName);
          console.log('  - this.city:', this.city);
          console.log('  - this.country:', this.country);
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
    console.log('[MyTopRojo] openCreateForm - Abriendo formulario de creación');
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

  /**
   * Manejar selección de plan y creación de TOP ROJO
   */
  onPlanSelectedForTopRojo(event: { formData: any; plan: TopRojoPlanOption }): void {
    console.log('[MyTopRojo] onPlanSelectedForTopRojo - Evento recibido:');
    console.log('Event completo:', event);
    
    const { formData, plan } = event;
    const { country, city, title, description, phone, photo1File, photo2File } = formData;
    const planType = plan.id;

    console.log('[MyTopRojo] Datos extraídos del evento:');
    console.log('FormData:', formData);
    console.log('Country:', country, '| Type:', typeof country);
    console.log('City:', city, '| Type:', typeof city);
    console.log('Title:', title);
    console.log('Description:', description);
    console.log('Phone:', phone);
    console.log('Photo1:', photo1File ? 'Existe ✓' : 'NO existe ✗');
    console.log('Photo2:', photo2File ? 'Existe ✓' : 'NO existe ✗');
    console.log('Plan ID:', plan.id);
    console.log('Plan Name:', plan.name);
    console.log('Plan Type:', planType);
    
    // Obtener profileId y displayName desde localStorage EN EL MOMENTO
    const profileIdFromLS = localStorage.getItem('profileId');
    const userIdFromLS = localStorage.getItem('userId');
    
    console.log('[MyTopRojo] Datos desde localStorage:');
    console.log('  - profileId from localStorage:', profileIdFromLS);
    console.log('  - userId from localStorage:', userIdFromLS);
    console.log('[MyTopRojo] Datos desde componente (this.):');
    console.log('  - this.profileId:', this.profileId);
    console.log('  - this.displayName:', this.displayName);

    // Validar que el plan sea válido
    if (!planType || !['top_24h', 'top_3d', 'top_7d'].includes(planType)) {
      console.error('[MyTopRojo] Plan inválido, abortando');
      this.toastService.showToast('error', 'Plan inválido');
      return;
    }

    // Usar profileId del localStorage si está disponible, sino usar this.profileId
    const finalProfileId = profileIdFromLS || this.profileId;
    
    if (!finalProfileId || !country || !city) {
      console.error('[MyTopRojo] Faltan datos críticos:');
      console.error('  - profileId:', finalProfileId || '(VACIO)');
      console.error('  - country:', country || '(VACIO)');
      console.error('  - city:', city || '(VACIO)');
      this.toastService.showToast('error', 'Faltan datos del perfil o ubicación');
      return;
    }

    console.log('[MyTopRojo] Todas las validaciones pasaron ✓ - Procediendo a crear TOP ROJO');
    this.isCreating = true;

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
        this.cloudinaryService
      )
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('[MyTopRojo] TOP ROJO creado exitosamente, respuesta:', response);
          this.isCreating = false;
          
          // Resetear el formulario hijo ANTES de cerrar
          if (this.createFormComponent) {
            console.log('[MyTopRojo] Reseteando formulario hijo...');
            this.createFormComponent.resetFormFromParent();
          }
          
          this.toastService.showToast('success', 'TOP ROJO creado exitosamente');
          this.showCreateForm = false;
          this.loadDashboard();
        },
        error: (error) => {
          console.error('[MyTopRojo] Error creating TOP ROJO:', error);
          this.isCreating = false;
          this.toastService.showToast('error', 'Error al crear TOP ROJO');
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
