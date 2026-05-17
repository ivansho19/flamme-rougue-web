import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaymentService } from '../../../../shared/services/payment/payment.service';
import { PayPalButtonService } from '../../../../shared/services/paypal/paypal-button.service';

type CommentPlanType = 'free' | 'monthly' | 'annual';

interface CommentPlanOption {
  id: CommentPlanType;
  name: string;
  price: string;
  period: string;
  badge?: string;
  features: string[];
  selectable: boolean;
}

@Component({
  selector: 'app-plan-selection-modal-comment-plans',
  templateUrl: './plan-selection-modal-comment-plans.component.html',
  styleUrls: ['./plan-selection-modal-comment-plans.component.scss']
})
export class PlanSelectionModalCommentPlansComponent implements OnInit, OnChanges, AfterViewInit {
  @Input() isOpen = false;
  @Input() currentPlan: CommentPlanType = 'free';

  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<'monthly' | 'annual'>();

  selectedPlanId: CommentPlanType = 'monthly';
  paypalError = '';

  @ViewChild('paypalButtons', { static: false }) paypalButtons?: ElementRef<HTMLDivElement>;

  plans: CommentPlanOption[] = [
    {
      id: 'free',
      name: 'Gratis',
      price: '0€',
      period: 'bienvenida',
      features: ['1 comentario de bienvenida'],
      selectable: false
    },
    {
      id: 'monthly',
      name: 'Mensual',
      price: '19€',
      period: 'mes',
      badge: 'Miembro',
      features: ['Hasta 4 comentarios al mes', 'Badge Miembro'],
      selectable: true
    },
    {
      id: 'annual',
      name: 'Anual',
      price: '149€',
      period: 'ano',
      badge: 'Hombre Top',
      features: ['Comentarios ilimitados', 'Badge Hombre Top'],
      selectable: true
    }
  ];

  constructor(
    private paymentService: PaymentService,
    private payPalButtonService: PayPalButtonService
  ) {}

  ngOnInit(): void {
    this.selectedPlanId = this.currentPlan === 'free' ? 'monthly' : this.currentPlan;
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

  selectPlan(planId: CommentPlanType): void {
    const plan = this.plans.find(item => item.id === planId);
    if (!plan?.selectable) {
      return;
    }
    this.selectedPlanId = planId;
  }

  confirmSelection(): void {
    if (this.selectedPlanId === 'monthly' || this.selectedPlanId === 'annual') {
      this.planSelected.emit(this.selectedPlanId);
    }
  }

  onClose(): void {
    this.close.emit();
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
            if (!plan || !plan.selectable) {
              this.paypalError = 'Selecciona un plan para continuar.';
              return actions.reject();
            }

            const amount = this.parsePlanPrice(plan.price);

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

              if (this.selectedPlanId === 'monthly' || this.selectedPlanId === 'annual') {
                this.planSelected.emit(this.selectedPlanId);
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

  private getSelectedPlan(): CommentPlanOption | null {
    return this.plans.find(item => item.id === this.selectedPlanId) || null;
  }

  private parsePlanPrice(value: string): string {
    const normalized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
  }
}
