import {
  AfterViewInit,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild
} from '@angular/core';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    turnstile?: {
      render: (
        element: HTMLElement | string,
        options: Record<string, unknown>
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId?: string) => void;
    };
    onCfTurnstileApiLoad?: () => void;
  }
}

@Component({
  selector: 'app-cf-turnstile',
  templateUrl: './cf-turnstile.component.html',
  styleUrls: ['./cf-turnstile.component.scss']
})
export class CfTurnstileComponent implements AfterViewInit, OnChanges, OnDestroy {
  @ViewChild('widgetHost', { static: true }) widgetHost!: ElementRef<HTMLDivElement>;

  @Input() language = 'es';
  @Output() tokenChange = new EventEmitter<string>();
  @Output() error = new EventEmitter<void>();

  private widgetId: string | null = null;
  private static scriptLoading: Promise<void> | null = null;

  ngAfterViewInit(): void {
    this.mountWidget();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['language'] && !changes['language'].firstChange) {
      this.remountWidget();
    }
  }

  ngOnDestroy(): void {
    this.removeWidget();
  }

  reset(): void {
    this.tokenChange.emit('');
    if (this.widgetId && window.turnstile) {
      window.turnstile.reset(this.widgetId);
    }
  }

  private async mountWidget(): Promise<void> {
    try {
      await CfTurnstileComponent.loadScript();
      this.renderWidget();
    } catch (err) {
      console.error('Cloudflare Turnstile failed to load', err);
      this.error.emit();
    }
  }

  private remountWidget(): void {
    this.removeWidget();
    this.mountWidget();
  }

  private renderWidget(): void {
    if (!window.turnstile || !this.widgetHost?.nativeElement) {
      return;
    }

    this.widgetHost.nativeElement.innerHTML = '';
    this.widgetId = window.turnstile.render(this.widgetHost.nativeElement, {
      sitekey: environment.turnstileSiteKey,
      theme: 'light',
      language: this.resolveTurnstileLang(this.language),
      callback: (token: string) => this.tokenChange.emit(token || ''),
      'expired-callback': () => this.tokenChange.emit(''),
      'error-callback': () => {
        this.tokenChange.emit('');
        this.error.emit();
      }
    });
  }

  private removeWidget(): void {
    if (this.widgetId && window.turnstile) {
      try {
        window.turnstile.remove(this.widgetId);
      } catch {
        // Widget already gone
      }
    }
    this.widgetId = null;
    if (this.widgetHost?.nativeElement) {
      this.widgetHost.nativeElement.innerHTML = '';
    }
  }

  private resolveTurnstileLang(lang: string): string {
    const normalized = (lang || 'es').toLowerCase().split('-')[0];
    const supported = new Set(['es', 'en', 'fr', 'nl', 'pt', 'de', 'it']);
    return supported.has(normalized) ? normalized : 'auto';
  }

  private static loadScript(): Promise<void> {
    if (window.turnstile) {
      return Promise.resolve();
    }

    if (CfTurnstileComponent.scriptLoading) {
      return CfTurnstileComponent.scriptLoading;
    }

    CfTurnstileComponent.scriptLoading = new Promise<void>((resolve, reject) => {
      const existing = document.querySelector<HTMLScriptElement>('script[data-cf-turnstile]');
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('Turnstile script error')));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-cf-turnstile', 'true');
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('Turnstile script failed to load'));
      document.head.appendChild(script);
    });

    return CfTurnstileComponent.scriptLoading;
  }
}
