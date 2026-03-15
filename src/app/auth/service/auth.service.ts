import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { finalize, Observable, delay } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoaderService } from '../../shared/services/loader/loader.service';
import { IAuthRequest, IAuthResponse } from '../register/models/IAuth.model';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiGeeGenerateToken = environment.api_login;
  private readonly apiRegisterUser = environment.api_register;
  private readonly apiRegisterClient = environment.api_register_client;
  private readonly apiClientByEmail = environment.api_client_by_email;

  constructor(private http: HttpClient, private loaderS: LoaderService) { }

    login(email: string, password: string): Observable<IAuthResponse> {
      this.loaderS.setLoaderState(true);
        return this.http.post<IAuthResponse>(this.apiGeeGenerateToken, { email, password }).pipe(
          delay(3000), // Delay artificial de 3 segundos
          finalize(() => this.loaderS.setLoaderState(false))
        );
    }

    registerUser(name: string, lastName: string, email: string, password: string): Observable<IAuthResponse> {
      this.loaderS.setLoaderState(true);
        return this.http.post<IAuthResponse>(this.apiRegisterUser, { name, lastName, email, password }).pipe(
          delay(3000), // Delay artificial de 3 segundos
          finalize(() => this.loaderS.setLoaderState(false))
        );
    }

    registerClient(req: IAuthRequest): Observable<any> {
      this.loaderS.setLoaderState(true);
        return this.http.post(this.apiRegisterClient, req).pipe(
          delay(3000), // Delay artificial de 3 segundos
          finalize(() => this.loaderS.setLoaderState(false))
        );
    }

    getClientByEmail(email: string): Observable<any> {
      this.loaderS.setLoaderState(true);
      const encodedEmail = encodeURIComponent(email);
      return this.http.get(`${this.apiClientByEmail}/${encodedEmail}`).pipe(
        finalize(() => this.loaderS.setLoaderState(false))
      );
    }
}