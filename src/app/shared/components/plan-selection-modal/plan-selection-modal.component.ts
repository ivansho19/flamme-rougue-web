import { AfterViewInit, Component, ElementRef, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { PlanOption } from '../../model/planes.model';
import { environment } from '../../../../environments/environment';
import { PaymentService } from '../../services/payment/payment.service';
import { PayPalButtonService } from '../../services/paypal/paypal-button.service';

export const PROFILE_CREATE_FREE_TRIAL_PROMO_CODE = 'GRATIS7DIAS';

export interface PlanPromoSelection {
  plan: PlanOption;
  promoCode: string;
}

@Component({
  selector: 'app-plan-selection-modal',
  templateUrl: './plan-selection-modal.component.html',
  styleUrls: ['./plan-selection-modal.component.scss']
})
export class PlanSelectionModalComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() profileName = '';
  @Input() updateMode = false;
  
  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<PlanOption>();
  @Output() paymentCompleted = new EventEmitter<PlanOption>();
  @Output() whatsAppConfirmed = new EventEmitter<PlanOption>();
  @Output() promoConfirmed = new EventEmitter<PlanPromoSelection>();

  @ViewChild('paypalButtons', { static: false }) paypalButtons?: ElementRef<HTMLDivElement>;

  selectedPlanId: number | null = null;
  paypalError = '';
  promoCodeInput = '';
  promoError = '';
  promoApplied = false;
  showPromoPanel = false;
  private readonly whatsAppPhone = '+34645378025';
  isWhatsAppConfirmOpen = false;

  plans: PlanOption[] = [
    {
      id: 1,
      name: "Plan Basico",
      price: "39€",
      period: "mes",
      features: [
        "Perfil activo",
        "Aparece en busquedas normales",
        "Hasta 8 fotos",
        "Comentarios y estrellas",
        "Sin prioridad en listados"
      ],
      buttonText: "Seleccionar"
    },
    {
      id: 2,
      name: "Plan Pro",
      price: "79€",
      period: "mes",
      features: [
        "Todo lo del Basico",
        "Mejor posicion en su ciudad",
        "Rotaciones destacadas",
        "Badge Perfil Recomendado",
        "Hasta 15 fotos"
      ],
      badge: "RECOMENDADO",
      highlight: true,
      buttonText: "Seleccionar"
    },
    {
      id: 3,
      name: "Plan VIP",
      price: "149€",
      period: "mes",
      features: [
        "Todo lo del Plan Pro",
        "Prioridad maxima en listados",
        "Aparece en Home destacada",
        "Badge VIP",
        "Hasta 30 fotos",
        "Soporte prioritario"
      ],
      buttonText: "Seleccionar",
      cardClass: "vip",
      buttonClass: "vip-btn"
    },
  ];

  constructor(
    private paymentService: PaymentService,
    private ngZone: NgZone,
    private payPalButtonService: PayPalButtonService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    // Pre-seleccionar Plan Pro por defecto
    this.selectedPlanId = 2;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      if (this.isOpen) {
        this.schedulePayPalRender();
      } else {
        this.resetPromoState();
        this.paypalError = '';
      }
    }
  }

  ngAfterViewInit(): void {
    if (this.isOpen) {
      this.schedulePayPalRender();
    }
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
    this.paypalError = '';
    if (this.promoApplied) {
      this.promoError = '';
    }
  }

  applyPromoCode(): void {
    const normalized = this.promoCodeInput.trim().toUpperCase();

    if (!normalized) {
      this.promoError = this.translate.instant('PLAN_SELECTION_MODAL.PROMO_REQUIRED');
      this.promoApplied = false;
      return;
    }

    if (normalized !== PROFILE_CREATE_FREE_TRIAL_PROMO_CODE) {
      this.promoError = this.translate.instant('PLAN_SELECTION_MODAL.PROMO_INVALID');
      this.promoApplied = false;
      return;
    }

    if (!this.selectedPlanId) {
      this.promoError = this.translate.instant('PLAN_SELECTION_MODAL.PROMO_SELECT_PLAN');
      this.promoApplied = false;
      return;
    }

    this.promoApplied = true;
    this.promoError = '';
    this.paypalError = '';
  }

  clearPromoCode(): void {
    this.resetPromoState();
  }

  openPromoPanel(): void {
    this.showPromoPanel = true;
    this.promoError = '';
  }

  closePromoPanel(): void {
    if (this.promoApplied) {
      return;
    }
    this.showPromoPanel = false;
    this.promoCodeInput = '';
    this.promoError = '';
  }

  confirmPromoPublish(): void {
    const plan = this.getSelectedPlan();
    if (!plan || !this.promoApplied) {
      this.promoError = this.translate.instant('PLAN_SELECTION_MODAL.PROMO_SELECT_PLAN');
      return;
    }

    this.promoConfirmed.emit({
      plan,
      promoCode: PROFILE_CREATE_FREE_TRIAL_PROMO_CODE
    });
  }

  get appliedPromoPlanName(): string {
    return this.getSelectedPlan()?.name || '';
  }

  private resetPromoState(): void {
    this.promoCodeInput = '';
    this.promoError = '';
    this.promoApplied = false;
    this.showPromoPanel = false;
  }

  confirmPlan(): void {
    if (this.selectedPlanId) {
      const plan = this.plans.find(p => p.id === this.selectedPlanId);
      if (plan) {
        this.planSelected.emit(plan);
      }
    }
  }

  onClose(): void {
    this.close.emit();
  }

  openWhatsAppConfirm(): void {
    this.isWhatsAppConfirmOpen = true;
  }

  closeWhatsAppConfirm(): void {
    this.isWhatsAppConfirmOpen = false;
  }

  confirmWhatsAppPayment(): void {
    const plan = this.getSelectedPlan();
    if (!plan) {
      this.paypalError = 'Selecciona un plan para continuar.';
      this.isWhatsAppConfirmOpen = false;
      return;
    }

    this.isWhatsAppConfirmOpen = false;
    this.whatsAppConfirmed.emit(plan);
    this.openWhatsAppPayment();
  }

  openWhatsAppPayment(): void {
    const plan = this.getSelectedPlan();
    const planName = plan?.name || this.translate.instant('WHATSAPP_PAYMENT.DEFAULT_PLAN');
    const planPrice = plan?.price || '';
    const displayName = this.profileName || this.translate.instant('WHATSAPP_PAYMENT.DEFAULT_CLIENT');
    const message = this.translate.instant('WHATSAPP_PAYMENT.PROFILE_PLAN', {
      name: displayName,
      planName,
      price: this.parsePlanPrice(planPrice)
    });
    const url = `https://wa.me/${this.whatsAppPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  }

  private schedulePayPalRender(): void {
    if (!this.isOpen) {
      return;
    }
    this.initPayPalButtons();
  }

  private initPayPalButtons(): void {
    if (!this.isOpen) {
      return;
    }

    if (!localStorage.getItem('token')) {
      this.paypalError = 'Debes iniciar sesion para pagar con PayPal.';
      return;
    }

    const currency = environment.paypalCurrency || 'EUR';

    this.payPalButtonService
      .waitForContainer(() => this.paypalButtons?.nativeElement)
      .then(container => {
        if (!this.isOpen) {
          return;
        }

        return this.payPalButtonService.renderButtons({
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
              throw new Error('Plan no seleccionado');
            }

            const amount = this.parsePlanPrice(plan.price);

            try {
              const response = await firstValueFrom(
                this.paymentService.createPayPalOrder(Number(amount), currency)
              );
              return response.orderId;
            } catch (error) {
              this.paypalError = 'No se pudo crear la orden de PayPal.';
              throw error;
            }
          },
          onApprove: async (data: any, actions: any) => {
            try {
              const response = await firstValueFrom(
                this.paymentService.capturePayPalOrder(data.orderID)
              );
              if (response.status !== 'COMPLETED') {
                this.paypalError = 'El pago no se completo correctamente.';
                return;
              }

              const plan = this.getSelectedPlan();
              if (plan) {
                this.ngZone.run(() => {
                  this.paymentCompleted.emit(plan);
                  this.planSelected.emit(plan);
                });
              }
            } catch (error) {
              this.paypalError = 'Error al capturar el pago con PayPal.';
              return;
            }
          },
            onError: () => {
              this.paypalError = 'Error al procesar el pago con PayPal.';
            }
          }
        });
      })
      .catch((error) => {
        this.paypalError = error instanceof Error
          ? error.message
          : 'No se pudo cargar PayPal. Intenta nuevamente.';
      });
  }

  private getSelectedPlan(): PlanOption | null {
    if (!this.selectedPlanId) {
      return null;
    }
    return this.plans.find(p => p.id === this.selectedPlanId) || null;
  }

  private parsePlanPrice(value: string): string {
    const normalized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
  }
}
