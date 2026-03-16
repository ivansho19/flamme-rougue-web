import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from '../../shared/components/components.module';
import { PaymentComponent } from './payment.component';
import { PaymentRoutingModule } from './payment-routing.component';
@NgModule({
  declarations: [PaymentComponent],
  exports: [ PaymentComponent, PaymentRoutingModule],
  imports: [
    PaymentRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class PaymentModule {}
