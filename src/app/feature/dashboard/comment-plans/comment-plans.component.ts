import { Component, OnInit } from '@angular/core';
import { CommentPlansService } from '../../../shared/services/comment-plans/comment-plans.service';
import { CommentPlanStatus } from '../../../shared/models/comment-plans.model';
import { CommentsService } from '../../../shared/services/comments/comments.service';

@Component({
  selector: 'app-comment-plans',
  templateUrl: './comment-plans.component.html',
  styleUrls: ['./comment-plans.component.scss']
})
export class CommentPlansComponent implements OnInit {
  planStatus: CommentPlanStatus | null = null;
  loading = false;
  actionLoading = false;
  error = '';
  showPlanModal = false;

  constructor(private commentPlansService: CommentPlansService, private commentsService: CommentsService) {}

  ngOnInit(): void {
    const clientValue = localStorage.getItem('client');
    const isClient = clientValue ? JSON.parse(clientValue) : false;
    if (isClient) {
      this.error = 'Este modulo es solo para usuarios.';
      return;
    }

    if (!localStorage.getItem('token')) {
      this.error = 'Debes iniciar sesion para ver tu plan de comentarios.';
      return;
    }

    this.loadStatus();
  }

  loadStatus(): void {
    this.loading = true;
    this.commentPlansService.getStatus().subscribe({
      next: (status) => {
        this.planStatus = status;
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo cargar el estado del plan.';
        this.loading = false;
      }
    });
  }

  activatePlan(planType: 'monthly' | 'annual'): void {
    if (this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.commentPlansService.activatePlan(planType).subscribe({
      next: () => {
        this.actionLoading = false;
         this.loadStatus();
      },
      error: () => {
        this.actionLoading = false;
        this.error = 'No se pudo activar el plan.';
      }
    });
  }

  openPlanModal(): void {
    this.error = '';
    this.showPlanModal = true;
  }

  closePlanModal(): void {
    this.showPlanModal = false;
  }

  onPlanSelected(planType: 'monthly' | 'annual'): void {
    this.showPlanModal = false;
    this.activatePlan(planType);
  }

  cancelPlan(): void {
    if (this.actionLoading) {
      return;
    }

    this.actionLoading = true;
    this.commentPlansService.cancelPlan().subscribe({
      next: () => {
        this.actionLoading = false;
        this.loadStatus();
      },
      error: () => {
        this.actionLoading = false;
        this.error = 'No se pudo cancelar el plan.';
      }
    });
  }

  get planLabel(): string {
    const planType = this.planStatus?.planType;
    if (planType === 'monthly') {
      return 'Mensual';
    }
    if (planType === 'annual') {
      return 'Anual';
    }
    return 'Free';
  }

  get currentPlanType(): 'free' | 'monthly' | 'annual' {
    const planType = this.planStatus?.planType;
    if (planType === 'monthly' || planType === 'annual') {
      return planType;
    }
    return 'free';
  }

  get badgeLabel(): string {
    return this.planStatus?.badge || 'Free';
  }

  get isActivePlan(): boolean {
    return this.planStatus?.planType === 'monthly' || this.planStatus?.planType === 'annual';
  }

  get usagePercent(): number {
    const usage = this.planStatus?.usage;
    if (!usage || !usage.limit) {
      return 0;
    }
    const percent = (usage.used / usage.limit) * 100;
    return Math.min(100, Math.max(0, Math.round(percent)));
  }

  get usageLabel(): string {
    const usage = this.planStatus?.usage;
    if (!usage) {
      return '';
    }
    if (this.planStatus?.planType === 'annual') {
      return 'Ilimitado';
    }
    return `${usage.used} de ${usage.limit}`;
  }
}
