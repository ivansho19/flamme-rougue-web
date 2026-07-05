import { AfterViewInit, Component, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { PaymentService } from '../../../../shared/services/payment/payment.service';
import { PayPalButtonService } from '../../../../shared/services/paypal/paypal-button.service';
import { CommentPlanBadgeType } from '../../../../shared/clases/commentPlanBadge';

type CommentPlanType = 'free' | 'monthly' | 'annual';

interface CommentPlanOption {
  id: CommentPlanType;
  name: string;
  price: string;
  period: string;
  badgeType?: CommentPlanBadgeType;
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
  @Output() paymentWhatsApp = new EventEmitter<any>();

  selectedPlanId: CommentPlanType = 'monthly';
  paypalError = '';
  private readonly whatsAppPhone = '+34645378025';
  isWhatsAppConfirmOpen = false;

  @ViewChild('paypalButtons', { static: false }) paypalButtons?: ElementRef<HTMLDivElement>;

  plans: CommentPlanOption[] = [
    {
      id: 'free',
      name: 'COMMENT_PLANS.PLAN_FREE',
      price: '0€',
      period: 'COMMENT_PLANS.PERIOD_WELCOME',
      features: ['COMMENT_PLANS.FEATURE_FREE_WELCOME'],
      selectable: false
    },
    {
      id: 'monthly',
      name: 'COMMENT_PLANS.PLAN_MONTHLY',
      price: '19€',
      period: 'COMMENT_PLANS.PERIOD_MONTH',
      badgeType: 'monthly',
      features: ['COMMENT_PLANS.FEATURE_MONTHLY_LIMIT', 'COMMENT_PLANS.FEATURE_BADGE_MEMBER'],
      selectable: true
    },
    {
      id: 'annual',
      name: 'COMMENT_PLANS.PLAN_ANNUAL',
      price: '149€',
      period: 'COMMENT_PLANS.PERIOD_YEAR',
      badgeType: 'annual',
      features: ['COMMENT_PLANS.FEATURE_ANNUAL_UNLIMITED', 'COMMENT_PLANS.FEATURE_BADGE_TOP_MAN'],
      selectable: true
    }
  ];

  constructor(
    private paymentService: PaymentService,
    private payPalButtonService: PayPalButtonService,
    private translate: TranslateService
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

  openWhatsAppConfirm(): void {
    this.isWhatsAppConfirmOpen = true;
  }

  closeWhatsAppConfirm(): void {
    this.isWhatsAppConfirmOpen = false;
  }

  confirmWhatsAppPayment(): void {
    const plan = this.getSelectedPlan();
    this.isWhatsAppConfirmOpen = false;
    this.paymentWhatsApp.emit({ plan, status: 'pending' });
    this.openWhatsAppPayment();
  }

  openWhatsAppPayment(): void {
    const plan = this.getSelectedPlan();
    const planName = plan?.name
      ? this.translate.instant(plan.name)
      : this.translate.instant('WHATSAPP_PAYMENT.DEFAULT_COMMENT_PLAN');
    const planPrice = plan?.price || '';
    const message = this.translate.instant('WHATSAPP_PAYMENT.COMMENT_PLAN', {
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
            if (!plan || !plan.selectable) {
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

              if (this.selectedPlanId === 'monthly' || this.selectedPlanId === 'annual') {
                this.planSelected.emit(this.selectedPlanId);
                this.close.emit();
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

  private getSelectedPlan(): CommentPlanOption | null {
    return this.plans.find(item => item.id === this.selectedPlanId) || null;
  }

  private parsePlanPrice(value: string): string {
    const normalized = value.replace(/[^0-9.,]/g, '').replace(',', '.');
    const amount = Number(normalized);
    return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
  }
}
