import { Component, Input } from '@angular/core';
import { CommentPlanBadgeType } from '../../clases/commentPlanBadge';

@Component({
  selector: 'app-comment-plan-badge',
  templateUrl: './comment-plan-badge.component.html',
  styleUrls: ['./comment-plan-badge.component.scss']
})
export class CommentPlanBadgeComponent {
  @Input() badgeType: CommentPlanBadgeType | null = null;
  @Input() compact = false;
}
