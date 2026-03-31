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
    @Input() plan: number | null = null;
    @Input() buttonText: string = 'Go somewhere';
    @Input() buttonUrl: string = '#';

    get planBadgeLabel(): string | null {
        if (this.plan === 2) {
            return 'Pro';
        }
        if (this.plan === 3) {
            return 'Premium';
        }
        if (this.plan === 0 || this.plan === 1) {
            return 'Basico';
        }
        return null;
    }

    get planBadgeClass(): string {
        if (this.plan === 2) {
            return 'plan-pro';
        }
        if (this.plan === 3) {
            return 'plan-premium';
        }
        return 'plan-basic';
    }
}