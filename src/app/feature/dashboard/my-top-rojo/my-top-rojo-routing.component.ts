import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MyTopRojoComponent } from './my-top-rojo.component';


const routes: Routes = [
  {
    path: '',
    component: MyTopRojoComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MyTopRojoRoutingModule {}
