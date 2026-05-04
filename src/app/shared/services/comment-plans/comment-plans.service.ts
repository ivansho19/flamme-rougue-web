import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  activatePlan(planType: 'monthly' | 'annual') {
    return this.http.post<CommentPlanStatus>(
      this.apiActivate,
      { planType },
      { headers: AuthHeaders.getAuthHeaders() }
    );
  }

  getStatus() {
    return this.http.get<CommentPlanStatus>(this.apiStatus, {
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
