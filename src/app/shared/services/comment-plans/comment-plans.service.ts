import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { CommentPlanCancelResponse, CommentPlanStatus } from '../../models/comment-plans.model';
import { AuthHeaders } from '../../clases/getAuthHeaders';

@Injectable({ providedIn: 'root' })
export class CommentPlansService {
  private readonly apiActivate = environment.api_comment_plans_activate;
  private readonly apiStatus = environment.api_comment_plans_status;
  private readonly apiCancel = environment.api_comment_plans_cancel;

  constructor(private http: HttpClient) {}

  activatePlan(planType: 'monthly' | 'annual', status: 'pending' | 'active') {
    return this.http.post<CommentPlanStatus>(
      this.apiActivate,
      { planType, status },
      { headers: AuthHeaders.getAuthHeaders() }
    );
  }

  getStatus() {
    return this.http.get<CommentPlanStatus>(this.apiStatus, {
      headers: AuthHeaders.getAuthHeaders()
    });
  }

  getStatusByUserId(userId: string) {
    const params = new HttpParams().set('userId', userId);
    return this.http.get<CommentPlanStatus>(this.apiStatus, {
      params,
      headers: AuthHeaders.getAuthHeaders()
    });
  }

  cancelPlan() {
    return this.http.post<CommentPlanCancelResponse>(
      this.apiCancel,
      {},
      { headers: AuthHeaders.getAuthHeaders() }
    );
  }

}
