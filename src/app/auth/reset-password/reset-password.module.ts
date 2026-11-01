import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from '../../shared/components/components.module';
import { ResetPasswordComponent } from './reset-password.component';
import { ResetPasswordRoutingModule } from './reset-password-routing.component';

@NgModule({
  declarations: [ResetPasswordComponent],
  exports: [ResetPasswordComponent, ResetPasswordRoutingModule],
  imports: [
    ResetPasswordRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
  ]
})
export class ResetPasswordModule {}
