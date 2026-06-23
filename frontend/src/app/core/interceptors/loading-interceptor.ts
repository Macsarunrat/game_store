import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
  const loadingService = inject(LoadingService);

  // Skip loader for specific calls if needed (e.g. notifications, polling, etc.)
  const isBackground = req.url.includes('/notification') || req.headers.has('skip-loader');

  if (!isBackground) {
    loadingService.show();
  }

  return next(req).pipe(
    finalize(() => {
      if (!isBackground) {
        loadingService.hide();
      }
    })
  );
};
