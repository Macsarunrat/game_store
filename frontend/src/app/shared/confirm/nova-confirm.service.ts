import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';
import Swal from 'sweetalert2';

import { novaSwalDarkBase, novaSwalMultiAction } from '@theme/swal-theme';
import {
  NovaChoiceConfirmConfig,
  NovaChoiceResult,
  NovaConfirmConfig,
  NovaConfirmVariant,
} from './nova-confirm.model';

@Injectable({ providedIn: 'root' })
export class NovaConfirmService {
  /** ยืนยัน / ยกเลิก — ใช้แทน MatDialog Sharedialog */
  open(config: NovaConfirmConfig): Observable<boolean> {
    const variant = config.variant ?? 'default';
    const icon = config.icon ?? (variant === 'danger' ? 'warning' : 'question');

    return from(
      Swal.fire({
        title: config.title,
        text: config.message,
        icon,
        showCancelButton: true,
        confirmButtonText: config.confirmText ?? 'ยืนยัน',
        cancelButtonText: config.cancelText ?? 'ยกเลิก',
        reverseButtons: config.reverseButtons ?? false,
        scrollbarPadding: false,
        buttonsStyling: false,
        focusConfirm: true,
        topLayer: true,
        customClass: this.customClasses(variant),
        ...novaSwalDarkBase(),
      }),
    ).pipe(map((result) => result.isConfirmed === true));
  }

  /** ยืนยัน / deny / ยกเลิก (เช่น จัดการรูปภาพหลัก) */
  openChoice(config: NovaChoiceConfirmConfig): Observable<NovaChoiceResult> {
    const showDeny = config.showDenyButton ?? !!config.denyText;

    return from(
      Swal.fire({
        title: config.title,
        text: config.message,
        icon: config.icon ?? 'info',
        showConfirmButton: true,
        showDenyButton: showDeny,
        showCancelButton: true,
        confirmButtonText: config.confirmText,
        denyButtonText: config.denyText ?? '',
        cancelButtonText: config.cancelText ?? 'ยกเลิก',
        scrollbarPadding: false,
        buttonsStyling: false,
        topLayer: true,
        customClass: this.customClasses('default', true),
        ...novaSwalDarkBase(),
        ...novaSwalMultiAction(),
      }),
    ).pipe(
      map((result): NovaChoiceResult => {
        if (result.isConfirmed) {
          return 'confirm';
        }
        if (result.isDenied) {
          return 'deny';
        }
        return 'cancel';
      }),
    );
  }

  private customClasses(variant: NovaConfirmVariant, withDeny = false) {
    return {
      popup: 'nova-confirm-popup',
      title: 'nova-confirm-title',
      htmlContainer: 'nova-confirm-message',
      confirmButton:
        variant === 'danger'
          ? 'nova-confirm-btn nova-confirm-btn-danger'
          : 'nova-confirm-btn nova-confirm-btn-confirm',
      cancelButton: 'nova-confirm-btn nova-confirm-btn-cancel',
      ...(withDeny ? { denyButton: 'nova-confirm-btn nova-confirm-btn-deny' } : {}),
      icon: 'nova-confirm-icon',
    };
  }
}
