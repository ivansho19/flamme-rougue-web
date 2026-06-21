import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, map, of, shareReplay } from 'rxjs';

interface IpifyResponse {
  ip?: string;
}

@Injectable({
  providedIn: 'root'
})
export class UserIpService {
  private readonly ipLookupUrl = 'https://api.ipify.org?format=json';
  private cachedIp$: Observable<string | null> | null = null;

  constructor(private http: HttpClient) {}

  getClientIp(): Observable<string | null> {
    if (!this.cachedIp$) {
      this.cachedIp$ = this.http.get<IpifyResponse>(this.ipLookupUrl).pipe(
        map(response => response?.ip?.trim() || null),
        catchError(() => of(null)),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }

    return this.cachedIp$;
  }
}
