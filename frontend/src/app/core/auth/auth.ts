import { Injectable, Input } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';
import { signal } from '@angular/core';
import { Router } from '@angular/router';

export interface User {
  username: string;
  roles: string[];
  firstname: string;
  user_id: string;
  refresh: any;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  public messageLogin = signal<string>('');

  // 1. Inject HttpClient เข้ามาใน Constructor
  constructor(
    private http: HttpClient,
    private router: Router,
  ) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null,
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  // 2. ปรับฟังก์ชัน login ให้รับ payload และยิง API จริง
  login(payload: HttpParams): Observable<any> {
    const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
    return this.http.post<any>('/api/v1/user/login', payload.toString(), { headers }).pipe(
      // tap จะทำงานเมื่อ API ตอบกลับมาสำเร็จ (200 OK)
      tap((response) => {
        const token = response.detail.token.access_token;
        const refresh_token = response.detail.token.refresh_token;

        if (token && refresh_token) {
          localStorage.setItem('token', token);
          localStorage.setItem('refresh_token', refresh_token);

          const user: User = {
            username: payload.get('username') || 'Unknown',
            roles: [response.detail?.role_name?.toLowerCase() || ''],
            firstname: response.detail.first_name,
            user_id: response.detail.user_id,
            refresh: localStorage.getItem('refresh_token'),
          };

          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
          console.log(response);
        } else {
          // กรณีไม่มี Token (เช่น Login ผิด) ให้มั่นใจว่าไม่พ่น Error ออกมา
          console.warn('Login response does not contain a valid token');
          alert(response.message);
          this.messageLogin.set(response.message);
        }
      }),
    );
  }

  refreshToken(): Observable<any> {
    const refresh_key = localStorage.getItem('refresh_token');
    if (!refresh_key || refresh_key === 'null') {
      return throwError(() => new Error('No refresh token available'));
    }
    return this.http.post<any>('/api/v1/user/refresh', { refresh_token: refresh_key });
  }

  logoutRequest() {
    const refreshkey = this.currentUserValue?.refresh;
    return this.http.post(
      '/api/v1/user/logout',
      { refresh_token: String(refreshkey) },
      { observe: 'response' },
    );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('token'); // อย่าลืมลบ Token ทิ้ง
    localStorage.removeItem('refresh_token');
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  hasRole(role: string): boolean {
    const user = this.currentUserValue;
    return user ? user.roles.includes(role) : false;
  }
  hasAnyRole(roles: string[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.some((role) => user.roles.includes(role)) : false;
  }

  hasAllRoles(roles: string[]): boolean {
    const user = this.currentUserValue;
    return user ? roles.every((role) => user.roles.includes(role)) : false;
  }
}
