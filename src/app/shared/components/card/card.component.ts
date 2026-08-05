import { Component, Input } from "@angular/core";

@Component({
    selector: "app-card",
    templateUrl: "./card.component.html",
    styleUrls: ["./card.component.scss"],
})
export class CardComponent {
    /** Short public name shown as the primary heading. */
    @Input() title: string = '';
    /** Advertiser headline / SEO title, clamped to 2 lines. */
    @Input() adTitle: string = '';
    @Input() image: string = '';
    @Input() age: number = 0;
    @Input() describe: string = '';
    @Input() city: string = '';
    @Input() plan: string[] | null = null;
    @Input() buttonText: string = 'Go somewhere';
    @Input() buttonUrl: string = '#';
    @Input() isVerified: boolean = false;

    get planBadgeImage(): string | null {
        if (this.plan && this.plan[0] === '2') {
            return 'assets/images/icon_pro.png';
        }
        if (this.plan && this.plan[0] === '3') {
            return 'assets/images/icon_vip.png';
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
