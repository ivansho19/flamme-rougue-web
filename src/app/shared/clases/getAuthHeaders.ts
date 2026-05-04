import { HttpHeaders } from "@angular/common/http";

export class AuthHeaders {

 static getAuthHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('Missing auth token');
    }
    return new HttpHeaders({ Authorization: `Bearer ${token}` });
  }
}