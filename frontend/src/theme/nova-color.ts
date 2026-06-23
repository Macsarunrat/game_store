/** อ่านค่าจาก CSS variables ใน tokens.css */
export function novaVar(name: string): string {
  if (typeof document === 'undefined') {
    return '';
  }
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** พาเลตสำหรับ ApexCharts */
export function novaChartColors(): string[] {
  return [
    novaVar('--nova-chart-1'),
    novaVar('--nova-chart-2'),
    novaVar('--nova-chart-3'),
    novaVar('--nova-chart-4'),
    novaVar('--nova-chart-5'),
    novaVar('--nova-chart-6'),
  ];
}
