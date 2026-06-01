import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, Subject, merge, of, timer, EMPTY, defer } from 'rxjs';
import { catchError, filter, map, scan, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { AuthHeaders } from '../../clases/getAuthHeaders';
import { SocketService } from '../socket/socket.service';

type NotificationItem = {
  _id?: string;
  title?: string;
  message?: string;
  createdAt?: string;
  status?: string;
  type?: string;
  userId?: string;
  profileId?: string;
  audience?: string;
  target?: string;
};

type StreamEvent =
  | { kind: 'bulk'; items: NotificationItem[] }
  | { kind: 'single'; item: NotificationItem };

const POLL_INTERVAL_MS = 20000;

@Injectable({
  providedIn: 'root'
})
export class NotificationsService {
  private readonly apiNotifications = environment.api_notifications;
  private readonly adminRefresh$ = new Subject<void>();
  private readonly profileRefresh$ = new Subject<string>();

  constructor(
    private http: HttpClient,
    private socketService: SocketService
  ) {}

  connectSocket(): void {
    this.socketService.connect();
  }

  disconnectSocket(): void {
    this.socketService.disconnect();
  }

  onSocketAuthError(): Observable<Error> {
    return this.socketService.onAuthError();
  }

  onSocketConnectionStatus(): Observable<boolean> {
    return this.socketService.onConnectionStatus();
  }

  requestAdminRefresh(): void {
    this.adminRefresh$.next();
  }

  requestProfileRefresh(profileId: string): void {
    this.profileRefresh$.next(profileId);
  }

  watchAdminNotifications(status?: 'unread' | 'read'): Observable<NotificationItem[]> {
    const initial$ = defer(() => this.fetchAdminNotifications(status));
    const manual$ = this.adminRefresh$.pipe(
      switchMap(() => this.fetchAdminNotifications(status))
    );
    const polling$ = this.createPollingStream(() => this.fetchAdminNotifications(status));
    const realtime$ = this.socketService.onNotification().pipe(
      filter(payload => this.isAdminPayload(payload)),
      map(payload => this.normalizeNotification(payload))
    );

    return this.buildNotificationsStream(initial$, manual$, polling$, realtime$);
  }

  watchProfileNotifications(profileId: string, status?: 'unread' | 'read'): Observable<NotificationItem[]> {
    const initial$ = defer(() => this.fetchProfileNotifications(profileId, status));
    const manual$ = this.profileRefresh$.pipe(
      filter((id) => id === profileId),
      switchMap(() => this.fetchProfileNotifications(profileId, status))
    );
    const polling$ = this.createPollingStream(() => this.fetchProfileNotifications(profileId, status));
    const realtime$ = this.socketService.onNotification().pipe(
      filter(payload => this.isProfilePayload(payload, profileId)),
      map(payload => this.normalizeNotification(payload))
    );

    return this.buildNotificationsStream(initial$, manual$, polling$, realtime$);
  }

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

  private fetchAdminNotifications(status?: 'unread' | 'read'): Observable<NotificationItem[]> {
    return this.getAdminNotifications(status).pipe(
      map((response) => {
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        return data.map((item: NotificationItem) => this.normalizeNotification(item));
      }),
      catchError(() => of([]))
    );
  }

  private fetchProfileNotifications(profileId: string, status?: 'unread' | 'read'): Observable<NotificationItem[]> {
    return defer(() => {
      try {
        return this.getProfileNotifications(profileId, status);
      } catch {
        return of({ data: [] });
      }
    }).pipe(
      map((response) => {
        const data = Array.isArray(response?.data) ? response.data : Array.isArray(response) ? response : [];
        return data.map((item: NotificationItem) => this.normalizeNotification(item));
      }),
      catchError(() => of([]))
    );
  }

  private createPollingStream(fetchFn: () => Observable<NotificationItem[]>): Observable<NotificationItem[]> {
    return this.socketService.onConnectionStatus().pipe(
      switchMap((connected) => connected
        ? EMPTY
        : timer(0, POLL_INTERVAL_MS).pipe(switchMap(fetchFn))
      )
    );
  }

  private buildNotificationsStream(
    initial$: Observable<NotificationItem[]>,
    manual$: Observable<NotificationItem[]>,
    polling$: Observable<NotificationItem[]>,
    realtime$: Observable<NotificationItem>
  ): Observable<NotificationItem[]> {
    return merge(
      initial$.pipe(map((items) => ({ kind: 'bulk', items } as StreamEvent))),
      manual$.pipe(map((items) => ({ kind: 'bulk', items } as StreamEvent))),
      polling$.pipe(map((items) => ({ kind: 'bulk', items } as StreamEvent))),
      realtime$.pipe(map((item) => ({ kind: 'single', item } as StreamEvent)))
    ).pipe(
      scan((state, event) => this.reduceNotifications(state, event), [] as NotificationItem[]),
      shareReplay({ bufferSize: 1, refCount: true })
    );
  }

  private reduceNotifications(current: NotificationItem[], event: StreamEvent): NotificationItem[] {
    if (event.kind === 'bulk') {
      return this.sortNotifications(this.mergeNotifications(event.items, []));
    }

    return this.sortNotifications(this.mergeNotifications([event.item], current));
  }

  private mergeNotifications(incoming: NotificationItem[], current: NotificationItem[]): NotificationItem[] {
    const merged = [...incoming, ...current];
    const unique = new Map<string, NotificationItem>();

    merged.forEach((item) => {
      const key = this.getNotificationKey(item);
      if (!unique.has(key)) {
        unique.set(key, item);
      }
    });

    return Array.from(unique.values());
  }

  private sortNotifications(items: NotificationItem[]): NotificationItem[] {
    return [...items].sort((a, b) => {
      const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }

  private getNotificationKey(item: NotificationItem): string {
    return item?._id || `${item?.type || ''}-${item?.title || ''}-${item?.createdAt || ''}`;
  }

  private normalizeNotification(item: NotificationItem): NotificationItem {
    const createdAt = item?.createdAt || (item as any)?.created_at;
    return { ...item, createdAt };
  }

  private isAdminPayload(payload: NotificationItem): boolean {
    const audience = (payload?.audience || payload?.target || '').toLowerCase();
    if (audience === 'admin') {
      return true;
    }

    if (payload?.type === 'profile_created' || payload?.type === 'payment_processed') {
      return true;
    }

    return !payload?.profileId && !payload?.userId;
  }

  private isProfilePayload(payload: NotificationItem, profileId: string): boolean {
    const audience = (payload?.audience || payload?.target || '').toLowerCase();
    const userId = this.getStoredUserId();

    if (payload?.profileId && payload.profileId === profileId) {
      return true;
    }

    if (userId && payload?.userId === userId) {
      return true;
    }

    return audience === 'client' || audience === 'profile' || audience === 'user';
  }

  private getStoredUserId(): string {
    return localStorage.getItem('userId') || '';
  }
}
