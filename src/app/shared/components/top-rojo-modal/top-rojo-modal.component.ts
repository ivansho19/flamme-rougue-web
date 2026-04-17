import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { TopRojoService } from '../../services/top-rojo/top-rojo.service';
import { TOP_ROJO_PLANS, TopRojoPlantType, ITopRojoListResponse, ITopRojoCreateRequest } from '../../models/top-rojo.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-top-rojo-modal',
  templateUrl: './top-rojo-modal.component.html',
  styleUrls: ['./top-rojo-modal.component.scss']
})
export class TopRojoModalComponent implements OnInit, OnDestroy {
  @Input() isOpen = false;
  @Input() profileId: string = '';
  @Input() city: string = '';
  @Input() country: string = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() purchaseSuccess = new EventEmitter<any>();

  plans = TOP_ROJO_PLANS;
  selectedPlan: TopRojoPlantType | null = null;
  cityData: ITopRojoListResponse | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private topRojoService: TopRojoService) { }

  ngOnInit(): void {
    if (this.isOpen && this.city) {
      this.loadCityData();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Cargar información de la ciudad (slots disponibles)
   */
  loadCityData(): void {
    this.topRojoService
      .getTopRojoByCity(this.city, this.country)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.cityData = data;
        },
        error: (error) => {
          console.error('Error loading city data:', error);
        }
      });
  }

  /**
   * Seleccionar plan
   */
  selectPlan(planKey: any): void {
    this.selectedPlan = planKey;
  }

  /**
   * Proceder al pago
   */
  proceedToPayment(): void {
    if (!this.selectedPlan || !this.profileId) {
      console.error('Plan o profileId no seleccionado');
      return;
    }

    const request:ITopRojoCreateRequest = {
      profileId: this.profileId,
      planType: this.selectedPlan,
      city: this.city,
      country: this.country,
      displayName: '' 
    };

    this.topRojoService
      .createTopRojo(request)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          console.log('TOP ROJO creado:', response);
          this.purchaseSuccess.emit(response);
          this.resetModal();
          this.onClose();
        },
        error: (error) => {
          console.error('Error creando TOP ROJO:', error);
          // TODO: Mostrar toast error
        }
      });
  }

  /**
   * Cerrar modal (emit)
   */
  onClose(): void {
    this.close.emit();
  }

  /**
   * Resetear valores del modal
   */
  private resetModal(): void {
    this.selectedPlan = null;
    this.cityData = null;
  }
}
