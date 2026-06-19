import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';
import { AuthHeaders } from '../../clases/getAuthHeaders';

export interface ToggleLikeResponse {
  message: string;
  isLiked: boolean;
}

export interface ProfileLikesResponse {
  profileId: string;
  likesCount: number;
}

export interface UserLikeResponse {
  isLiked: boolean;
}

@Injectable({ providedIn: 'root' })
export class RatingsService {
  private readonly apiToggle = environment.api_ratings_toggle;
  private readonly apiProfile = environment.api_ratings_profile;

  constructor(private http: HttpClient) {}

  toggleLike(profileId: string, userId: string) {
    return this.http.post<ToggleLikeResponse>(
      this.apiToggle,
      { profileId, userId },
      { headers: AuthHeaders.getAuthHeaders() }
    );
  }

  getLikesCount(profileId: string) {
    return this.http.get<ProfileLikesResponse>(`${this.apiProfile}/${profileId}`);
  }

  getUserLikeStatus(profileId: string, userId: string) {
    return this.http.get<UserLikeResponse>(
      `${this.apiProfile}/${profileId}/user/${userId}`,
      { headers: AuthHeaders.getAuthHeaders() }
    );
  }

}
