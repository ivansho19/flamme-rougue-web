import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiGeeGenerateToken = environment.api_login;
  private readonly apiRegisterUser = environment.api_register;

  constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<any> {
        return this.http.post(this.apiGeeGenerateToken, { email, password });
    }

    registerUser(name: string, email: string, password: string): Observable<any> {
        return this.http.post(this.apiRegisterUser, { name, email, password });
    }
}