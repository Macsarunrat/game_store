import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { EventSourcePolyfill } from 'event-source-polyfill';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  ownerNotify(): Observable<any> {
    return new Observable((observer) => {
      const token = localStorage.getItem('token');

      const eventSource = new EventSourcePolyfill('/api/v1/order/admin_owner/notification', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const eventName = 'new_order';

      eventSource.addEventListener(eventName, (event: any) => {
        const data = JSON.parse(event.data);
        observer.next({ type: 'orderNotify', ...data });
      });

      const eventOrder = 'confirm_order:order_id:';
      eventSource.addEventListener(eventOrder, (order: any) => {
        const orderData = JSON.parse(order.data);
        observer.next({ type: 'orderConfirm', ...orderData });
      });

      eventSource.onerror = (err: any) => {
        console.error('SSE error = ', err);
        if (eventSource.readyState === EventSource.CLOSED) {
          observer.error(err);
          eventSource.close();
        }
      };

      return () => eventSource.close();
    });
  }

  customerNotify(): Observable<any> {
    return new Observable((observer) => {
      const token = localStorage.getItem('token');

      const eventSource = new EventSourcePolyfill('/api/v1/order/customer/notification', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const eventName = 'confirm_order:user_id:';

      eventSource.addEventListener(eventName, (event: any) => {
        const data = JSON.parse(event.data);
        observer.next(data);
      });

      eventSource.onerror = (err: any) => {
        console.error('SSE error = ', err);
        if (eventSource.readyState === EventSource.CLOSED) {
          observer.error(err);
          eventSource.close();
        }
      };

      return () => eventSource.close();
    });
  }
}
