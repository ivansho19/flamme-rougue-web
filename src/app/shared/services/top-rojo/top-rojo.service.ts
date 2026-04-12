import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { 
  ITopRojoCreateRequest, 
  ITopRojoResponse, 
  ITopRojoListResponse,
  IMyTopRojoDashboard,
  TOP_ROJO_PLANS
} from '../../models/top-rojo.model';
import { LoaderService } from '../loader/loader.service';

@Injectable({
  providedIn: 'root'
})
export class TopRojoService {
  private apiUrl = '/api/profiles/top-rojo';

  constructor(
    private http: HttpClient,
    private loaderService: LoaderService
  ) { }

  /**
   * Obtener planes disponibles
   */
  getPlans() {
    return TOP_ROJO_PLANS;
  }

  /**
   * Crear/Comprar TOP ROJO
   */
  createTopRojo(request: ITopRojoCreateRequest): Observable<any> {
    return this.http.post(`${this.apiUrl}/create`, request)
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener TOP ROJO de una ciudad
   */
  getTopRojoByCity(city: string, country: string): Observable<ITopRojoListResponse> {
    return this.http.get<ITopRojoListResponse>(
      `${this.apiUrl}/city/${city}/${country}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener mis TOP ROJO activos (Dashboard)
   */
  getMyTopRojo(userId: string): Observable<IMyTopRojoDashboard> {
    return this.http.get<IMyTopRojoDashboard>(
      `${this.apiUrl}/user/${userId}/my-tops`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener TOP ROJO de un perfil específico
   */
  getProfileTopRojo(profileId: string): Observable<ITopRojoResponse> {
    return this.http.get<ITopRojoResponse>(
      `${this.apiUrl}/${profileId}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Renovar TOP ROJO expirado
   */
  renewTopRojo(topRojoId: string, planType: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${topRojoId}/renew`, { planType })
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Cancelar TOP ROJO
   */
  cancelTopRojo(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${topRojoId}/cancel`, {})
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * TOP ROJO destacados para home (máximo 5 por ciudad en rotación)
   */
  getFeaturedTopRojo(limit: number = 5): Observable<ITopRojoResponse[]> {
    return this.http.get<ITopRojoResponse[]>(
      `${this.apiUrl}/featured?limit=${limit}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Incrementar visualización
   */
  trackView(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${topRojoId}/track-view`, {});
  }

  /**
   * Incrementar clicks
   */
  trackClick(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${topRojoId}/track-click`, {});
  }
}
