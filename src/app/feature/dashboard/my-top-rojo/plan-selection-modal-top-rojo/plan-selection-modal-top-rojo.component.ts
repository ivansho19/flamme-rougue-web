import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TOP_ROJO_PLANS, TopRojoPlantType } from '../../../../shared/models/top-rojo.model';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaymentService } from '../../../../shared/services/payment/payment.service';
import { PayPalButtonService } from '../../../../shared/services/paypal/paypal-button.service';

export interface TopRojoPlanOption {
  id: TopRojoPlantType;
  name: string;
  duration: number;
  price: number;
  description: string;
}

@Component({
  selector: 'app-plan-selection-modal-top-rojo',
  templateUrl: './plan-selection-modal-top-rojo.component.html',
  styleUrls: ['./plan-selection-modal-top-rojo.component.scss']
})
export class PlanSelectionModalTopRojoComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() profileName = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<TopRojoPlanOption>();

  selectedPlanId: TopRojoPlantType | null = null;
  plans: TopRojoPlanOption[] = [];
  paypalError = '';

  @ViewChild('paypalButtons', { static: false }) paypalButtons?: ElementRef<HTMLDivElement>;

  constructor(
    private paymentService: PaymentService,
    private payPalButtonService: PayPalButtonService
  ) {}

  ngOnInit(): void {
    this.loadPlans();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.schedulePayPalRender();
      } else {
        this.paypalError = '';
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.schedulePayPalRender();
    }
  }

  loadPlans(): void {
    // Convertir TOP_ROJO_PLANS a array
    this.plans = Object.entries(TOP_ROJO_PLANS).map(([key, value]) => ({
      id: key as TopRojoPlantType,
      name: value.name,
      duration: value.duration,
      price: value.price,
      description: value.description
    }));

    // Seleccionar por defecto el plan de 24h
    if (this.plans.length > 0) {
      this.selectedPlanId = this.plans[0].id;
    }
  }

  selectPlan(planId: TopRojoPlantType): void {
    this.selectedPlanId = planId;
  }

  confirmSelection(): void {
    const selectedPlan = this.getSelectedPlan();
    if (selectedPlan) {
      this.planSelected.emit(selectedPlan);
      this.close.emit();
    }
  }

  closeModal(): void {
    this.close.emit();
  }

  getDurationText(hours: number): string {
    if (hours < 24) return `${hours}h`;
    const days = Math.round(hours / 24);
    return `${days}${days === 1 ? ' día' : ' días'}`;
  }

  private schedulePayPalRender(): void {
    setTimeout(() => this.initPayPalButtons(), 0);
  }

  private initPayPalButtons(): void {
    if (!this.isOpen || !this.paypalButtons?.nativeElement) {
      return;
    }

    if (!localStorage.getItem('token')) {
      this.paypalError = 'Debes iniciar sesion para pagar con PayPal.';
      return;
    }

    const container = this.paypalButtons.nativeElement;
    container.innerHTML = '';

    const currency = environment.paypalCurrency || 'EUR';

    this.payPalButtonService
      .renderButtons({
        container,
        clientId: environment.paypalClientId,
        currency,
        config: {
          style: {
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay'
          },
          createOrder: async (_data: any, actions: any) => {
            const plan = this.getSelectedPlan();
            if (!plan) {
              this.paypalError = 'Selecciona un plan para continuar.';
              return actions.reject();
            }

            const amount = plan.price;

            try {
              const response = await firstValueFrom(
                this.paymentService.createPayPalOrder(Number(amount), currency)
              );
              return response.orderId;
            } catch (error) {
              this.paypalError = 'No se pudo crear la orden de PayPal.';
              return actions.reject();
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await firstValueFrom(
                this.paymentService.capturePayPalOrder(data.orderID)
              );
              if (response.status !== 'COMPLETED') {
                this.paypalError = 'El pago no se completo correctamente.';
                return actions.reject();
              }

              const plan = this.getSelectedPlan();
              if (plan) {
                this.planSelected.emit(plan);
                this.close.emit();
              }
            } catch (error) {
              this.paypalError = 'Error al capturar el pago con PayPal.';
              return actions.reject();
            }
          },
          onError: () => {
            this.paypalError = 'Error al procesar el pago con PayPal.';
          }
        }
      })
      .catch((error) => {
        this.paypalError = error instanceof Error
          ? error.message
          : 'No se pudo cargar PayPal. Intenta nuevamente.';
      });
  }

  private getSelectedPlan(): TopRojoPlanOption | null {
    return this.plans.find(p => p.id === this.selectedPlanId) || null;
  }
}
