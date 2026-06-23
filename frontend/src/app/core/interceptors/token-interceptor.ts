import { HttpErrorResponse, HttpInterceptorFn, HttpEvent } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, BehaviorSubject, filter, take, Observable } from 'rxjs';
import { AuthService } from '../auth/auth';

// ตัวแปรสำหรับจัดการคิว กรณีมี API หลายตัวพังพร้อมกัน
let isRefreshing = false;
const refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = localStorage.getItem('token');

  // 1. เพิ่ม Access Token ลงใน Header ของทุก Request (ยกเว้นหน้า login/refresh)
  let authReq = req;
  if (token) {
    authReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }

  // 2. ส่ง Request และดักจับ Error
  return next(authReq).pipe(
    catchError((error) => {
      // ถ้า Error เป็น 401 และไม่ใช่การยิงไปหา API Login
      if (error instanceof HttpErrorResponse && error.status === 401) {
        //instance of เช็คว่า error(response) มาจาก HttpErrorResponse จริงไหม และเช็คสถานะต่อ
        return handle401Error(authReq, next, authService);
      }
      return throwError(() => error);
    }),
  );
};

// ฟังก์ชันพิเศษสำหรับจัดการการต่ออายุ Token
function handle401Error(
  request: any,
  next: any,
  authService: AuthService,
): Observable<HttpEvent<any>> {
  if (!isRefreshing) {
    isRefreshing = true;
    refreshTokenSubject.next(null);

    return authService.refreshToken().pipe(
      switchMap((response: any) => {
        isRefreshing = false;

        const newToken = response.detail.access_token;

        localStorage.setItem('token', newToken);

        refreshTokenSubject.next(newToken);

        // ยิง Request เดิมซ้ำ โดยระบุไทป์ว่าเป็น HttpEvent
        return next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${newToken}` },
          }),
        ) as Observable<HttpEvent<any>>;
      }),
      catchError((err) => {
        isRefreshing = false;
        authService.logout();
        return throwError(() => err);
      }),
    );
  } else {
    return refreshTokenSubject.pipe(
      filter((token) => token !== null),
      take(1),
      switchMap((token) =>
        next(
          request.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          }),
        ),
      ),
    ) as Observable<HttpEvent<any>>;
  }
}
