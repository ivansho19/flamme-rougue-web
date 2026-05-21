import { Injectable } from '@angular/core';

type PayPalButtonsConfig = {
  style?: Record<string, string>;
  fundingSource?: unknown;
  createOrder: (data: unknown, actions: any) => Promise<string> | string;
  onApprove: (data: any, actions: any) => Promise<void> | void;
  onError?: (error: unknown) => void;
};

type RenderButtonsOptions = {
  container: HTMLElement;
  clientId: string;
  currency: string;
  config: PayPalButtonsConfig;
};

@Injectable({ providedIn: 'root' })
export class PayPalButtonService {
  private scriptPromise: Promise<void> | null = null;

  async renderButtons(options: RenderButtonsOptions): Promise<void> {
    const { container, clientId, currency, config } = options;

    if (!clientId) {
      throw new Error('Falta configurar el Client ID de PayPal.');
    }

    await this.ensureSdkLoaded(clientId, currency);

    const paypal = (window as any).paypal;
    if (!paypal) {
      throw new Error('No se pudo cargar PayPal. Intenta nuevamente.');
    }

    const mergedConfig: PayPalButtonsConfig = {
      ...config,
      fundingSource: (window as any).paypal?.FUNDING?.PAYPAL,
      style: {
        ...config.style,
        label: 'paypal'
      }
    };

    paypal.Buttons(mergedConfig).render(container);
  }

  private ensureSdkLoaded(clientId: string, currency: string): Promise<void> {
    if ((window as any).paypal) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=${currency}&disable-funding=card`;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => reject();
      document.body.appendChild(script);
    });

    return this.scriptPromise;
  }
}
