import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatChipsModule } from '@angular/material/chips';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatNativeDateModule } from '@angular/material/core';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../shared/components/components.module';
import { UpdateProfileRoutingModule } from './update-profile-routing.component';
import { UpdateProfileComponent } from './update-profile.component';

@NgModule({
  declarations: [UpdateProfileComponent],
  exports: [UpdateProfileComponent, UpdateProfileRoutingModule],
  imports: [
    UpdateProfileRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    MatChipsModule,
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
    MatNativeDateModule,
    TranslateModule,
  ],
})
export class UpdateProfileModule {}
