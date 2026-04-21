import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import {
  ITopRojoCreateRequest,
  ITopRojoResponse,
  ITopRojoListResponse,
  IMyTopRojoDashboard,
  ITopRojoAllResponse,
  TOP_ROJO_PLANS
} from '../../models/top-rojo.model';
import { LoaderService } from '../loader/loader.service';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TopRojoService {
  private readonly apiTopRojo = environment.api_topRojo;

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
    return this.http.post(`${this.apiTopRojo}/create`, request)
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener TOP ROJO de una ciudad
   */
  getTopRojoByCity(city: string, country: string): Observable<ITopRojoListResponse> {
    return this.http.get<ITopRojoListResponse>(
      `${this.apiTopRojo}/city/${city}/${country}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener mis TOP ROJO activos (Dashboard)
   * Mapea automáticamente la respuesta del API
   */
  getMyTopRojo(userId: string): Observable<IMyTopRojoDashboard> {
    return this.http.get<any>(
      `${this.apiTopRojo}/user/${userId}/my-tops`
    ).pipe(
      // Mapear la respuesta y asegurar estructura correcta
      (source) => new Observable(subscriber => {
        source.pipe(finalize(() => this.loaderService.setLoaderState(false)))
          .subscribe({
            next: (response: any) => {
              // Mapear respuesta a interfaz correcta
              const mapped = this.mapMyTopRojoDashboard(response);
              subscriber.next(mapped);
            },
            error: (error) => subscriber.error(error),
            complete: () => subscriber.complete()
          });
      })
    );
  }

  /**
   * Mapear respuesta del API a IMyTopRojoDashboard
   * Maneja diferentes formatos de respuesta del backend
   */
  private mapMyTopRojoDashboard(response: any): IMyTopRojoDashboard {
    console.log('[TopRojoService] Response recibida del API:', response);

    const apiStats = response?.stats || null;
    const responseActive = response?.activeTops || response?.active || null;
    const responseExpired = response?.expiredTops || response?.expired || null;
    
    // Si la respuesta ES un array, dividir en activos y expirados
    if (Array.isArray(response)) {
      const active = response.filter(top => top.status === 'active');
      const expired = response.filter(top => top.status === 'expired');
      return {
        active: this.mapTopRojoArray(active),
        expired: this.mapTopRojoArray(expired),
        statistics: {
          totalSpent: this.calculateTotalSpent(active, expired),
          totalViews: (active.concat(expired)).reduce((sum, t) => sum + (t.views || 0), 0),
          totalClicks: (active.concat(expired)).reduce((sum, t) => sum + (t.clicks || 0), 0),
          conversionRate: this.calculateConversionRate(active.concat(expired))
        }
      };
    }
    
    // Si tiene estructura {active, expired}
    if (responseActive || responseExpired) {
      const activeList = Array.isArray(responseActive) ? responseActive : [];
      const expiredList = Array.isArray(responseExpired) ? responseExpired : [];
      const allList = activeList.concat(expiredList);

      const totalViews = apiStats?.totalViews ?? allList.reduce((sum: number, t: any) => sum + (t.views || t.viewCount || 0), 0);
      const totalClicks = apiStats?.totalClicks ?? allList.reduce((sum: number, t: any) => sum + (t.clicks || t.clickCount || 0), 0);
      const totalSpent = apiStats?.totalSpent ?? this.calculateTotalSpent(activeList, expiredList);

      return {
        active: this.mapTopRojoArray(activeList),
        expired: this.mapTopRojoArray(expiredList),
        statistics: response.statistics || {
          totalSpent,
          totalViews,
          totalClicks,
          conversionRate: this.calculateConversionRate(allList)
        }
      };
    }

    // Fallback: retornar estructura vacía
    console.warn('[TopRojoService] Respuesta del API no coincide con estructura esperada');
    return {
      active: [],
      expired: [],
      statistics: { totalSpent: 0, totalViews: 0, totalClicks: 0, conversionRate: 0 }
    };
  }

  /**
   * Mapear array de TOP ROJO a ITopRojoResponse[]
   */
  private mapTopRojoArray(tops: any[]): ITopRojoResponse[] {
    if (!Array.isArray(tops)) return [];
    
    return tops.map(top => this.mapSingleTopRojo(top));
  }

  /**
   * Mapear un TOP ROJO individual
   */
  private mapSingleTopRojo(top: any): ITopRojoResponse {
    return {
      _id: top._id || top.id || '',
      userId: top.userId || '',
      profileId: top.profileId || '',
      
      displayName: top.displayName || top.title || top.name || '',
      profileImage: top.profileImage || top.image || top.images?.[0]?.url || '',
      city: top.city || '',
      country: top.country || '',
      
      isTop: top.isTop !== undefined ? top.isTop : true,
      planType: top.planType || 'top_24h',
      status: top.status || 'active',
      
      startDate: new Date(top.startDate || Date.now()),
      endDate: new Date(top.endDate || Date.now()),
      daysRemaining: top.daysRemaining || 0,
      hoursRemaining: top.hoursRemaining || 0,
      
      views: top.views || top.viewCount || 0,
      clicks: top.clicks || top.clickCount || 0,
      inquiries: top.inquiries || 0,
      
      price: top.price || 0,
      transactionId: top.transactionId || '',
      
      createdAt: new Date(top.createdAt || Date.now()),
      updatedAt: new Date(top.updatedAt || Date.now())
    };
  }

  /**
   * Calcular gasto total
   */
  private calculateTotalSpent(active: any[], expired: any[]): number {
    return (active.concat(expired || [])).reduce((sum, top) => sum + (top.price || 0), 0);
  }

  /**
   * Calcular conversion rate
   */
  private calculateConversionRate(tops: any[]): number {
    if (tops.length === 0) return 0;
    const totalClicks = tops.reduce((sum, t) => sum + (t.clicks || t.clickCount || 0), 0);
    const totalViews = tops.reduce((sum, t) => sum + (t.views || t.viewCount || 0), 0);
    return totalViews > 0 ? (totalClicks / totalViews) * 100 : 0;
  }

  /**
   * Obtener TOP ROJO de un perfil específico
   */
  getProfileTopRojo(profileId: string): Observable<ITopRojoResponse> {
    return this.http.get<ITopRojoResponse>(
      `${this.apiTopRojo}/${profileId}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Renovar TOP ROJO expirado
   */
  renewTopRojo(topRojoId: string, planType: string): Observable<any> {
    return this.http.post(`${this.apiTopRojo}/${topRojoId}/renew`, { planType })
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Cancelar TOP ROJO
   */
  cancelTopRojo(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiTopRojo}/${topRojoId}/cancel`, {})
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * TOP ROJO destacados para home (máximo 5 por ciudad en rotación)
   */
  getFeaturedTopRojo(limit: number = 5): Observable<ITopRojoResponse[]> {
    return this.http.get<ITopRojoResponse[]>(
      `${this.apiTopRojo}/featured?limit=${limit}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener todos los TOP ROJO (home banner carousel)
   */
  getAllTopRojo(): Observable<ITopRojoAllResponse> {
    return this.http.get<ITopRojoAllResponse>(
      `${this.apiTopRojo}/all`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Incrementar visualización
   */
  trackView(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiTopRojo}/${topRojoId}/track-view`, {});
  }

  /**
   * Incrementar clicks
   */
  trackClick(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiTopRojo}/${topRojoId}/track-click`, {});
  }

  /**
   * Crear TOP ROJO con fotos (completo)
   * Sube fotos a Cloudinary primero, luego crea el TOP ROJO
   */
  createTopRojoWithPhotos(
    profileId: string,
    displayName: string,
    title: string,
    description: string,
    phone: string,
    photo1File: File,
    photo2File: File,
    city: string,
    country: string,
    planType: string,
    cloudinaryService: any
  ): Observable<any> {
    // Crear carpeta con formato: top-rojo/[nombre-real-usuario]+[id]
    const folderName = `top-rojo/${displayName}+${profileId}`;

    // Subir ambas fotos
    const photo1Obs = cloudinaryService.uploadImage(photo1File, folderName);
    const photo2Obs = cloudinaryService.uploadImage(photo2File, folderName);

    return new Observable(subscriber => {
      Promise.all([
        photo1Obs.toPromise(),
        photo2Obs.toPromise()
      ]).then(([photo1Result, photo2Result]) => {
        // Construir payload con URLs de Cloudinary
        const payload: ITopRojoCreateRequest = {
          profileId,
          displayName,
          planType: planType as 'top_24h' | 'top_3d' | 'top_7d',
          city,
          country,
          title,
          description,
          contactPhone: phone,
          images: [
            {
              url: photo1Result?.secure_url,
              public_id: photo1Result?.public_id
            },
            {
              url: photo2Result?.secure_url,
              public_id: photo2Result?.public_id
            }
          ]
        };

        console.log('[TopRojoService] Creando TOP ROJO con payload:', payload);

        // Crear TOP ROJO en el backend
        this.createTopRojo(payload).subscribe(
          result => subscriber.next(result),
          error => subscriber.error(error),
          () => subscriber.complete()
        );
      }).catch(error => subscriber.error(error));
    });
  }
}
