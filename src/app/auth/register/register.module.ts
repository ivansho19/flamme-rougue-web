import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RegisterComponent } from './register.component';
import { RegisterRoutingModule } from './register-routing.component';
import { UserRegisterFormComponent } from './components/user-register-form/user-register-form.component';
import { AdvertisersRegisterFormComponent } from './components/advertisers-register-form/advertisers-register-form.component';
import { ComponentsModule } from '../../shared/components/components.module';

@NgModule({
  declarations: [RegisterComponent, UserRegisterFormComponent, AdvertisersRegisterFormComponent],
  exports: [RegisterComponent, UserRegisterFormComponent, RegisterRoutingModule, AdvertisersRegisterFormComponent],
  imports: [
    RegisterRoutingModule, 
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class RegisterModule {}
