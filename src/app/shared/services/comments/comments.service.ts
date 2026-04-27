import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface CommentAuthor {
  name: string;
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
}

@Injectable({
  providedIn: 'root'
})
export class CommentsService {
  private readonly apiComments = environment.api_comments;

  constructor(private http: HttpClient) {}

  getCommentsByProfile(profileId: string): Observable<CommentItem[]> {
    return this.http.get<CommentItem[]>(`${this.apiComments}/profile/${profileId}`);
  }

  createComment(payload: { profileId: string; authorId: string; text: string; rating?: number | null }): Observable<any> {
    return this.http.post(`${this.apiComments}`, payload);
  }

  addProviderReply(commentId: string, payload: { replyText: string; userId: string }): Observable<any> {
    return this.http.patch(`${this.apiComments}/${commentId}/reply`, payload);
  }
}
