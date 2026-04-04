import { Component, EventEmitter, Input, Output } from "@angular/core";
import { PlanOption } from "../../model/planes.model";
@Component({
    selector: "app-planes",
    templateUrl: "./planes.component.html",
    styleUrls: ["./planes.component.scss"],
})
export class PlanesComponent {
    @Input() title: string = "Elige tu plan";
    @Input() subtitle: string = "Publica tu perfil y comienza a recibir visitas";
    @Input() note: string = "";
    @Input() selectedPlanId: number | null = null;

    @Input() plans: PlanOption[] = [
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

    @Output() planSelected = new EventEmitter<PlanOption>();

    selectedPlan: number = 2;

    selectPlan(plan: number) {
        this.selectedPlan = plan;
        const selected = this.plans.find(item => item.id === plan);
        if (selected) {
            this.planSelected.emit(selected);
        }
    }

    trackById(_: number, plan: PlanOption): number {
        return plan.id;
    }
}
