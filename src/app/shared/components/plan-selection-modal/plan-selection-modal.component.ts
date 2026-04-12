import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { PlanOption } from '../../model/planes.model';

@Component({
  selector: 'app-plan-selection-modal',
  templateUrl: './plan-selection-modal.component.html',
  styleUrls: ['./plan-selection-modal.component.scss']
})
export class PlanSelectionModalComponent implements OnInit {
  @Input() isOpen = false;
  @Input() profileName = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<PlanOption>();

  selectedPlanId: number | null = null;

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

  ngOnInit(): void {
    // Pre-seleccionar Plan Pro por defecto
    this.selectedPlanId = 2;
  }

  selectPlan(planId: number): void {
    this.selectedPlanId = planId;
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
}
