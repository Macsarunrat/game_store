import { ApplicationConfig, provideBrowserGlobalErrorListeners, LOCALE_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { tokenInterceptor } from './core/interceptors/token-interceptor';
import { provideToastr } from 'ngx-toastr';
import { cacheInterceptor } from './core/interceptors/cache-interceptor/cache-interceptor';
import { loadingInterceptor } from './core/interceptors/loading-interceptor';
import { registerLocaleData } from '@angular/common';
import { routes } from './app.routes';
import localeTh from '@angular/common/locales/th';

registerLocaleData(localeTh);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([tokenInterceptor, cacheInterceptor, loadingInterceptor])),
    provideToastr(),
    { provide: LOCALE_ID, useValue: 'th-TH' },
  ],
};
