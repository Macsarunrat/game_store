import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OrderStateService } from '../../../../orders/services/order-state.service';

@Component({
  selector: 'app-payment-success',
  imports: [],
  templateUrl: './payment-success.html',
  styleUrl: './payment-success.css',
})
export class PaymentSuccess implements OnInit {
  orderId: number = 0;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderState: OrderStateService,
  ) {}

  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.queryParamMap.get('order_id'));

    // trigger ให้หน้า Order โหลดใหม่เมื่อ Stripe redirect กลับมา
    this.orderState.triggerOrderRefresh();

    // redirect ไปหน้า library (Order ของลูกค้า) เพื่อให้เห็นสถานะที่อัพเดทแล้ว
    this.router.navigate(['/library'], {
      queryParams: { payment_status: 'success', order_id: this.orderId },
    });
  }
}
