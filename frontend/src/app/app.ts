import { Component, inject, signal, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { OnInit } from '@angular/core';
import Swal from 'sweetalert2';
import { novaVar } from '@theme/nova-color';
import { novaSwalDarkBase } from '@theme/swal-theme';
import { GameService } from './features/games/services/game.service';
import { OrderStateService } from './features/orders/services/order-state.service';
import { NotificationService } from './features/notifications/services/notification.service';
import { AuthService } from './core/auth/auth';
import { filter, Subscription } from 'rxjs';
import { LoadingService } from './core/services/loading.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit, OnDestroy {
  protected readonly title = signal('test-angular');
  protected readonly loadingService = inject(LoadingService);
  private auth = inject(AuthService);
  private gameService = inject(GameService);
  private orderState = inject(OrderStateService);
  private notificationService = inject(NotificationService);
  private notificationSub?: Subscription;
  private authSub?: Subscription;

  ngOnInit() {
    this.authSub = this.auth.currentUser.subscribe((user) => {
      this.setupNotifications();
    });
  }

  ngOnDestroy() {
    if (this.notificationSub) this.notificationSub.unsubscribe();
    if (this.authSub) this.authSub.unsubscribe();
  }

  private setupNotifications() {
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
      this.notificationSub = undefined;
    }

    if (!this.auth.currentUserValue) {
      return;
    }

    if (this.auth.hasRole('admin') || this.auth.hasRole('owner')) {
      this.notificationSub = this.notificationService
        .ownerNotify()
        .pipe(filter((t) => t.type === 'orderNotify'))
        .subscribe({
          next: (res) => {
            const customer = res.customer;
            const game = res.game;
            const price = res.price;
            const raw = res.time;
            console.log('time = ', raw);
            const dateOnly = raw.split('T')[0];
            const timeOnly = raw.split('T')[1].slice(0, 5);
            const formatted = `${dateOnly} ${timeOnly}`;

            Swal.fire({
              html: `
                <div style="display:flex;margin:0px;padding:0px;box-sizing:border-box;justify-content:space-between">
                  <p style="margin:0px">&#128276;<b>มีออเดอร์ใหม่</b>  </p>
                  <p style="margin:0px">⏲ เวลา : ${formatted}</p>
                  </div>
                 <div style="display:flex;flex-direction:column;">
                  <p style="margin:4px 0 0 0">&#127918; เกม : <b>${game} </b></p>
                  <p style="margin:4px 4px 0 0">&#128100; ลูกค้า : <b>${customer}</p>
                  </div>
            
                
              `,
              ...novaSwalDarkBase(),
              toast: true,
              position: 'top',
              icon: 'success',
              width: '500px',
              topLayer: true,
              reverseButtons: true,
              background: novaVar('--nova-profile-text'),
              showConfirmButton: false,
              timerProgressBar: true,
              timer: 2000,
              scrollbarPadding: false,
            });
          },
          error: (err) => console.error('err_notify', err),
        });
    } else if (this.auth.hasRole('customer')) {
      this.notificationSub = this.notificationService.customerNotify().subscribe({
        next: (res) => {
          this.gameService.clearGameCache();
          console.log('res customer', res);
          this.orderState.triggerOrderRefresh();
          const game = res.game;

          Swal.fire({
            ...novaSwalDarkBase(),
            html: `<p>&#128276; ออเดอร์ของคุณได้รับการยืนยันแล้ว เกม : <b> ${game}</b></p>`,
            toast: true,
            position: 'top-end',
            icon: 'success',
            showConfirmButton: false,
            width: '700px',
            topLayer: true,
            background: novaVar('--nova-profile-text'),
            timer: 2000,
            heightAuto: false,
          });
        },
        error: (err) => console.error('noti_customer', err),
      });
    }
  }
}
