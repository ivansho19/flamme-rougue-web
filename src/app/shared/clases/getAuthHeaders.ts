import { HttpHeaders } from '@angular/common/http';
import { isUserLoggedIn } from './public-read-api';

export class AuthHeaders {
  static getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Missing auth token');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }

  /** Solo para operaciones que aceptan auth opcional; lecturas públicas no deben usar headers. */
  static getAuthHeadersIfLoggedIn(): HttpHeaders | undefined {
    if (!isUserLoggedIn()) {
      return undefined;
    }

    const token = localStorage.getItem('token');
    return token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;
  }
}