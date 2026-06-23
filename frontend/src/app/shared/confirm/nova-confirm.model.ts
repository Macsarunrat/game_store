import { SweetAlertIcon } from 'sweetalert2';

export type NovaConfirmVariant = 'default' | 'danger';

export type NovaConfirmIcon = SweetAlertIcon;

export interface NovaConfirmConfig {
  title: string;
  message?: string;
  icon?: NovaConfirmIcon;
  variant?: NovaConfirmVariant;
  confirmText?: string;
  cancelText?: string;
  reverseButtons?: boolean;
}

export interface NovaChoiceConfirmConfig {
  title: string;
  message?: string;
  icon?: NovaConfirmIcon;
  confirmText: string;
  denyText?: string;
  cancelText?: string;
  showDenyButton?: boolean;
}

export type NovaChoiceResult = 'confirm' | 'deny' | 'cancel';
