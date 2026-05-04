import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';

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
export class PlanSelectionModalCommentPlansComponent implements OnInit {
  @Input() isOpen = false;
  @Input() currentPlan: CommentPlanType = 'free';

  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<'monthly' | 'annual'>();

  selectedPlanId: CommentPlanType = 'monthly';

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

  ngOnInit(): void {
    this.selectedPlanId = this.currentPlan === 'free' ? 'monthly' : this.currentPlan;
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
}
