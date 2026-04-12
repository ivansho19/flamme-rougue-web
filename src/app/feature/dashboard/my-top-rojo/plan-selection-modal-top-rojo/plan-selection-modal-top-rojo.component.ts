import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { TOP_ROJO_PLANS, TopRojoPlantType } from '../../../../shared/models/top-rojo.model';

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
export class PlanSelectionModalTopRojoComponent implements OnInit {
  @Input() isOpen = false;
  @Input() profileName = '';
  
  @Output() close = new EventEmitter<void>();
  @Output() planSelected = new EventEmitter<TopRojoPlanOption>();

  selectedPlanId: TopRojoPlantType | null = null;
  plans: TopRojoPlanOption[] = [];

  ngOnInit(): void {
    this.loadPlans();
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
    const selectedPlan = this.plans.find(p => p.id === this.selectedPlanId);
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
}
