import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderService {
  constructor(private http: HttpClient) {}

  gameOrder(): Observable<any> {
    const time = new Date().getTime;
    return this.http.get(`/api/v1/order/?t=${time}`);
  }

  updateStatusOrder(order_id: number) {
    return this.http.patch('/api/v1/order/confirm', null, {
      params: { order_id },
      observe: 'response',
    });
  }
}
