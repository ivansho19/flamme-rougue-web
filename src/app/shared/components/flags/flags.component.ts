import { Component, EventEmitter, Input, Output, output } from "@angular/core";

@Component({
    selector: "app-flags",
    templateUrl: "./flags.component.html",
    styleUrls: ["./flags.component.scss"],
})
export class FlagsComponent {
    @Input() flagOptions: any[] = [];
    @Input() selectedFlagUrl: string = '';
    @Input() currentLang: string = '';
    @Output() translate = new EventEmitter<any>();

    setFlag(flag: { url: string; label: string; lang: string }) {
        this.selectedFlagUrl = flag.url;
        this.currentLang = flag.lang;
        localStorage.setItem('app-lang', flag.lang);
        this.translate.emit(flag);
    }

}