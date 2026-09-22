import { Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import {
  NavigationCancel,
  NavigationEnd,
  NavigationError,
  NavigationStart,
  Router
} from '@angular/router';
import { delay, Subscription } from 'rxjs';
import { LoaderService } from '../../services/loader/loader.service';

const PAGE_TRANSITION_MS = 1000;

@Component({
  selector: 'app-layout',
  templateUrl: './layout.component.html',
  styleUrls: ['./layout.component.scss']
})
export class LayoutComponent implements OnInit, OnDestroy {
  public subscription = new Subscription();
  public loader = false;
  /** Full-screen loader used as the page-change transition (~1s). */
  pageTransitionLoader = false;
  loaderSubscription: Subscription = new Subscription();
  private scrollAnimationFrameId: number | null = null;
  private transitionHideTimer: ReturnType<typeof setTimeout> | null = null;
  private transitionStartedAt = 0;
  private isFirstNavigation = true;
  isHomePage = false;

  @ViewChild('drawer') drawer!: any;
  @ViewChild('filterDrawer') filterDrawer!: any;
  @ViewChild('layoutContent') layoutContent!: any;

  showMenu = true;
  typeFilter: any;
  indexTabGeneral: any;

  constructor(
    private loaderService: LoaderService,
    private router: Router
  ) {}

  ngOnInit() {
    this.showLoader();
    this.watchPageTransitions();
  }

  get showChromeHidden(): boolean {
    return this.loader || this.pageTransitionLoader;
  }

  private watchPageTransitions(): void {
    this.subscription.add(
      this.router.events.subscribe((event) => {
        if (event instanceof NavigationStart) {
          if (this.isFirstNavigation) {
            this.isFirstNavigation = false;
            return;
          }
          this.startPageTransition();
          return;
        }

        if (
          event instanceof NavigationEnd ||
          event instanceof NavigationCancel ||
          event instanceof NavigationError
        ) {
          this.finishPageTransition();
        }
      })
    );
  }

  private startPageTransition(): void {
    if (this.transitionHideTimer) {
      clearTimeout(this.transitionHideTimer);
      this.transitionHideTimer = null;
    }
    this.transitionStartedAt = Date.now();
    this.pageTransitionLoader = true;
  }

  private finishPageTransition(): void {
    if (!this.pageTransitionLoader) {
      return;
    }

    const elapsed = Date.now() - this.transitionStartedAt;
    const remaining = Math.max(0, PAGE_TRANSITION_MS - elapsed);

    if (this.transitionHideTimer) {
      clearTimeout(this.transitionHideTimer);
    }

    this.transitionHideTimer = setTimeout(() => {
      this.pageTransitionLoader = false;
      this.transitionHideTimer = null;
    }, remaining);
  }

  showLoader() {
    this.loaderSubscription = this.loaderService
      .getLoaderState()
      .pipe(delay(0))
      .subscribe((response: any) => {
        this.loader = !!response?.state;
      });
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
    this.pageTransitionLoader = false;
    if (this.scrollAnimationFrameId !== null) {
      cancelAnimationFrame(this.scrollAnimationFrameId);
      this.scrollAnimationFrameId = null;
    }
    if (this.transitionHideTimer) {
      clearTimeout(this.transitionHideTimer);
      this.transitionHideTimer = null;
    }
    this.subscription.unsubscribe();
    this.loaderSubscription.unsubscribe();
  }
}
