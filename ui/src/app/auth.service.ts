import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private tokenKey = 'auth_token';
  private loggedIn = false;

  constructor(private http: HttpClient) {}

  login(token: string) {
    localStorage.setItem(this.tokenKey, token);
    this.loggedIn = true;
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    this.loggedIn = false;
  }

  isLoggedIn(): boolean {
    return this.loggedIn;
  }

  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  verifyToken(): Observable<boolean> {
    const token = this.getToken();
    if (!token) {
      return of(false);
    }
    return this.http.post<{ valid: boolean }>('/api/verify-token', { token }).pipe(
      tap(response => {
        this.loggedIn = response.valid;
      }),
      map(response => response.valid),
      catchError(() => of(false))
    );
  }
}
