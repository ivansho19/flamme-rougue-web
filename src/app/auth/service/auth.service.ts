import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environment/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private readonly apiGeeGenerateToken = environment.api_login;

  constructor(private http: HttpClient) { }

    login(email: string, password: string): Observable<any> {
        return this.http.post(this.apiGeeGenerateToken, { email, password });
    }
}