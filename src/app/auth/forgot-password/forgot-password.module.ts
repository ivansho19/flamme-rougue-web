import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from '../../shared/components/components.module';
import { ForgotPasswordComponent } from './forgot-password.component';
import { ForgotPasswordRoutingModule } from './forgot-password-routing.component';

@NgModule({
  declarations: [ForgotPasswordComponent],
  exports: [ForgotPasswordComponent, ForgotPasswordRoutingModule],
  imports: [
    ForgotPasswordRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
  ]
})
export class ForgotPasswordModule {}
