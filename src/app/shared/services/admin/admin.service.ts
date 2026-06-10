import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoaderService } from '../loader/loader.service';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly apiAdmin = environment.api_admin;
  private readonly apiProfile = environment.api_profile;

  constructor(private http: HttpClient, private loaderService: LoaderService) {}

  getAllProfiles(page = 1, limit = 15, name?: string): Observable<any> {
    this.loaderService.setLoaderState(true);
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    if (name) {
      params = params.set('name', name);
    }
    return this.http.get(`${this.apiAdmin}/getAllProfiles`, { params }).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  getAllUsers(page = 1, limit = 10, showLoader = true): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (showLoader) {
      this.loaderService.setLoaderState(true);
      return this.http.get(`${this.apiAdmin}/getAllUsers`, { params }).pipe(
        finalize(() => this.loaderService.setLoaderState(false))
      );
    }

    return this.http.get(`${this.apiAdmin}/getAllUsers`, { params });
  }

  deleteUser(userId: string): Observable<any> {
    this.loaderService.setLoaderState(true);
    return this.http.delete(`${this.apiAdmin}/deleteUser/${userId}`).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  deleteProfile(profileId: string): Observable<any> {
    this.loaderService.setLoaderState(true);
    return this.http.delete(`${this.apiAdmin}/deleteProfile/${profileId}`).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  activateProfile(profileId: string, isActiveProfile: boolean): Observable<any> {
    this.loaderService.setLoaderState(true);
    return this.http.put(`${this.apiAdmin}/activeProfile/${profileId}`, { isActiveProfile }).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  verifyKyc(kycId: string): Observable<any> {
    this.loaderService.setLoaderState(true);
    return this.http.put(`${this.apiAdmin}/verifyKYC/${kycId}`, { verify: true }).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  getAllKyc(page = 1, limit = 10): Observable<any> {
    this.loaderService.setLoaderState(true);
    const params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));
    return this.http.get(`${this.apiProfile}/getAllKYC`, { params }).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }

  getAdminTopRojo(
    page = 1,
    limit = 10,
    status?: 'pending' | 'active' | 'expired' | 'cancelled',
    showLoader = true
  ): Observable<any> {
    let params = new HttpParams()
      .set('page', String(page))
      .set('limit', String(limit));

    if (status) {
      params = params.set('status', status);
    }

    if (showLoader) {
      this.loaderService.setLoaderState(true);
      return this.http.get(`${this.apiAdmin}/top-rojo`, { params }).pipe(
        finalize(() => this.loaderService.setLoaderState(false))
      );
    }

    return this.http.get(`${this.apiAdmin}/top-rojo`, { params });
  }

  updateAdminTopRojoStatus(
    topRojoId: string,
    status: 'pending' | 'active' | 'expired' | 'cancelled'
  ): Observable<any> {
    this.loaderService.setLoaderState(true);
    return this.http.put(`${this.apiAdmin}/top-rojo/${topRojoId}/status`, { status }).pipe(
      finalize(() => this.loaderService.setLoaderState(false))
    );
  }
}
