import { ChangeDetectorRef, Component, inject, OnInit, OnDestroy } from '@angular/core';
import { GameStateService } from '../../games/services/game-state.service';
import { OrderService } from '../services/order.service';
import { OrderStateService } from '../services/order-state.service';
import { NotificationService } from '../../notifications/services/notification.service';
import { AuthService } from '../../../core/auth/auth';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import {
  filter,
  map,
  Observable,
  Subject,
  takeUntil,
  debounceTime,
  distinctUntilChanged,
} from 'rxjs';
import { CommonModule } from '@angular/common';
import { StaticUrlPipe } from '../../../shared/pipes/static-url-pipe';
import { EventSourcePolyfill } from 'event-source-polyfill';
import { MatIconModule } from '@angular/material/icon';
import { Animation } from '../../../shared/animate/all-animate/Fade-up/animation';
import { GameService } from '../../games/services/game.service';
import { MatDialogClose } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import Swal from 'sweetalert2';
import { novaSwalConfirmBrand, novaSwalDarkBase } from '@theme/swal-theme';

@Component({
  selector: 'app-order',
  imports: [
    MatPaginatorModule,
    CommonModule,
    StaticUrlPipe,
    MatIconModule,
    Animation,
    MatTooltipModule,
    MatDialogClose,
  ],
  templateUrl: './order.html',
  styleUrl: './order.css',
})
export class Order implements OnInit, OnDestroy {
  private gameState = inject(GameStateService);
  private orderService = inject(OrderService);
  private orderState = inject(OrderStateService);
  private notificationService = inject(NotificationService);
  public person = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private gameService = inject(GameService);

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();
  private currentSearchTerm = '';

  gameAdmin: any[] = [];
  gameCustomer: any[] = [];
  gameImgAdmin = '';
  gameBuy = '';

  filteredAdmin: any[] = [];
  filteredCustomer: any[] = [];
  pageAdmin: any[] = [];
  pageCustomer: any[] = [];
  pageSize = 10;
  currentPage = 0;

  private route = inject(ActivatedRoute);

  constructor() {}

  ngOnInit() {
    this.loadOrder();
    this.startSearchListener();

    // แสดง popup เมื่อ Stripe redirect กลับมาพร้อม payment_status=success
    const paymentStatus = this.route.snapshot.queryParamMap.get('payment_status');
    const orderId = this.route.snapshot.queryParamMap.get('order_id');
    if (paymentStatus === 'success') {
      Swal.fire({
        icon: 'success',
        title: 'ชำระเงินสำเร็จ!',
        text: `Order ID: ${orderId}`,
        topLayer: true,
        reverseButtons: true,
        ...novaSwalConfirmBrand(),
        ...novaSwalDarkBase(),
      });
    }

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string) => {
        this.currentSearchTerm = term;
        this.orderState.updateOrderSearch(term);
        this.cdr.detectChanges();
      });

    this.orderState.refreshOrder$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      console.log('order ถูก refresh');
      this.loadOrder();
    });

    if (this.person.hasRole('admin') || this.person.hasRole('owner')) {
      this.notificationService
        .ownerNotify()
        .pipe(
          filter((t) => t.type === 'orderConfirm'),
          takeUntil(this.destroy$),
        )
        .subscribe({
          next: (res) => {
            console.log('orderConfirm', res);
            const order = this.gameAdmin.find((item: any) => {
              return item.order_id === res.order_id;
            });
            console.log('invalid ', order);
            if (order) {
              order.is_success = res.is_success;
              this.filterOrders(false);
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            console.error('orderError', err);
          },
        });
    }

    // ลูกค้า: รับ SSE notification เมื่อ admin ยืนยัน order
    if (this.person.hasRole('customer')) {
      this.notificationService
        .customerNotify()
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (res: any) => {
            console.log('customer orderConfirm SSE =', res);
            // หา order ที่ตรงกันใน list แล้วอัพเดทสถานะ is_success
            const order = this.gameCustomer.find(
              (item: any) => item.order_id === res.order_id,
            );
            if (order) {
              order.is_success = res.is_success ?? true;
              this.filterOrders(false);
              this.cdr.detectChanges();
            } else {
              // ถ้าหา order ไม่เจอ (กรณีข้อมูลยังไม่โหลด) ให้โหลดใหม่เลย
              this.loadOrder();
            }
          },
          error: (err) => {
            console.error('customer SSE error =', err);
          },
        });
    }
  } // end ngOnInit

  search(text: string) {
    this.searchSubject.next(text);
  }

  loadOrder() {
    this.orderService
      .gameOrder()
      .pipe(
        map((res) => res.detail),
        takeUntil(this.destroy$),
      )
      .subscribe({
        next: (ress) => {
          console.log('next :: ', ress);
          this.gameAdmin = ress || [];

          console.log('game admin= ', this.gameAdmin);

          this.gameCustomer = this.gameAdmin.filter(
            (g: any) => g.user_id === this.person.currentUserValue?.user_id,
          );
          const purchasedId = this.gameCustomer.map((g) => g.game_id);
          console.log('เกมที่ซื้อ ', purchasedId);
          this.filterOrders(false);
          this.gameState.gamePurchase(purchasedId);

          console.log('เกม admin order ', this.gameAdmin);
          console.log('เกมลูกค้า Orders ', this.gameCustomer);

          this.cdr.detectChanges();
        },

        error: (err) => {
          console.error('error ที่เกิดขึ้น ', err);
        },
      });
  }

  makeSuccess(item: any) {
    console.log('id = ', item.order_id);

    return this.orderService.updateStatusOrder(item.order_id).subscribe({
      next: (res) => {
        console.log('res = ', res);
        item.is_success = true;

        if (res.status === 200) {
          this.filterOrders(false);
          this.cdr.detectChanges();
          this.gameState.triggerRefresh();
        }
      },

      error: (err) => {
        console.error('error = ', err);
      },
    });
  }

  payAgain(item: any) {
    console.log('id = ', item.order_id);
    this.gameService.payGameAgain(item.order_id).subscribe({
      next: (res: any) => {
        console.log('res Pay Again= ', res);
        const url = res.body.detail.checkout;
        window.location.href = url;
      },
      error: (err) => {
        console.error('error = ', err);
      },
    });
  }

  startSearchListener() {
    this.orderState.searchOrder$.pipe(takeUntil(this.destroy$)).subscribe((text) => {
      this.currentSearchTerm = text;
      this.filterOrders(true);
      this.cdr.detectChanges();
    });
  }

  filterOrders(resetPage = true) {
    const term = this.currentSearchTerm ? this.currentSearchTerm.toLowerCase().trim() : '';

    if (!term) {
      this.filteredAdmin = [...this.gameAdmin];
      this.filteredCustomer = [...this.gameCustomer];
    } else {
      // Filter Admin orders (by game name, customer name, price)
      this.filteredAdmin = this.gameAdmin.filter((item: any) => {
        const gameName = (item.game_name || '').toLowerCase();
        const customerName = `${item.first_name || ''} ${item.last_name || ''}`.toLowerCase();
        const price = item.price !== undefined ? item.price.toString() : '';
        return gameName.includes(term) || customerName.includes(term) || price.includes(term);
      });

      // Filter Customer orders (by game name, price)
      this.filteredCustomer = this.gameCustomer.filter((item: any) => {
        const gameName = (item.game_name || '').toLowerCase();
        const price = item.price !== undefined ? item.price.toString() : '';
        return gameName.includes(term) || price.includes(term);
      });
    }

    if (resetPage) {
      this.currentPage = 0;
    }

    this.clampCurrentPage();
    this.updatePagedOrders();
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedOrders();

    //  1. สั่งให้ Angular อัปเดตข้อมูลในหน้าจอ (DOM) ให้เรียบร้อยก่อน
    this.cdr.detectChanges();

    //  2. ใช้ setTimeout ครอบ เพื่อรอให้เบราว์เซอร์ Render แถวใหม่เสร็จ แล้วค่อยสั่งเลื่อนขึ้นบนสุด
    setTimeout(() => {
      // ลองเลื่อนทั้งตัว Panel และเลื่อนแบบครอบคลุมเผื่อกรณี Layout อื่นด้วยครับ
      const element = document.querySelector('.main-content-panel');
      if (element) {
        element.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // ตัวช่วยกันเหนียว: เลื่อนหน้าต่างหลักของเบราว์เซอร์ด้วย
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); // ดีเลย์ไว้ 50ms เพื่อความชัวร์ในการคำนวณความสูงใหม่ของบราวเซอร์
  }

  private updatePagedOrders() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pageAdmin = this.filteredAdmin.slice(startIndex, endIndex);
    this.pageCustomer = this.filteredCustomer.slice(startIndex, endIndex);
  }

  private clampCurrentPage() {
    const maxPageAdmin = Math.max(Math.ceil(this.filteredAdmin.length / this.pageSize) - 1, 0);
    const maxPageCustomer = Math.max(
      Math.ceil(this.filteredCustomer.length / this.pageSize) - 1,
      0,
    );
    const maxPage = this.person.hasRole('customer') ? maxPageCustomer : maxPageAdmin;
    this.currentPage = Math.min(this.currentPage, maxPage);
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
