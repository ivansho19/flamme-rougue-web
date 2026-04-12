import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../shared/components/components.module';
import { MyTopRojoRoutingModule } from './my-top-rojo-routing.component';
import { MyTopRojoComponent } from './my-top-rojo.component';
import { CreateTopRojoFormComponent } from './create-top-rojo-form/create-top-rojo-form.component';
import { PlanSelectionModalTopRojoComponent } from './plan-selection-modal-top-rojo/plan-selection-modal-top-rojo.component';

@NgModule({
  declarations: [
    MyTopRojoComponent,
    CreateTopRojoFormComponent,
    PlanSelectionModalTopRojoComponent
  ],
  exports: [MyTopRojoComponent, MyTopRojoRoutingModule],
  imports: [
    MyTopRojoRoutingModule,
    CommonModule,
    RouterModule,
    FormsModule,
    ReactiveFormsModule,
    ComponentsModule,
    TranslateModule
  ],
})
export class MyTopRojoModule {}
