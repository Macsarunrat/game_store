import { Component, HostBinding, inject } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';

import { ApexChart, ApexAxisChartSeries, ApexXAxis, ApexTitleSubtitle } from 'ng-apexcharts';
import { ScoreChart } from './components/score-chart/score-chart';
import { AreaChart } from './components/area-chart/area-chart';
import { DonutChart } from './components/donut-chart/donut-chart';
import { scoreModel } from './shared/model/chart-model';
import { OnInit } from '@angular/core';
import { areaModel } from './shared/model/chart-model';
import { DashboardService } from '../services/dashboard-service';
import { ChangeDetectorRef } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { combineLatest } from 'rxjs';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  imports: [
    NgApexchartsModule,
    ScoreChart,
    AreaChart,
    DonutChart,
    MatTooltipModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard implements OnInit {
  private cdr = inject(ChangeDetectorRef);
  private dashboardService = inject(DashboardService);
  private route = inject(ActivatedRoute);
  scoreData!: scoreModel;
  areaData!: areaModel;
  selectedFilter = 'day';

  wordQuery = ['day', 'week', 'month', 'year'];

  @HostBinding('class.dashboard-route')
  get isDashboardRoute() {
    return this.route.snapshot.routeConfig?.path === 'dashboard';
  }

  ngOnInit(): void {
    this.dashboardService.getScoreChart().subscribe({
      next: (scoreRes: any) => {
        console.log('score = ', scoreRes);
        this.scoreData = scoreRes.detail;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('score failded = ', err);
      },
    });
  }

  onDateChange(newDate: string) {
    // สั่งเปลี่ยนวันที่ผ่าน Service (ไม่ต้องใช้ @Input เลย)
    const filterValue = newDate || 'day';
    this.dashboardService.updateDateFilter(filterValue);
    this.selectedFilter = filterValue;
    console.log('วันปัจจุบัน ', newDate);
  }
}
