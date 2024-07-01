import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<any>;
  public currentUser: Observable<any>;

  constructor(private http: HttpClient) {
    this.currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    this.currentUser = this.currentUserSubject.asObservable();
  }

  private getUserFromStorage(): any {
    const token = localStorage.getItem('auth_token');
    return token ? { token } : null;
  }

  public get currentUserValue() {
    return this.currentUserSubject.value;
  }

  public getToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  login(token: string) {
    localStorage.setItem('auth_token', token);
    this.currentUserSubject.next({ token });
  }

  logout() {
    localStorage.removeItem('auth_token');
    this.currentUserSubject.next(null);
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  // Méthode pour vérifier la validité du token (à implémenter côté serveur)
  verifyToken(): Observable<boolean> {
    return this.http.get<boolean>('/api/verify-token', {
      headers: { Authorization: `Bearer ${this.getToken()}` }
    });
  }
}
