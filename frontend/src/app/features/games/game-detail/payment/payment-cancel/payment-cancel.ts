import { Component, OnInit } from '@angular/core';
import { inject } from '@angular/core/primitives/di';
import { ActivatedRoute, Router } from '@angular/router';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-payment-cancel',
  imports: [],
  templateUrl: './payment-cancel.html',
  styleUrl: './payment-cancel.css',
})
export class PaymentCancel implements OnInit {
  orderId: number = 0;
  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  // payment-cancel.component.ts
  ngOnInit(): void {
    this.orderId = Number(this.route.snapshot.queryParamMap.get('order_id'));
    this.router.navigate(['/main'], {
      queryParams: { payment_status: 'cancel', order_id: this.orderId },
    });
  }
}
