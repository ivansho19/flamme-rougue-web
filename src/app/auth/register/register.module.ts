import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { RegisterRoutingModule } from './register-routing.component';
import { UserRegisterFormComponent } from './components/user-register-form/user-register-form.component';

@NgModule({
  declarations: [RegisterComponent, UserRegisterFormComponent],
  exports: [RegisterComponent, UserRegisterFormComponent, RegisterRoutingModule],
  imports: [
    RegisterRoutingModule, 
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule
],
})
export class RegisterModule {}
