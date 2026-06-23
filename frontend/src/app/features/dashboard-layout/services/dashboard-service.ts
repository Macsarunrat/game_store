import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class DashboardService {
  private http = inject(HttpClient);

  private dateFilterSource = new BehaviorSubject<string>('day');
  dateFilter$ = this.dateFilterSource.asObservable();

  private cateFilterSource = new BehaviorSubject<number>(7);
  cateFilter$ = this.cateFilterSource.asObservable();

  getScoreChart() {
    return this.http.get('/api/v1/dashboard/header');
  }

  getAreaChart(date: string) {
    const params = new HttpParams().set('mode', date);
    return this.http.get(`/api/v1/dashboard/chart/trendline`, { params });
  }

  getDonutChart(data: number, date: string) {
    const params = new HttpParams().set('mode', date).set('category_id', data);

    return this.http.get('/api/v2/dashboard/chart/donut', { params });
  }

  updateDateFilter(data: string) {
    this.dateFilterSource.next(data);
  }

  updateCateFilter(data: number) {
    this.cateFilterSource.next(data);
  }
}
