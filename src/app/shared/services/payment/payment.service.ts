import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private API = 'http://localhost:5000/api/payment';
  private readonly jsonHeaders = new HttpHeaders({
    Accept: 'application/json',
    'Content-Type': 'application/json'
  });

  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number) {
    return this.http.post<{ clientSecret: string }>(
      `${this.API}/create-payment-intent`,
      { amount }
    );
  }

  createPayPalOrder(total: number, currency: string) {
    const payload: { total: number; currency: string } = {
      total,
      currency
    };

    return this.http.post<{ orderId: string; status: string; approveUrl?: string }>(
      environment.api_paypal_create_order,
      payload,
      { headers: this.jsonHeaders }
    );
  }

  capturePayPalOrder(orderId: string) {
    return this.http.post<{ orderId: string; status: string; payerId?: string; payerEmail?: string }>(
      environment.api_paypal_capture_order,
      { orderId },
      { headers: this.jsonHeaders }
    );
  }

}
