import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../services/loader/loader.service';

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']})

export class LayoutComponent implements OnInit, OnDestroy {
  public subscription = new Subscription
  public loader = false
  loaderSubscription: Subscription = new Subscription;
  private scrollAnimationFrameId: number | null = null;
  isHomePage = false;


  @ViewChild('drawer') drawer!: any;
  @ViewChild('filterDrawer') filterDrawer!: any;
  @ViewChild('layoutContent') layoutContent!: any;
  
  
  showMenu = true;
  typeFilter: any;
  indexTabGeneral: any;


  constructor(private loaderService: LoaderService) {}

  ngOnInit() {
    this.showLoader();
  }

  showLoader() {
        this.loaderSubscription = this.loaderService.getLoaderState().pipe(delay(0)).subscribe(
            (response: any) => {
                this.loader = !!response?.state;
            }
        )
    }

  scrollToTop(): void {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      this.setAllScrollPositions(0);
      return;
    }

    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }

    const duration = 650;
    const startTop = this.getCurrentScrollPosition();
    if (startTop <= 0) {
      return;
    }

    const startedAt = performance.now();
    const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

    const tick = (now: number) => {
      const elapsed = now - startedAt;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOutCubic(progress);
      const nextTop = Math.max(startTop * (1 - eased), 0);

      this.setAllScrollPositions(nextTop);

      if (progress < 1) {
        this.scrollAnimationFrameId = requestAnimationFrame(tick);
        return;
      }

      this.scrollAnimationFrameId = null;
      this.setAllScrollPositions(0);
    };

    this.scrollAnimationFrameId = requestAnimationFrame(tick);
  }

  private getCurrentScrollPosition(): number {
    const contentEl = this.layoutContent?.nativeElement as HTMLElement | undefined;
    const positions = [
      window.pageYOffset || 0,
      document.documentElement.scrollTop || 0,
      document.body.scrollTop || 0,
      document.scrollingElement?.scrollTop || 0,
      contentEl?.scrollTop || 0
    ];

    return Math.max(...positions);
  }

  private setAllScrollPositions(top: number): void {
    window.scrollTo(0, top);

    document.documentElement.scrollTop = top;
    document.body.scrollTop = top;

    if (document.scrollingElement) {
      document.scrollingElement.scrollTop = top;
    }

    const contentEl = this.layoutContent?.nativeElement as HTMLElement | undefined;
    if (contentEl) {
      contentEl.scrollTop = top;
    }
  }

  ngOnDestroy(): void {
    this.loader = false;
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }
    this.subscription.unsubscribe();
    this.loaderSubscription.unsubscribe();
  }

}

