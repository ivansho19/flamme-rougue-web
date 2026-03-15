import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private API = 'http://localhost:5000/api/payment';

  constructor(private http: HttpClient) {}

  createPaymentIntent(amount: number) {
    return this.http.post<{ clientSecret: string }>(
      `${this.API}/create-payment-intent`,
      { amount }
    );
  }
}