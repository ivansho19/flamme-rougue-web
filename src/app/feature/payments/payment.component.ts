import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-payment-demo',
  templateUrl: './payment.component.html',
})
export class PaymentComponent implements OnInit {
  stripe: any;
  elements: any;
  card: any;
  clientSecret!: string;

  constructor(private http: HttpClient) {}

  async ngOnInit() {
    this.stripe = await loadStripe('pk_test_51Smxr4RiblXoHfV6umCmgY3YwzQRZKTIeOfTvWevVr8X0dEb61b7mzADZvgnZvoFlzul2CRn6flTNkjNXRdAeWWN00aiEWbCiA');
    

    this.http.post<any>('http://localhost:5000/api/payment/create-payment-intent', {
        amount: 1000,
        email: 'ivanmanrique1993@gmail.com'
    })
      .subscribe(async res => {
        this.clientSecret = res.clientSecret;

        this.elements = this.stripe.elements();
        this.card = this.elements.create('card');
        this.card.mount('#card-element');
      });
  }

  async pay() {
    const result = await this.stripe.confirmCardPayment(this.clientSecret, {
      payment_method: {
        card: this.card,
      },
    });
    if (result.error) {
      alert(result.error.message);
    } else {
      alert('Pago realizado con éxito 🎉');
    }
  }
}
