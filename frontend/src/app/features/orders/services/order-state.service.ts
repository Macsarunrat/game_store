import { Injectable } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class OrderStateService {
  private searchOrderSource = new BehaviorSubject<string>('');
  private refreshOrderSource = new Subject<void>();

  searchOrder$ = this.searchOrderSource.asObservable();
  refreshOrder$ = this.refreshOrderSource.asObservable();

  updateOrderSearch(text: string) {
    this.searchOrderSource.next(text);
  }

  triggerOrderRefresh() {
    this.refreshOrderSource.next();
  }
}
