import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommentPlansComponent } from './comment-plans.component';

const routes: Routes = [
  {
    path: '',
    component: CommentPlansComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class CommentPlansRoutingModule {}
