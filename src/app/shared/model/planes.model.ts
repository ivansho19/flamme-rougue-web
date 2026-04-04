export interface PlanOption {
    id: number;
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