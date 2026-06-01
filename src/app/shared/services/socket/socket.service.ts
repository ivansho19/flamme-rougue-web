import { Injectable, OnDestroy } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { Observable, ReplaySubject, Subject } from 'rxjs';
import { environment } from '../../../../environments/environment';

type SocketNotificationPayload = {
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

@Injectable({
  providedIn: 'root'
})
export class SocketService implements OnDestroy {
  private socket: Socket | null = null;
  private readonly notification$ = new Subject<SocketNotificationPayload>();
  private readonly connection$ = new ReplaySubject<boolean>(1);
  private readonly authError$ = new Subject<Error>();

  constructor() {
    this.connection$.next(false);
  }

  connect(): void {
    if (this.socket?.connected || this.socket?.active) {
      return;
    }

    const token = this.getToken();
    if (!token) {
      this.connection$.next(false);
      return;
    }

    this.socket = io(environment.socket_url, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000
    });

    this.registerListeners();
  }

  updateToken(token: string | null): void {
    if (!token) {
      this.disconnect();
      return;
    }

    if (!this.socket) {
      this.connect();
      return;
    }

    this.socket.auth = { token };
    if (!this.socket.connected) {
      this.socket.connect();
    }
  }

  disconnect(): void {
    if (!this.socket) {
      this.connection$.next(false);
      return;
    }

    this.socket.removeAllListeners();
    this.socket.disconnect();
    this.socket = null;
    this.connection$.next(false);
  }

  onNotification(): Observable<SocketNotificationPayload> {
    return this.notification$.asObservable();
  }

  onConnectionStatus(): Observable<boolean> {
    return this.connection$.asObservable();
  }

  onAuthError(): Observable<Error> {
    return this.authError$.asObservable();
  }

  private registerListeners(): void {
    if (!this.socket) {
      return;
    }

    this.socket.on('connect', () => this.connection$.next(true));
    this.socket.on('disconnect', () => this.connection$.next(false));
    this.socket.on('notification:new', (payload: SocketNotificationPayload) => {
      this.notification$.next(payload || {});
    });

    this.socket.on('connect_error', (err: Error & { message?: string }) => {
      this.connection$.next(false);
      const message = (err?.message || '').toLowerCase();
      if (message.includes('jwt') || message.includes('auth')) {
        this.authError$.next(err);
        this.disconnect();
      }
    });
  }

  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  ngOnDestroy(): void {
    this.disconnect();
    this.notification$.complete();
    this.connection$.complete();
    this.authError$.complete();
  }
}
