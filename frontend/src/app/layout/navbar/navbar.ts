import {
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  OnDestroy,
} from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../core/auth/auth';
import { GameStateService } from '../../features/games/services/game-state.service';
import { OrderStateService } from '../../features/orders/services/order-state.service';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { NovaConfirmService } from '../../shared/confirm/nova-confirm.service';
import { novaSwalDarkBase } from '@theme/swal-theme';
import { ActivatedRoute, NavigationEnd } from '@angular/router'; // 🚀 เพิ่ม NavigationEnd
import { filter, Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-navbar',
  imports: [MatToolbarModule, MatIcon, MatInputModule, MatButtonModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar implements OnInit {
  @ViewChild('searchInput') searchInput!: ElementRef;

  gameAll: any = [];
  isPaymentSuccessActive = false;

  private cdr = inject(ChangeDetectorRef);
  private confirm = inject(NovaConfirmService);
  private destroy$ = new Subject<void>(); // 🚀 สำหรับเคลียร์ memory

  constructor(
    public auth: AuthService,
    private gameState: GameStateService,
    private orderState: OrderStateService,
    private router: Router,
    private route: ActivatedRoute,
  ) {}

  ngOnInit() {
    //  แก้จุดที่ 2: ใช้ Router Events ดักจับแทน ActivatedRoute สำหรับคอมโพเนนต์ที่เป็น Global (Navbar)
    this.router.events
      .pipe(
        filter((event) => event instanceof NavigationEnd),
        takeUntil(this.destroy$),
      )
      .subscribe(() => {
        // แกะ Query Params ออกจาก URL ปัจจุบันด้วย parseUrl ของ Angular
        const urlTree = this.router.parseUrl(this.router.url);
        const paymentStatus = urlTree.queryParams['payment_status'];

        this.isPaymentSuccessActive = paymentStatus === 'success';
        this.cdr.detectChanges();
      });
  }

  toLogout() {
    this.confirm
      .open({
        title: 'Logout!',
        message: 'คุณต้องการออกจากระบบใช่หรือไม่',
        icon: 'warning',
        confirmText: 'ออกจากระบบ',
        cancelText: 'ยกเลิก',
      })
      .subscribe((status) => {
        if (status) {
          this.auth.logoutRequest().subscribe({
            next: (res) => {
              console.log(' log = ', res);
              if (res.status === 200) {
                Swal.fire({
                  title: 'Success',
                  topLayer: true,
                  text: 'Logout is done',
                  showConfirmButton: false,
                  scrollbarPadding: false,
                  reverseButtons: true,
                  icon: 'success',
                  timer: 2000,
                  ...novaSwalDarkBase(),
                });
                setTimeout(() => {
                  this.auth.logout();
                  this.clearSearch();
                }, 500);
              }
            },
            error: (err) => {
              console.error('err log', err);
            },
          });
        }
      });
  }

  isActive(path: string): boolean {
    // ใช้ split('?')[0] เพื่อตัด ?payment_status=... ทิ้งไป ดูกันที่เส้นทางหลักล้วนๆ
    const currentPath = this.router.url.split('?')[0];
    return currentPath === path;
  }

  private clearSearch() {
    if (this.searchInput) {
      this.searchInput.nativeElement.value = '';
    }
    this.orderState.updateOrderSearch('');
    this.gameState.updateSearchItem('');
    this.cdr.detectChanges();
  }

  search(text: string) {
    const currentRoute = this.router.url;

    if (currentRoute.includes('/order')) {
      console.log('Search in order ', text);
      this.orderState.updateOrderSearch(text);
    }
    this.gameState.updateSearchItem(text); //allgames
  }

  toMain() {
    this.router.navigate(['/main']);
    this.clearSearch();
    console.log('click enable');
  }

  toGameManage() {
    this.router.navigate(['/game-manage']);
    this.clearSearch();
  }

  goOrder() {
    this.router.navigate(['/order']);
    this.clearSearch();
  }

  goLibrary() {
    this.router.navigate(['/library']);
    this.clearSearch();
  }

  goChat() {
    this.router.navigate(['/chat']);
    this.clearSearch();
  }

  goDashboard() {
    this.router.navigate(['/dashboard']);
    this.clearSearch();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
