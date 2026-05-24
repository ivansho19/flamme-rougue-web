import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthHeaders } from '../../clases/getAuthHeaders';

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly apiNotifications = environment.api_notifications;

  constructor(private http: HttpClient) {}

  getAdminNotifications(status?: 'unread' | 'read'): Observable<any> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get(this.apiNotifications, { params });
  }

  getProfileNotifications(profileId: string, status?: 'unread' | 'read'): Observable<any> {
    const params = status ? new HttpParams().set('status', status) : undefined;
    return this.http.get(`${this.apiNotifications}/profile/${profileId}`, {
      params,
      headers: AuthHeaders.getAuthHeaders()
    });
  }

  markNotificationsRead(ids: string[]): Observable<any> {
    return this.http.post(`${this.apiNotifications}/mark-read`, { ids }, {
      headers: AuthHeaders.getAuthHeaders()
    });
  }

  markAllNotificationsRead(): Observable<any> {
    return this.http.post(`${this.apiNotifications}/mark-all-read`, {}, {
      headers: AuthHeaders.getAuthHeaders()
    });
  }
}
