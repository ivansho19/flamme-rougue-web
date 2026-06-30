import {
  AfterViewInit,
  Component,
  ElementRef,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import EmblaCarousel, { EmblaCarouselType, EmblaOptionsType } from 'embla-carousel';
import Autoplay from 'embla-carousel-autoplay';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';

export interface EmblaItem {
  images: string[];
  title: string;
  description: string;
  phone: string;
  buttonText?: string;
  buttonUrl?: string;
  isPromo?: boolean;
}

const DEFAULT_TOP_ROJO_ADS: Record<string, string> = {
  es: 'assets/images/ads_top_rojo_es.jpeg',
  en: 'assets/images/ads_top_rojo_en.jpeg',
  fr: 'assets/images/ads_top_rojo_fr.jpeg',
  nl: 'assets/images/ads_top_rojo_nl.jpeg',
};

@Component({
  selector: 'app-banner-carousel',
  templateUrl: './banner-carousel.component.html',
  styleUrls: ['./banner-carousel.component.scss'],
})
export class BannerCarouselComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
  @Input() items: EmblaItem[] = [];
  @ViewChild('embla') emblaRef!: ElementRef<HTMLDivElement>;

  displayItems: EmblaItem[] = [];
  private embla?: EmblaCarouselType;
  private langSub?: Subscription;
  private viewReady = false;

  options: EmblaOptionsType = {
    loop: true,
    align: 'start',
    skipSnaps: false,
  };

  constructor(private translate: TranslateService) {}

  ngOnInit(): void {
    this.rebuildDisplayItems();
    this.langSub = this.translate.onLangChange.subscribe(() => {
      this.rebuildDisplayItems();
      this.scheduleEmblaRefresh();
    });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['items']) {
      this.rebuildDisplayItems();
      this.scheduleEmblaRefresh();
    }
  }

  ngAfterViewInit(): void {
    this.viewReady = true;
    this.initEmbla();
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.embla?.destroy();
  }

  scrollPrev(): void {
    this.embla?.scrollPrev();
  }

  scrollNext(): void {
    this.embla?.scrollNext();
  }

  private rebuildDisplayItems(): void {
    this.displayItems = [this.buildDefaultPromoItem(), ...(this.items ?? [])];
  }

  getUserName(): string | null {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }

  private buildDefaultPromoItem(): EmblaItem {
    return {
      isPromo: true,
      images: [this.getDefaultAdImage()],
      title: this.translate.instant('TOP_ROJO.TITLE'),
      description: '',
      phone: '',
      buttonUrl: this.getUserName() ? '/dashboard/my-top-rojo' : '/auth/login',
    };
  }

  private getDefaultAdImage(): string {
    const lang = this.resolveLang();
    return DEFAULT_TOP_ROJO_ADS[lang] ?? DEFAULT_TOP_ROJO_ADS['es'];
  }

  private resolveLang(): string {
    const lang = this.translate.currentLang || this.translate.getDefaultLang() || 'es';
    return lang.toLowerCase().split('-')[0];
  }

  private scheduleEmblaRefresh(): void {
    queueMicrotask(() => this.reInitEmbla());
  }

  private initEmbla(): void {
    if (!this.emblaRef?.nativeElement) {
      return;
    }

    this.embla = EmblaCarousel(this.emblaRef.nativeElement, this.options, [Autoplay()]);
  }

  private reInitEmbla(): void {
    if (!this.viewReady || !this.emblaRef?.nativeElement) {
      return;
    }

    this.embla?.destroy();
    this.initEmbla();
  }
}
