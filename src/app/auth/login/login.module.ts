import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { LoginComponent } from './login.component';
import { LoginRoutingModule } from './login-routing.component';

@NgModule({
  declarations: [LoginComponent],
  exports: [ LoginComponent, LoginRoutingModule],
  imports: [
    LoginRoutingModule, 
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
],
})
export class LoginModule {}
