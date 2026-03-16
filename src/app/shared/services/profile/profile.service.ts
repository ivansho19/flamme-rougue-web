import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { LoaderService } from '../loader/loader.service';
import { IProfileCreateRequest } from '../../../feature/create-profile/models/IProfileCreate.model';


@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private readonly apiProfile = environment.api_profile;

  constructor(private http: HttpClient, private loaderS: LoaderService) { }

  createProfile(payload: IProfileCreateRequest): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.post(`${this.apiProfile}/createProfile`, payload).pipe(
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  getAllProfiles(): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.get(`${this.apiProfile}/getAllProfiles`).pipe(
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }

  getProfileById(profileId: string): Observable<any> {
    this.loaderS.setLoaderState(true);
    return this.http.get(`${this.apiProfile}/getProfile/${profileId}`).pipe(
      finalize(() => this.loaderS.setLoaderState(false))
    );
  }
}
