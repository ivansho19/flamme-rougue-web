import { Component, Input } from "@angular/core";

@Component({
    selector: "app-card",
    templateUrl: "./card.component.html",
    styleUrls: ["./card.component.scss"],
})
export class CardComponent {
    @Input() image: string = '';
    @Input() age: number = 0;
    @Input() title: string = '';
    @Input() describe: string = '';
    @Input() city: string = '';
    @Input() plan: string[] | null = null;
    @Input() buttonText: string = 'Go somewhere';
    @Input() buttonUrl: string = '#';

    get planBadgeLabel(): string | null {
        if (this.plan && this.plan[0] === '2') {
            return 'Pro';
        }
        if (this.plan && this.plan[0] === '3') {
            return 'Premium';
        }
        if (this.plan && (this.plan[0] === '0' || this.plan[0] === '1')) {
            return 'Basico';
        }
        return null;
    }

    get planBadgeClass(): string {
        if (this.plan && this.plan[0] === '2') {
            return 'plan-pro';
        }
        if (this.plan && this.plan[0] === '3') {
            return 'plan-premium';
        }
        return 'plan-basic';
    }
}