import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { PlanOption } from '../../model/planes.model';
import { environment } from '../../../../environments/environment';
import { PaymentService } from '../../services/payment/payment.service';

declare global {
  interface Window {
    paypal?: any;
  }
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

  @ViewChild('paypalButtons', { static: false }) paypalButtons?: ElementRef<HTMLDivElement>;

  selectedPlanId: number | null = null;
  paypalError = '';
  private paypalScriptPromise: Promise<void> | null = null;

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

  constructor(private paymentService: PaymentService) {}

  ngOnInit(): void {
    // Pre-seleccionar Plan Pro por defecto
    this.selectedPlanId = 2;
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

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
    this.paypalError = '';
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

  private schedulePayPalRender(): void {
    setTimeout(() => {
      this.initPayPalButtons();
    }, 0);
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

    this.loadPayPalScript()
      .then(() => {
        const paypal = window.paypal;
        if (!paypal) {
          this.paypalError = 'No se pudo cargar PayPal. Intenta nuevamente.';
          return;
        }

        paypal.Buttons({
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

            const amount = this.parsePlanPrice(plan.price);
            const currency = environment.paypalCurrency || 'EUR';

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
              }
            } catch (error) {
              this.paypalError = 'Error al capturar el pago con PayPal.';
              return actions.reject();
            }
          },
          onError: () => {
            this.paypalError = 'Error al procesar el pago con PayPal.';
          }
        }).render(container);
      })
      .catch(() => {
        this.paypalError = 'No se pudo cargar PayPal. Intenta nuevamente.';
      });
  }

  private loadPayPalScript(): Promise<void> {
    if (window.paypal) {
      return Promise.resolve();
    }

    if (this.paypalScriptPromise) {
      return this.paypalScriptPromise;
    }

    const clientId = environment.paypalClientId;
    if (!clientId) {
      this.paypalError = 'Falta configurar el Client ID de PayPal.';
      return Promise.reject();
    }

    this.paypalScriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      const currency = environment.paypalCurrency || 'EUR';
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });

    return this.paypalScriptPromise;
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
