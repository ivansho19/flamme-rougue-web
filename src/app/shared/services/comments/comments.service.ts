import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthHeaders } from '../../clases/getAuthHeaders';

export interface CommentPlanAuthorInfo {
  planType?: string | null;
  status?: string | null;
  badge?: string | null;
}

export interface CommentAuthor extends CommentPlanAuthorInfo {
  name: string;
  commentPlan?: CommentPlanAuthorInfo | null;
}

export interface CommentItem {
  _id: string;
  authorId: string;
  targetUserId: string;
  rating?: number | null;
  text: string;
  providerReply?: string | null;
  createdAt?: string;
  author?: CommentAuthor;
  planType?: string | null;
  status?: string | null;
  badge?: string | null;
  commentPlan?: CommentPlanAuthorInfo | null;
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly apiComments = environment.api_comments;
  stateComment = new Subject<{ state: boolean }>();

  constructor(private http: HttpClient) {}

  getCommentsByProfile(profileId: string): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${this.apiComments}/profile/${profileId}`);
  }

  createComment(payload: { profileId: string; authorId: string; text: string; rating?: number | null }): Observable<any> {
    return this.http.post(`${this.apiComments}`, payload, { headers: AuthHeaders.getAuthHeaders() });
  }

  addProviderReply(commentId: string, payload: { replyText: string; userId: string }): Observable<any> {
    return this.http.patch(`${this.apiComments}/${commentId}/reply`, payload, { headers: AuthHeaders.getAuthHeaders() });
  }
  
  getStateComment() {
    return this.stateComment.asObservable();
  }

  setStateComment(state: boolean) {
    this.stateComment.next({state})
  }
}
