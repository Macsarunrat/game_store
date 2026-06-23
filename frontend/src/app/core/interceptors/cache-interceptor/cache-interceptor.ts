import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Cache } from '../../cache/cache';
import { of, tap } from 'rxjs';

export const cacheInterceptor: HttpInterceptorFn = (req, next) => {
  const cacheService = inject(Cache);
  const excludeUrls = ['/api/v1/order/'];

  const isExcluded = excludeUrls.some((url) => req.url.includes(url));

  if (req.method !== 'GET' || isExcluded) {
    cacheService.clearCache();
    return next(req);
  }

  const cacheResponse = cacheService.get(req);
  if (cacheResponse) {
    console.log('ดึงข้อมูลจาก Interceptor cache ', req.urlWithParams);
    return of(cacheResponse);
  }

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse) {
        cacheService.put(req, event);
      }
    }),
  );
};
