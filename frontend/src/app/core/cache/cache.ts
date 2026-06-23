import { Injectable } from '@angular/core';
import { HttpRequest, HttpResponse } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class Cache {
  private cache = new Map<string, HttpResponse<any>>();

  get(req: HttpRequest<any>): HttpResponse<any> | undefined {
    return this.cache.get(req.urlWithParams);
  }

  // เก็บข้อมูลลง Cache
  put(req: HttpRequest<any>, response: HttpResponse<any>): void {
    this.cache.set(req.urlWithParams, response);
  }

  // ล้าง Cache ทั้งหมด
  clearCache(): void {
    this.cache.clear();
  }
}
