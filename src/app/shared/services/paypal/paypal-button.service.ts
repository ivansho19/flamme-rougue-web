import { Injectable } from '@angular/core';

type PayPalButtonsConfig = {
  style?: Record<string, string>;
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

  waitForContainer(getContainer: () => HTMLElement | null | undefined, maxAttempts = 30): Promise<HTMLElement> {
    return new Promise((resolve, reject) => {
      const attempt = (index: number) => {
        const container = getContainer();
        if (container) {
          resolve(container);
          return;
        }

        if (index >= maxAttempts) {
          reject(new Error('Contenedor de PayPal no disponible. Cierra y vuelve a abrir el modal.'));
          return;
        }

        setTimeout(() => attempt(index + 1), 50);
      };

      attempt(0);
    });
  }

  async renderButtons(options: RenderButtonsOptions): Promise<void> {
    const { container, clientId, currency, config } = options;
    const normalizedClientId = clientId?.trim();

    if (!normalizedClientId) {
      throw new Error('Falta configurar el Client ID de PayPal.');
    }

    await this.ensureSdkLoaded(normalizedClientId, currency);

    const paypal = (window as any).paypal;
    if (!paypal?.Buttons) {
      throw new Error('PayPal SDK no expuso Buttons. Revisa el Client ID.');
    }

    container.innerHTML = '';

    await paypal.Buttons({
      ...config,
      style: {
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        ...config.style
      }
    }).render(container);
  }

  private buildSdkUrl(clientId: string, currency: string): string {
    const params = new URLSearchParams({
      'client-id': clientId,
      currency: currency.toUpperCase(),
      'disable-funding': 'card'
    });

    return `https://www.paypal.com/sdk/js?${params.toString()}`;
  }

  private ensureSdkLoaded(clientId: string, currency: string): Promise<void> {
    if ((window as any).paypal?.Buttons) {
      return Promise.resolve();
    }

    if (this.scriptPromise) {
      return this.scriptPromise;
    }

    this.scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.buildSdkUrl(clientId, currency);
      script.async = true;
      script.onload = () => {
        if ((window as any).paypal?.Buttons) {
          resolve();
          return;
        }

        this.scriptPromise = null;
        reject(new Error('PayPal SDK cargó sin el componente Buttons.'));
      };
      script.onerror = () => {
        this.scriptPromise = null;
        reject(new Error(
          'PayPal rechazó el Client ID (HTTP 406). Verifica que copiaste el Client ID (no el Secret) desde Sandbox > Apps & Credentials > tu app REST.'
        ));
      };
      document.body.appendChild(script);
    });

    return this.scriptPromise;
  }
}
