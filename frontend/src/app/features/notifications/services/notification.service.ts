import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import { EventSourcePolyfill } from 'event-source-polyfill';

const INITIAL_RETRY_MS = 2000;   // เริ่มต้น 2 วินาที
const MAX_RETRY_MS = 30000;      // สูงสุด 30 วินาที
const BACKOFF_MULTIPLIER = 2;    // เพิ่มทวีคูณทุกครั้ง

@Injectable({
  providedIn: 'root',
})
export class NotificationService {

  /**
   * สร้าง Observable ที่เชื่อมต่อ SSE พร้อม auto-reconnect
   * เมื่อการเชื่อมต่อขาด จะรอตาม exponential backoff แล้ว reconnect ใหม่อัตโนมัติ
   */
  private createSseObservable(
    url: string,
    eventListeners: Record<string, (event: any) => any>,
  ): Observable<any> {
    return new Observable((observer) => {
      let eventSource: EventSourcePolyfill | null = null;
      let retryDelay = INITIAL_RETRY_MS;
      let retryTimer: ReturnType<typeof setTimeout> | null = null;
      let destroyed = false;

      const connect = () => {
        if (destroyed) return;

        const token = localStorage.getItem('token');
        if (!token) {
          // ยังไม่มี token → รอแล้วลองใหม่
          scheduleRetry();
          return;
        }

        console.log(`[SSE] Connecting to ${url}...`);

        eventSource = new EventSourcePolyfill(url, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // ลงทะเบียน event listeners ทั้งหมดที่ส่งมา
        for (const [eventName, handler] of Object.entries(eventListeners)) {
          eventSource!.addEventListener(eventName, (event: any) => {
            // เชื่อมต่อได้แล้ว → reset delay กลับไปค่าเริ่มต้น
            retryDelay = INITIAL_RETRY_MS;
            try {
              const data = JSON.parse(event.data);
              observer.next(handler(data));
            } catch (e) {
              console.warn('[SSE] Failed to parse event data', e);
            }
          });
        }

        eventSource!.onerror = (err: any) => {
          console.warn(`[SSE] Connection error (readyState=${eventSource?.readyState}), will retry in ${retryDelay}ms`);

          // ปิดการเชื่อมต่อเก่าก่อนเสมอ
          eventSource?.close();
          eventSource = null;

          if (!destroyed) {
            scheduleRetry();
          }
        };
      };

      const scheduleRetry = () => {
        if (destroyed) return;
        console.log(`[SSE] Reconnecting in ${retryDelay / 1000}s...`);
        retryTimer = setTimeout(() => {
          // Exponential backoff — เพิ่มเวลารอทวีคูณจนถึง MAX
          retryDelay = Math.min(retryDelay * BACKOFF_MULTIPLIER, MAX_RETRY_MS);
          connect();
        }, retryDelay);
      };

      // เริ่มเชื่อมต่อครั้งแรก
      connect();

      // Teardown: ถูกเรียกเมื่อ unsubscribe
      return () => {
        destroyed = true;
        if (retryTimer) {
          clearTimeout(retryTimer);
          retryTimer = null;
        }
        eventSource?.close();
        eventSource = null;
        console.log(`[SSE] Disconnected from ${url}`);
      };
    });
  }

  /** SSE สำหรับ admin/owner — รับแจ้งเตือนออเดอร์ใหม่และการยืนยัน */
  ownerNotify(): Observable<any> {
    return this.createSseObservable('/api/v1/order/admin_owner/notification', {
      'new_order': (data) => ({ type: 'orderNotify', ...data }),
      'confirm_order:order_id:': (data) => ({ type: 'orderConfirm', ...data }),
    });
  }

  /** SSE สำหรับ customer — รับแจ้งเตือนเมื่อ admin ยืนยันออเดอร์ */
  customerNotify(): Observable<any> {
    return this.createSseObservable('/api/v1/order/customer/notification', {
      'confirm_order:user_id:': (data) => data,
    });
  }
}
