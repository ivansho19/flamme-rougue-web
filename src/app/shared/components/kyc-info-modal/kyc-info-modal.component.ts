import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-kyc-info-modal',
  templateUrl: './kyc-info-modal.component.html',
  styleUrls: ['./kyc-info-modal.component.scss']
})
export class KycInfoModalComponent implements OnInit, OnDestroy {
  @Input() imageSrc = '';
  @Input() set isOpen(value: boolean) {
    this._isOpen = value;
  }

  get isOpen(): boolean {
    return this._isOpen;
  }

  @Output() close = new EventEmitter<void>();

  private _isOpen = false;
  private langSub?: Subscription;

  constructor(private translateService: TranslateService) {}

  ngOnInit(): void {
    this.setImageForLang(this.translateService.currentLang || this.translateService.getDefaultLang());
    this.langSub = this.translateService.onLangChange.subscribe(event => {
      this.setImageForLang(event.lang);
    });
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
  }

  open(): void {
    this._isOpen = true;
  }

  onClose(): void {
    this._isOpen = false;
    this.close.emit();
  }

  private setImageForLang(lang?: string | null): void {
    const normalized = (lang || 'es').toLowerCase();
    const imageMap: Record<string, string> = {
      es: 'assets/images/kyc_es.png',
      en: 'assets/images/kyc_en.png',
      nl: 'assets/images/kyc_nl.png',
      fr: 'assets/images/kyc_bl.png'
    };

    const mapped = imageMap[normalized] || imageMap[normalized.split('-')[0]];
    this.imageSrc = mapped || imageMap['es'];
  }
}
