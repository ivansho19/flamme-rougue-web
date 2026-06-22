export type CommentPlanBadgeType = 'monthly' | 'annual';

export interface CommentPlanBadgeSource {
  planType?: string | null;
  status?: string | null;
  badge?: string | null;
  commentPlan?: {
    planType?: string | null;
    status?: string | null;
    badge?: string | null;
  } | null;
}

export class CommentPlanBadgeHelper {
  static resolve(source: CommentPlanBadgeSource | null | undefined): CommentPlanBadgeType | null {
    if (!source) {
      return null;
    }

    const status = (source.status ?? source.commentPlan?.status ?? 'active').toLowerCase();
    if (status !== 'active') {
      return null;
    }

    const planType = (source.planType ?? source.commentPlan?.planType ?? '').toLowerCase();
    if (planType === 'monthly') {
      return 'monthly';
    }
    if (planType === 'annual') {
      return 'annual';
    }

    const badge = (source.badge ?? source.commentPlan?.badge ?? '').toLowerCase();
    if (badge.includes('hombre') || badge.includes('top')) {
      return 'annual';
    }
    if (badge.includes('miembro') || badge.includes('member')) {
      return 'monthly';
    }

    return null;
  }
}
