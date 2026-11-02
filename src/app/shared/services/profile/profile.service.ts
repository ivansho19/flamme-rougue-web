import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { finalize, shareReplay, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';
import { LoaderService } from '../loader/loader.service';
import { IProfileCreateRequest } from '../../../feature/create-profile/models/IProfileCreate.model';
import { resolveProfileId } from '../../clases/resolveProfileId';
import {
  parseProfileRouteParam,
  profileMatchesRouteParam
} from '../../clases/profileSlug';

type CacheEntry<T> = {
  at: number;
  data: T;
};

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiProfile = environment.api_profile;

  /** Public list + detail stay warm between home ↔ profile navigations. */
  private readonly listTtlMs = 15 * 60 * 1000;
  private readonly detailTtlMs = 15 * 60 * 1000;

  private listCache: CacheEntry<any> | null = null;
  private listInFlight: Observable<any> | null = null;

  private readonly detailCache = new Map<string, CacheEntry<any>>();
  private readonly detailInFlight = new Map<string, Observable<any>>();

  constructor(private http: HttpClient, private loaderS: LoaderService) {}

  createProfile(payload: IProfileCreateRequest): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.post(`${this.apiProfile}/createProfile`, payload).pipe(
      tap(() => this.invalidateCache()),
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  getAllProfiles(): Observable<any> {
    if (this.listCache && !this.isExpired(this.listCache.at, this.listTtlMs)) {
      return of(this.listCache.data);
    }

    if (this.listInFlight) {
      return this.listInFlight;
    }

    this.loaderS.setLoaderState(true);
    this.listInFlight = this.http.get(`${this.apiProfile}/getAllProfiles`).pipe(
      tap((data) => {
        this.listCache = { at: Date.now(), data };
        this.seedDetailCacheFromList(data);
      }),
      finalize(() => {
        this.loaderS.setLoaderState(false);
        this.listInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    return this.listInFlight;
  }

  getProfileById(profileId: string): Observable<any> {
    const id = resolveProfileId(profileId);
    if (!id) {
      return this.http.get(`${this.apiProfile}/getProfile/${profileId}`);
    }

    const cached = this.detailCache.get(id);
    if (cached && !this.isExpired(cached.at, this.detailTtlMs)) {
      return of(cached.data);
    }

    const inFlight = this.detailInFlight.get(id);
    if (inFlight) {
      return inFlight;
    }

    this.loaderS.setLoaderState(true);
    const request$ = this.http.get(`${this.apiProfile}/getProfile/${id}`).pipe(
      tap((data) => {
        this.detailCache.set(id, { at: Date.now(), data });
      }),
      finalize(() => {
        this.loaderS.setLoaderState(false);
        this.detailInFlight.delete(id);
      }),
      shareReplay({ bufferSize: 1, refCount: false })
    );

    this.detailInFlight.set(id, request$);
    return request$;
  }

  getProfileByUser(userId: string): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.get(`${this.apiProfile}/getProfileByUser/${userId}`).pipe(
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  updateProfile(profileId: string, payload: IProfileCreateRequest): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.put(`${this.apiProfile}/updateProfile/${profileId}`, payload).pipe(
      tap(() => this.invalidateCache()),
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  searchProfiles(param: string): Observable<any> {
    // No global loader: used by header autocomplete and profile slug resolve.
    return this.http.get(`${this.apiProfile}/searchProfiles`, {
      params: { query: param }
    });
  }

  createKYC(payload: any): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.post(`${this.apiProfile}/createKYC`, payload).pipe(
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  /**
   * Drop list + detail caches (call after create/update/admin activate-delete).
   * Next getAllProfiles / getProfileById will hit the network.
   */
  invalidateCache(): void {
    this.listCache = null;
    this.listInFlight = null;
    this.detailCache.clear();
    this.detailInFlight.clear();
  }

  /** Sync peek of the warm list payload (no HTTP). */
  peekAllProfiles(): any | null {
    if (!this.listCache || this.isExpired(this.listCache.at, this.listTtlMs)) {
      return null;
    }
    return this.listCache.data;
  }

  /** Sync lookup against the warm list cache (no HTTP). */
  findInListCache(routeParam: string): any | null {
    if (!this.listCache || this.isExpired(this.listCache.at, this.listTtlMs)) {
      return null;
    }

    const profiles = this.normalizeProfiles(this.listCache.data);
    if (!profiles.length) {
      return null;
    }

    const parsed = parseProfileRouteParam(routeParam);
    return profiles.find((profile) => profileMatchesRouteParam(profile, parsed)) || null;
  }

  private isExpired(cachedAt: number, ttlMs: number): boolean {
    return Date.now() - cachedAt >= ttlMs;
  }

  private normalizeProfiles(payload: any): any[] {
    if (Array.isArray(payload)) {
      return payload;
    }
    if (Array.isArray(payload?.profiles)) {
      return payload.profiles;
    }
    if (Array.isArray(payload?.data)) {
      return payload.data;
    }
    return [];
  }

  /** Warm detail entries from list payloads so profile-by-id can skip a round-trip. */
  private seedDetailCacheFromList(payload: any): void {
    const profiles = this.normalizeProfiles(payload);
    const now = Date.now();

    for (const profile of profiles) {
      const id = resolveProfileId(profile);
      if (!id) {
        continue;
      }
      // Keep a fresher detail response if one already exists.
      const existing = this.detailCache.get(id);
      if (existing && !this.isExpired(existing.at, this.detailTtlMs)) {
        continue;
      }
      this.detailCache.set(id, {
        at: now,
        data: { profile }
      });
    }
  }
}
