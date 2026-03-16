import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ComponentsModule } from '../../shared/components/components.module';
import { ProfileEditRoutingModule } from './create-profile-routing.component';
import { ProfileEditComponent } from './create-profile.component';
@NgModule({
  declarations: [ProfileEditComponent],
  exports: [ ProfileEditComponent, ProfileEditRoutingModule],
  imports: [
    ProfileEditRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class ProfileEditModule {}
