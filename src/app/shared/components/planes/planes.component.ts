import { Component, EventEmitter, Input, Output } from "@angular/core";

export interface PlanOption {
    id: string;
    name: string;
    price: string;
    period?: string;
    description?: string;
    features?: string[];
    badge?: string;
    highlight?: boolean;
    buttonText?: string;
    cardClass?: string;
    buttonClass?: string;
}

@Component({
    selector: "app-planes",
    templateUrl: "./planes.component.html",
    styleUrls: ["./planes.component.scss"],
})
export class PlanesComponent {
    @Input() title: string = "Elige tu plan";
    @Input() subtitle: string = "Publica tu perfil y comienza a recibir visitas";
    @Input() note: string = "";
    @Input() selectedPlanId: string | null = null;

    @Input() plans: PlanOption[] = [
        {
            id: "basic",
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
            id: "pro",
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
            id: "vip",
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

    selectedPlan: string = 'pro';

    selectPlan(plan: string) {
        this.selectedPlan = plan;
    }

    trackById(_: number, plan: PlanOption): string {
        return plan.id;
    }
}
