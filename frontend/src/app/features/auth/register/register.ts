import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  FormControl,
  Validators,
  ReactiveFormsModule,
  FormGroup,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
import { MatError } from '@angular/material/input';
import { ChatService } from '../../chat-system/services/chat-service';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';
import { MatDialog } from '@angular/material/dialog';
import { NovaConfirmService } from '../../../shared/confirm/nova-confirm.service';
import { TouchedErrorStateMatcher } from './mange-state/touch-error';

export function passwordValidator(control: AbstractControl): ValidationErrors | null {
  const value = control.value;
  if (!value) return null;

  const hasUpperCase = /[A-Z]/.test(value);
  const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(value);
  const hasMinLength = value.length >= 8;

  if (!hasUpperCase) return { noUpperCase: true };
  if (!hasSpecialChar) return { noSpecialChar: true };
  if (!hasMinLength) return { minLength: true };

  return null;
}

@Component({
  selector: 'app-register',
  imports: [
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    ReactiveFormsModule,
  ],
  templateUrl: './register.html',
  styleUrl: './register.css',
})
export class Register {
  chat = inject(ChatService);
  cdr = inject(ChangeDetectorRef);
  hidePassWord: boolean = true;
  userName = new FormControl('', Validators.required);
  dialog = inject(MatDialog);
  private confirm = inject(NovaConfirmService);
  matcher = new TouchedErrorStateMatcher();
  registerField = new FormGroup({
    firstName: new FormControl('', [Validators.required]),
    surName: new FormControl('', [Validators.required]),
    userName: new FormControl('', [Validators.required, Validators.minLength(4)]),
    passWord: new FormControl('', [passwordValidator, Validators.required]),
    email: new FormControl('', [Validators.email, Validators.required]),
  });

  visible() {
    this.hidePassWord = !this.hidePassWord;
  }

  toRegister(value: any) {
    console.log('value = ', value);

    this.confirm
      .open({
        title: 'ยืนยันในการสร้างบัญชีนี้',
        icon: 'question',
        confirmText: 'สร้างบัญชี',
        cancelText: 'ยกเลิก',
      })
      .subscribe((result) => {
        console.log('result = ', result);

        if (result) {
          this.chat.postCreateAccount(value).subscribe({
            next: (res) => {
              console.log('Create account successful ', res);
              this.registerField.reset();
              this.registerField.markAsPristine();
              this.registerField.markAsUntouched();
              this.cdr.detectChanges();
              if (res.status === 200) {
                Swal.fire({
                  icon: 'success',
                  title: 'Successfully',
                  text: 'Account was created',
                  timer: 2000,
                  showConfirmButton: false,
                  topLayer: true,
                  ...novaSwalConfirmPrimary(),
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                }).then(() => {
                  this.dialog.closeAll();
                });
              }
            },
            error: (err) => {
              console.error('Create account failed ', err);
              // แนะนำเพิ่ม error alert
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                timer: 2000,
                topLayer: true,
                showConfirmButton: false,
                text: err.error.message || 'Something went wrong',
                ...novaSwalConfirmPrimary(),
                scrollbarPadding: false,
                ...novaSwalDarkBase(),
              });
            },
          });
        }
      });
  }
}
