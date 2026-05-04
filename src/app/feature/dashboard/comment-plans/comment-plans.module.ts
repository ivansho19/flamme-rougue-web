import { CommonModule } from '@angular/common';
import { NgModule } from '@angular/core';
import { RouterModule } from '@angular/router';
import { ComponentsModule } from '../../../shared/components/components.module';
import { CommentPlansRoutingModule } from './comment-plans-routing.component';
import { CommentPlansComponent } from './comment-plans.component';
import { PlanSelectionModalCommentPlansComponent } from './plan-selection-modal-comment-plans/plan-selection-modal-comment-plans.component';
import { TranslateModule } from '@ngx-translate/core';

@NgModule({
  declarations: [CommentPlansComponent, PlanSelectionModalCommentPlansComponent],
  exports: [CommentPlansComponent, PlanSelectionModalCommentPlansComponent,CommentPlansRoutingModule],
  imports: [CommentPlansRoutingModule, CommonModule, RouterModule, ComponentsModule, TranslateModule]
})
export class CommentPlansModule {}
