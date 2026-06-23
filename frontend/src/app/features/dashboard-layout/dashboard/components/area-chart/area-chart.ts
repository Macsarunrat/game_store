import { AfterViewInit, Component, inject, ViewChild } from '@angular/core';
import { NgApexchartsModule, ChartComponent } from 'ng-apexcharts';
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexFill,
  ApexStroke,
  ApexTooltip,
  ApexDataLabels,
  ApexMarkers,
  ApexTheme,
  ApexTitleSubtitle,
} from 'ng-apexcharts';
import { DashboardService } from '../../../services/dashboard-service';
import { switchMap } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { novaVar } from '@theme/nova-color';

type TrendItem = {
  date: string;
  income: number;
};

type TrendPayload = {
  trend_data: TrendItem[];
  mode?: string;
};

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  title: ApexTitleSubtitle;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  fill: ApexFill;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  dataLabels: ApexDataLabels;
  markers: ApexMarkers;
  theme: ApexTheme;
};

@Component({
  selector: 'app-area-chart',
  standalone: true,
  imports: [NgApexchartsModule],
  templateUrl: './area-chart.html',
  styleUrl: './area-chart.css',
})
export class AreaChart implements AfterViewInit {
  @ViewChild('chart') chart!: ChartComponent;
  private dashboardService = inject(DashboardService);
  private centerMin = 0;
  private centerMax = 0;
  private readonly hourInMs = 60 * 60 * 1000;
  private cdr = inject(ChangeDetectorRef);

  chartOptions: Partial<ChartOptions> = {
    series: [{ name: 'รายได้', data: [] }],
    chart: {
      type: 'area',
      width: '100%',
      height: '100%',
      parentHeightOffset: 0,
      stacked: false,
      background: novaVar('--nova-primary'),
      zoom: {
        type: 'x',
        enabled: true,
        autoScaleYaxis: true,
      },
      toolbar: {
        autoSelected: 'zoom',
      },
      events: {
        beforeResetZoom: () => {
          return {
            xaxis: {
              min: this.centerMin,
              max: this.centerMax,
            },
          };
        },
      },
    },
    title: {
      text: 'รายได้ย้อนหลัง',
      align: 'left',
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: novaVar('--nova-text-on-dark'),
      },
    },
    dataLabels: { enabled: false },
    markers: {
      size: 0,
      hover: {
        size: 5,
      },
    },
    fill: {
      type: 'gradient',
      gradient: {
        shadeIntensity: 1,
        inverseColors: false,
        opacityFrom: 0.5,
        opacityTo: 0,
        stops: [0, 90, 100],
      },
    },
    stroke: { curve: 'smooth', width: 2 },
    xaxis: { type: 'datetime' },
    yaxis: {
      labels: {
        formatter: (val) => '฿' + val.toLocaleString(),
      },
      title: {
        text: 'รายได้',
        style: { fontSize: '16px' },
      },
    },
    tooltip: {
      enabled: true,
      shared: false,
      intersect: false,
      followCursor: true,
      custom: ({ series, seriesIndex, dataPointIndex, w }) => {
        const value = series[seriesIndex][dataPointIndex];
        const timestamp = w.globals.seriesX[seriesIndex][dataPointIndex];
        const date = new Date(timestamp).toLocaleString('th-TH', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        });

        return `
          <div class="area-chart-tooltip">
            <div class="area-chart-tooltip__date">${date}</div>
            <div class="area-chart-tooltip__value">฿${value.toLocaleString()}</div>
          </div>
        `;
      },
    },
    theme: { mode: 'dark' },
  };

  ngAfterViewInit(): void {
    this.dashboardService.dateFilter$
      .pipe(switchMap((filter: string) => this.dashboardService.getAreaChart(filter)))
      .subscribe({
        next: (res: any) => {
          console.log('area = ', res);

          const payload = this.getTrendPayload(res);
          const areaData = payload.trend_data
            .map((item) => ({
              date: item.date,
              income: Number(item.income ?? 0),
              timestamp: this.toTimestamp(item.date),
            }))
            .filter((item) => Number.isFinite(item.timestamp))
            .sort((a, b) => a.timestamp - b.timestamp);

          if (areaData.length === 0) {
            this.chart.updateSeries([{ name: 'รายได้', data: [] }]);
            return;
          }

          // 🚀 1. หาเวลาที่ใหม่ที่สุดจากข้อมูล (Max Date)
          const latestDate = areaData[areaData.length - 1].timestamp;

          // 🚀 2. กำหนดระยะเวลาย้อนหลัง (เป็นมิลลิวินาที) ตาม Mode
          let timeRangeMs = 0;
          switch (payload.mode) {
            case 'day':
              timeRangeMs = 24 * 60 * 60 * 1000; // 24 ชั่วโมง
              break;
            case 'week':
              timeRangeMs = 7 * 24 * 60 * 60 * 1000; // 7 วัน
              break;
            case 'month':
              timeRangeMs = 31 * 24 * 60 * 60 * 1000; // 31 วัน
              break;
            case 'year':
              // 12 เดือน (ประมาณ 365 วัน)
              timeRangeMs = 365 * 24 * 60 * 60 * 1000;
              break;
            default:
              timeRangeMs = 24 * 60 * 60 * 1000; // ค่าเริ่มต้นเป็น 24 ชม.
          }

          // 🚀 3. คำนวณ min / max ของกราฟ
          // เราบวก rangePadding นิดหน่อยเพื่อให้จุดสุดท้ายไม่ชิดขอบจอจนเกินไป
          const rangePadding = timeRangeMs * 0.05;

          this.centerMax = latestDate + rangePadding;
          this.centerMin = latestDate - timeRangeMs - rangePadding;

          // 🚀 4. Map Format ของแกน X ให้โค้ดอ่านง่าย
          const xAxisFormats: Record<string, string> = {
            day: 'HH:mm',
            week: 'dd MMM',
            month: 'dd/MM',
            year: 'MMM yy',
          };
          const currentFormat = xAxisFormats[payload.mode || 'day'] || 'HH:mm';

          this.chart.updateSeries([
            {
              name: 'รายได้',
              data: areaData.map((item) => [item.timestamp, item.income]),
            },
          ]);

          this.chart.updateOptions({
            title: {
              ...this.chartOptions.title,
              text:
                payload.mode === 'day'
                  ? 'รายได้รายชั่วโมง (เฉพาะวันนี้)'
                  : payload.mode === 'week'
                    ? 'รายได้รายวัน (เฉพาะสัปดาห์นี้)'
                    : payload.mode === 'month'
                      ? 'รายได้รายวัน (เฉพาะเดือนนี้)'
                      : payload.mode === 'year'
                        ? 'รายได้รายเดือน (เฉพาะปีนี้)'
                        : 'รายได้ย้อนหลัง',
            },
            xaxis: {
              type: 'datetime',
              min: this.centerMin,
              max: this.centerMax,
              labels: {
                datetimeUTC: false,
                format: currentFormat,
              },
            },
          });

          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('area value failed = ', err);
        },
      });
  }

  private getTrendPayload(res: any): TrendPayload {
    const payload = res?.detail ?? res;

    return {
      trend_data: Array.isArray(payload?.trend_data) ? payload.trend_data : [],
      mode: payload?.mode,
    };
  }

  private toTimestamp(date: string): number {
    return new Date(date.replace(' ', 'T')).getTime();
  }
}
