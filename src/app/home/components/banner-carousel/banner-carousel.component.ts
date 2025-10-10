import { AfterViewInit, Component, ElementRef, Input, OnDestroy, ViewChild } from "@angular/core";
import EmblaCarousel, { EmblaOptionsType, EmblaCarouselType } from "embla-carousel";
import Autoplay from "embla-carousel-autoplay";
export interface EmblaItem {
  images: string[];
  title: string;
  description: string;
  phone: string;
  buttonText?: string;
  buttonUrl?: string;
}
@Component({
  selector: "app-banner-carousel",
  templateUrl: "./banner-carousel.component.html",
  styleUrls: ["./banner-carousel.component.scss"],
})
export class BannerCarouselComponent implements AfterViewInit, OnDestroy {
  @Input() items: EmblaItem[] = [];
  @ViewChild('embla') emblaRef!: ElementRef<HTMLDivElement>;
  private embla?: EmblaCarouselType;

  options: EmblaOptionsType = {
    loop: true,
    align: 'start',
    skipSnaps: false
  };

  ngAfterViewInit() {
    this.embla = EmblaCarousel(this.emblaRef.nativeElement, this.options, [Autoplay()]);
  }

  ngOnDestroy() {
    if (this.embla) {
      this.embla.destroy();
    }
  }

  scrollPrev() {
    this.embla?.scrollPrev();
  }

  scrollNext() {
    this.embla?.scrollNext();
  }
}