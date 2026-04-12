import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { ComponentsModule } from '../../../shared/components/components.module';
import { MyTopRojoRoutingModule } from './my-top-rojo-routing.component';
import { MyTopRojoComponent } from './my-top-rojo.component';

@NgModule({
  declarations: [MyTopRojoComponent],
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
