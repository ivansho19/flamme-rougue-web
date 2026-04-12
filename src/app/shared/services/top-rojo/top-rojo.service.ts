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
import { environment } from '../../../../environments/environment.dev';

@Injectable({
  providedIn: 'root'
})
export class TopRojoService {
  private readonly apiProfile = environment.api_profile;

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
    return this.http.post(`${this.apiProfile}/top-rojo/create`, request)
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener TOP ROJO de una ciudad
   */
  getTopRojoByCity(city: string, country: string): Observable<ITopRojoListResponse> {
    return this.http.get<ITopRojoListResponse>(
      `${this.apiProfile}/top-rojo/city/${city}/${country}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener mis TOP ROJO activos (Dashboard)
   */
  getMyTopRojo(userId: string): Observable<IMyTopRojoDashboard> {
    return this.http.get<IMyTopRojoDashboard>(
      `${this.apiProfile}/top-rojo/user/${userId}/my-tops`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Obtener TOP ROJO de un perfil específico
   */
  getProfileTopRojo(profileId: string): Observable<ITopRojoResponse> {
    return this.http.get<ITopRojoResponse>(
      `${this.apiProfile}/top-rojo/${profileId}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Renovar TOP ROJO expirado
   */
  renewTopRojo(topRojoId: string, planType: string): Observable<any> {
    return this.http.post(`${this.apiProfile}/top-rojo/${topRojoId}/renew`, { planType })
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Cancelar TOP ROJO
   */
  cancelTopRojo(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiProfile}/top-rojo/${topRojoId}/cancel`, {})
      .pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * TOP ROJO destacados para home (máximo 5 por ciudad en rotación)
   */
  getFeaturedTopRojo(limit: number = 5): Observable<ITopRojoResponse[]> {
    return this.http.get<ITopRojoResponse[]>(
      `${this.apiProfile}/top-rojo/featured?limit=${limit}`
    ).pipe(finalize(() => this.loaderService.setLoaderState(false)));
  }

  /**
   * Incrementar visualización
   */
  trackView(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiProfile}/top-rojo/${topRojoId}/track-view`, {});
  }

  /**
   * Incrementar clicks
   */
  trackClick(topRojoId: string): Observable<any> {
    return this.http.post(`${this.apiProfile}/top-rojo/${topRojoId}/track-click`, {});
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
