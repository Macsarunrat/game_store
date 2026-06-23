import { Component, inject, OnInit, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ChangeDetectorRef } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule, MatSelectChange } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { combineLatest, switchMap } from 'rxjs';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexDataLabels,
  ApexLegend,
  ApexTooltip,
  ApexPlotOptions,
  ApexResponsive,
  ApexTheme,
  ApexTitleSubtitle,
  NgApexchartsModule,
} from 'ng-apexcharts';

import { DashboardService } from '../../../services/dashboard-service';
import { GameService } from '../../../../games/services/game.service';
import { novaChartColors, novaVar } from '@theme/nova-color';

export type ChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  dataLabels: ApexDataLabels;
  legend: ApexLegend;
  title: ApexTitleSubtitle;
  tooltip: ApexTooltip;
  plotOptions: ApexPlotOptions;
  responsive: ApexResponsive[];
  theme: ApexTheme;
  colors?: string[];
  states?: any;
};

@Component({
  selector: 'app-donut-chart',
  standalone: true, // เพิ่ม standalone หากใช้ Angular 15+ แบบไม่มี NgModule
  imports: [
    NgApexchartsModule,
    MatButtonModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
  ],
  templateUrl: './donut-chart.html',
  styleUrl: './donut-chart.css',
})
export class DonutChart implements OnInit {
  private dashboardService = inject(DashboardService);
  private cdr = inject(ChangeDetectorRef);
  private game = inject(GameService);
  private destroyRef = inject(DestroyRef); //  สำหรับเคลียร์ Memory เมื่อทำลาย Component

  finalData: any[] = [];
  selectedCate = new FormControl('');
  categoryList: any[] = [];
  isChartReady: boolean = false;

  public chartOptions: Partial<ChartOptions> = {
    series: [],
    chart: {
      width: '100%',
      height: '100%',
      type: 'pie',
      background: novaVar('--nova-primary'),
      animations: {
        enabled: true,
        speed: 800,
        dynamicAnimation: {
          enabled: true,
          speed: 350,
        },
      },
    },
    title: {
      text: 'สัดส่วน 10 เกมยอดนิยมของแต่ละหมวดหมู่',
      align: 'center',
      margin: 15,
      style: {
        fontSize: '16px',
        fontWeight: 'bold',
        color: novaVar('--nova-text-on-dark'),
      },
    },
    labels: [],
    colors: novaChartColors(),
    dataLabels: {
      enabled: true,
      style: { colors: [novaVar('--nova-text-on-dark')] },
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      itemMargin: { horizontal: 8, vertical: 4 },
      labels: { colors: novaVar('--nova-text-on-dark') },
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        customScale: 0.9,
      },
    },
    states: {
      hover: { filter: { type: 'lighten', value: 0.15 } },
      active: {
        allowMultipleDataPointsSelection: false,
        filter: { type: 'none', value: 0 },
      },
    },
    theme: { mode: 'dark' },
    responsive: [
      {
        breakpoint: 768,
        options: {
          chart: { height: 340 },
          legend: { position: 'bottom' },
        },
      },
    ],
  };

  ngOnInit(): void {
    // โหลดรายชื่อหมวดหมู่
    this.game
      .getAllCategories()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (cate: any) => {
          console.log('cate = ', cate.detail);
          this.categoryList = cate.detail;

          const defaultCategory = this.categoryList.find((c: any) => c.catagory_id === 7);
          if (defaultCategory) {
            this.selectedCate.setValue(defaultCategory); // สั่งยัด Object เข้าไปใน Form
          }
        },
        error: (err) => console.error('cate error = ', err),
      });

    //  Reactive Pipeline: มัดรวม State วันที่และหมวดหมู่ จาก Service
    combineLatest([this.dashboardService.dateFilter$, this.dashboardService.cateFilter$])
      .pipe(
        // ยิง API ใหม่ทุกครั้งที่ วันที่ หรือ หมวดหมู่ เปลี่ยน
        switchMap(([date, cateId]) => this.dashboardService.getDonutChart(cateId, date)),
        takeUntilDestroyed(this.destroyRef), // เคลียร์ Subscribe ตอนเปลี่ยนหน้า
      )
      .subscribe({
        next: (res: any) => {
          const donutData = res.detail?.game_list || [];
          console.log('donut API data:', donutData);
          this.renderChart(donutData);
        },
        error: (err) => console.error('donut failed = ', err),
      });
  }

  // แยก Logic การคำนวณกราฟออกมาเพื่อให้อ่านง่าย
  // private renderChart(donutData: any[]): void {
  //   if (!donutData || donutData.length === 0) {
  //     this.chartOptions = {
  //       ...this.chartOptions,
  //       series: [1],
  //       labels: ['ไม่มีข้อมูล'],
  //       colors: ['rgba(255, 255, 255, 0.1)'],
  //       dataLabels: {
  //         enabled: false
  //       },
  //       legend: {
  //         ...this.chartOptions.legend,
  //         show: false
  //       },
  //       tooltip: {
  //         enabled: false
  //       }
  //     };
  //     this.cdr.detectChanges();
  //     return;
  //   }

  //   const total = donutData.reduce((sum: number, item: any) => sum + item.count_order, 0);

  //   // หากยอดออเดอร์ทั้งหมดเท่ากับ 0 ก็แสดงเป็นวงกลมว่างเปล่าเช่นกัน
  //   if (total === 0) {
  //     this.chartOptions = {
  //       ...this.chartOptions,
  //       series: [1],
  //       labels: ['ไม่มีข้อมูล'],
  //       colors: ['rgba(255, 255, 255, 0.1)'],
  //       dataLabels: {
  //         enabled: false
  //       },
  //       legend: {
  //         ...this.chartOptions.legend,
  //         show: false
  //       },
  //       tooltip: {
  //         enabled: false
  //       }
  //     };
  //     this.cdr.detectChanges();
  //     return;
  //   }

  //   const threshold = total * 0.05;

  //   const mainItems = donutData.filter((item: any) => item.count_order > threshold);
  //   const otherItems = donutData.filter((item: any) => item.count_order <= threshold);
  //   const otherTotal = otherItems.reduce((sum: number, item: any) => sum + item.count_order, 0);

  //   this.finalData =
  //     otherItems.length > 0
  //       ? [...mainItems, { game_name: 'อื่นๆ', count_order: otherTotal }]
  //       : mainItems;

  //   this.chartOptions = {
  //     ...this.chartOptions,
  //     series: this.finalData.map((item: any) => item.count_order),
  //     labels: this.finalData.map((item: any) => item.game_name),
  //     colors: novaChartColors(),
  //     dataLabels: {
  //       enabled: true,
  //       style: { colors: [novaVar('--nova-text-on-dark')] }
  //     },
  //     legend: {
  //       ...this.chartOptions.legend,
  //       show: true
  //     },
  //     tooltip: {
  //       enabled: true,
  //       custom: ({ series, seriesIndex, w }) => {
  //         const label = w.config.labels[seriesIndex];
  //         const value = series[seriesIndex];

  //         if (label === 'อื่นๆ') {
  //           const detail = otherItems
  //             .map(
  //               (item: any) =>
  //                 `<div style="padding: 2px 0;">• ${item.game_name}: ${item.count_order.toLocaleString()} ออเดอร์</div>`,
  //             )
  //             .join('');

  //           return `
  //             <div style="padding: 10px;background: ${novaVar('--nova-primary')}; color: ${novaVar('--nova-text-on-dark')}; border: 1px solid ${novaVar('--nova-info-swal')}; border-radius: 5px; font-family: inherit;">
  //               <strong style="color: ${novaVar('--nova-accent')};">${label}: ${value.toLocaleString()} ออเดอร์</strong>
  //               <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--nova-border-dashed); font-size: 12px; color: ${novaVar('--nova-text-on-accent-bg')};">
  //                 ${detail}
  //               </div>
  //             </div>
  //           `;
  //         }

  //         return `
  //           <div style="padding: 10px; background: ${novaVar('--nova-primary')}; color: ${novaVar('--nova-text-on-dark')}; border: 1px solid ${novaVar('--nova-info-swal')}; border-radius: 5px; font-family: inherit;">
  //             <strong>${label}:</strong> ${value.toLocaleString()} ออเดอร์
  //           </div>
  //         `;
  //       },
  //     },
  //   };
  //   this.cdr.detectChanges();
  // }

  // แยก Logic การคำนวณกราฟออกมาเพื่อให้อ่านง่าย
  private renderChart(donutData: any[]): void {
    if (!donutData || donutData.length === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [1],
        labels: ['ไม่มีข้อมูล'],
        colors: ['rgba(255, 255, 255, 0.1)'],
        dataLabels: { enabled: false },
        legend: { ...this.chartOptions.legend, show: false },
        tooltip: { enabled: false },
      };
      this.cdr.detectChanges();
      return;
    }

    const total = donutData.reduce((sum: number, item: any) => sum + item.count_order, 0);

    if (total === 0) {
      this.chartOptions = {
        ...this.chartOptions,
        series: [1],
        labels: ['ไม่มีข้อมูล'],
        colors: ['rgba(255, 255, 255, 0.1)'],
        dataLabels: { enabled: false },
        legend: { ...this.chartOptions.legend, show: false },
        tooltip: { enabled: false },
      };
      this.cdr.detectChanges();
      return;
    }

    // ================= เริ่มแก้ไขตรงนี้ =================

    // 1. เรียงลำดับข้อมูลจากยอดออเดอร์มากไปน้อย (กันเหนียวเผื่อ API ไม่ได้เรียงมาให้)
    const sortedData = [...donutData].sort((a, b) => b.count_order - a.count_order);

    // 2. ตัดเอาเฉพาะ 10 อันดับแรกมาเป็นตัวหลัก
    const mainItems = sortedData.slice(0, 10);

    // 3. ตัวที่เหลือตั้งแต่อันดับที่ 11 เป็นต้นไป จะถูกแยกไปอยู่ในกลุ่ม "อื่นๆ"
    const otherItems = sortedData.slice(10);
    const otherTotal = otherItems.reduce((sum: number, item: any) => sum + item.count_order, 0);

    // 4. ประกอบข้อมูลร่างสุดท้าย ถ้ามีกลุ่ม "อื่นๆ" ให้ Push ต่อท้ายเข้าไป
    this.finalData =
      otherItems.length > 0
        ? [...mainItems, { game_name: 'อื่นๆ', count_order: otherTotal }]
        : mainItems;

    // ================= สิ้นสุดการแก้ไขโครงสร้างข้อมูล =================

    this.chartOptions = {
      ...this.chartOptions,
      series: this.finalData.map((item: any) => item.count_order),
      labels: this.finalData.map((item: any) => item.game_name),
      colors: novaChartColors(),
      dataLabels: {
        enabled: true,
        style: { colors: [novaVar('--nova-text-on-dark')] },
      },
      legend: {
        ...this.chartOptions.legend,
        show: true,
      },
      tooltip: {
        enabled: true,
        custom: ({ series, seriesIndex, w }) => {
          const label = w.config.labels[seriesIndex];
          const value = series[seriesIndex];

          if (label === 'อื่นๆ') {
            // โค้ด Tooltip เดิมของคุณจะเอารายชื่อเกมที่เหลือ (อันดับ 11 เป็นต้นไป) มา Loop โชว์ที่นี่อัตโนมัติ
            const detail = otherItems
              .map(
                (item: any) =>
                  `<div style="padding: 2px 0;">• ${item.game_name}: ${item.count_order.toLocaleString()} ออเดอร์</div>`,
              )
              .join('');

            return `
              <div style="padding: 10px;background: ${novaVar('--nova-primary')}; color: ${novaVar('--nova-text-on-dark')}; border: 1px solid ${novaVar('--nova-info-swal')}; border-radius: 5px; font-family: inherit;">
                <strong style="color: ${novaVar('--nova-accent')};">${label}: ${value.toLocaleString()} ออเดอร์</strong>
                <div style="margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--nova-border-dashed); font-size: 12px; color: ${novaVar('--nova-text-on-accent-bg')};">
                  ${detail}
                </div>
              </div>
            `;
          }

          return `
            <div style="padding: 10px; background: ${novaVar('--nova-primary')}; color: ${novaVar('--nova-text-on-dark')}; border: 1px solid ${novaVar('--nova-info-swal')}; border-radius: 5px; font-family: inherit;">
              <strong>${label}:</strong> ${value.toLocaleString()} ออเดอร์
            </div>
          `;
        },
      },
    };
    this.cdr.detectChanges();
  }

  //  ส่งค่าที่เลือกไปให้ Service จัดการ (ตัว Component ไม่เก็บ State เอง)
  isSelected(event: MatSelectChange) {
    const selectedObject = event.value;
    console.log('ข้อมูลหมวดหมู่ทั้งหมดที่เลือก:', selectedObject);

    if (selectedObject && selectedObject.catagory_id) {
      const id = selectedObject.catagory_id;
      console.log('ID ที่เลือกคือ:', id);
      this.dashboardService.updateCateFilter(id);
    }
  }

  onMouseMove(event: MouseEvent): void {
    const container = event.currentTarget as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      container.style.setProperty('--mouse-x', `${x}px`);
      container.style.setProperty('--mouse-y', `${y}px`);
    }
  }
}
