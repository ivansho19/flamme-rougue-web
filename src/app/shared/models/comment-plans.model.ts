export interface CommentPlanUsage {
  used: number;
  limit: number;
  window: string;
}

export interface CommentPlanStatus {
  planType: string;
  status: string;
  badge: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  usage?: CommentPlanUsage;
}

export interface CommentPlanCancelResponse {
  message: string;
  status: string;
}
