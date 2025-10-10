import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.component';
import { ComponentsModule } from '../../shared/components/components.module';

@NgModule({
  declarations: [LoginComponent],
  exports: [ LoginComponent, LoginRoutingModule],
  imports: [
    LoginRoutingModule, 
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class LoginModule {}
