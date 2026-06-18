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

export interface AdminUserCommentPlan {
  _id?: string;
  id?: string;
  userId: string;
  planType: string;
  status: string;
  badge?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminUser {
  _id: string;
  name: string;
  lastName: string;
  email: string;
  isAdmin: boolean;
  isActivePlan: boolean;
  plan: string;
  createdAt: string;
  updatedAt: string;
  commentPlan: AdminUserCommentPlan | null;
}

export interface GetAllUsersResponse {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  data: AdminUser[];
}

export type CommentPlanStatusValue = 'pending' | 'active' | 'cancelled' | 'expired';

export interface UpdateCommentPlanStatusPayload {
  status: CommentPlanStatusValue;
}

export interface UpdateCommentPlanStatusData {
  id: string;
  userId: string;
  planType: string;
  status: CommentPlanStatusValue;
  badge: string | null;
  startedAt: string | null;
  expiresAt: string | null;
  updatedAt: string;
}

export interface UpdateCommentPlanStatusResponse {
  message: string;
  data: UpdateCommentPlanStatusData;
}

export interface AdminCommentPlanRecord {
  _id?: string;
  id?: string;
  userId?: string;
  planType?: string;
  status?: string;
  badge?: string | null;
  startedAt?: string | null;
  expiresAt?: string | null;
  createdAt?: string | null;
  user?: {
    _id?: string;
    id?: string;
    name?: string;
    lastName?: string;
    email?: string;
    createdAt?: string;
  };
}
