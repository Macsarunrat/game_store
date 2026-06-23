import { Routes } from '@angular/router';

import { FormLogin } from './features/auth/login/form-login';
import { roleGuard } from './core/guards/roleguard-guard';
import { MainLayout } from './layout/main-layout/main-layout';
import { Allgame } from './features/games/all-games/allgame';
import { Order } from './features/orders/order/order';
import { Chat } from './features/chat-system/chat/chat';
import { Dashboard } from './features/dashboard-layout/dashboard/dashboard';
import { GameManage } from './features/games/game-manage/game-manage';
import { PaymentCancel } from './features/games/game-detail/payment/payment-cancel/payment-cancel';
import { PaymentSuccess } from './features/games/game-detail/payment/payment-success/payment-success';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: FormLogin },
  { path: 'payment/success', component: PaymentSuccess },
  { path: 'payment/cancel', component: PaymentCancel },
  {
    path: '',
    component: MainLayout,
    canActivate: [roleGuard],
    canActivateChild: [roleGuard],
    children: [
      {
        path: 'main',
        component: Allgame,
        data: { roles: ['customer'] },
      },
      {
        path: 'order',
        component: Order,
        data: { roles: ['admin', 'owner'] },
      },
      {
        path: 'library',
        component: Order,
        data: { roles: ['customer'] },
      },
      {
        path: 'chat',
        component: Chat,
        data: { roles: ['customer', 'admin', 'owner'] },
      },
      {
        path: 'dashboard',
        component: Dashboard,
        data: { roles: ['owner'] },
      },
      {
        path: 'game-manage',
        component: GameManage,
        data: { roles: ['admin', 'owner'] },
      },
    ],
  },
  { path: '**', redirectTo: 'login' },
];
