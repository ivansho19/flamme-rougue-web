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
    @Input() buttonText: string = 'Go somewhere';
    @Input() buttonUrl: string = '#';
}