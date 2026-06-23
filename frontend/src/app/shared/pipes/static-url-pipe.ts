import { Pipe, PipeTransform } from '@angular/core';
import { STATIC_URL } from '../../core/constants/app-constants';

@Pipe({
  name: 'staticUrl',
  standalone: true,
})
export class StaticUrlPipe implements PipeTransform {
  transform(path: string): string {
    if (!path) return '';
    return `${STATIC_URL}/${path}`;
  }
}
