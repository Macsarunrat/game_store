// roleguard-guard.ts
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  const user = authService.currentUserValue;
  const userRoles = user?.roles; // เช่น ['customer']

  // 1. ถ้าไม่มี User ล็อกอินอยู่เลย หรือไม่มี Role
  if (!user || !userRoles || userRoles.length === 0) {
    // alert('Access Denied: No Role Found');
    router.navigate(['/login']);
    return false;
  }

  // 2. ถ้ามี User แล้ว แต่กำลังจะเข้าหน้าที่มีการระบุสิทธิ์เฉพาะ (Data Roles)
  const expectedRoles = route.data['roles'] as Array<string>;

  // ถ้าหน้านั้นกำหนด Role ไว้ แล้วเราไม่มี Role ที่ตรงกัน
  if (expectedRoles && !expectedRoles.includes(userRoles[0])) {
    Swal.fire({
      icon: 'error',
      title: 'Failed',
      timer: 2000,
      topLayer: true,
      showConfirmButton: false,
      text: 'คุณไม่มีสิทธิ์เข้าถึงหน้านี้',
      ...novaSwalConfirmPrimary(),
      scrollbarPadding: false,
      ...novaSwalDarkBase(),
    });
    // ป้องกัน infinite loop กรณีที่พยายาม redirect ไปหน้าเดิมที่ไม่มีสิทธิ์
    if (userRoles.includes('admin') || userRoles.includes('owner')) {
      router.navigate(['/game-manage']);
    } else if (userRoles.includes('customer')) {
      router.navigate(['/main']);
    } else {
      router.navigate(['/login']);
    }
    return false;
  }

  //ผ่านทุกเงื่อนไข อนุญาตให้เข้าได้
  return true;
};
