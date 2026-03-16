import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ProfilesComponent } from './profiles.component';
import { ProfilesRoutingModule } from './profiles-routing.component';
import { ComponentsModule } from '../../shared/components/components.module';
@NgModule({
  declarations: [ProfilesComponent],
  exports: [ ProfilesComponent, ProfilesRoutingModule],
  imports: [
    ProfilesRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule
],
})
export class ProfilesModule {}
