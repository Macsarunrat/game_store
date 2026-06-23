// form-login.ts
import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, effect, inject, OnInit, signal } from '@angular/core';
import { MatSlideToggle } from '@angular/material/slide-toggle';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';
import { AuthService } from '../../../core/auth/auth';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { HttpParams } from '@angular/common/http';
import { MatDividerModule } from '@angular/material/divider';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Register } from '../register/register';

@Component({
  selector: 'app-form-login',
  imports: [
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatIconModule,
    ReactiveFormsModule,
    MatCardModule,
    MatDividerModule,
    MatDialogModule,
  ],
  standalone: true,
  templateUrl: './form-login.html',
  styleUrl: './form-login.css',
})
export class FormLogin implements OnInit {
  private snackBar = inject(MatSnackBar);
  user$: any = [];
  loginResponse: any = [];
  role: string = '';
  apiMessage = signal<string>('');
  isLoading = signal(false);

  game: any[] = [];
  readonly dialog = inject(MatDialog);

  user = new FormControl('', Validators.required);
  pass = new FormControl('', Validators.required);
  hidePassword = true;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  ngOnInit() {}

  toLogin() {
    if (this.user.invalid || this.pass.invalid) return;

    this.isLoading.set(true);

    const payload = new HttpParams()
      .set('username', this.user.value ?? '')
      .set('password', this.pass.value ?? ''); //ถ้า null return ''

    this.auth.login(payload).subscribe({
      next: (res) => {
        if (res.status_code === 401) {
          console.log(res);
          console.log('Logical Error:', res.message);
          this.apiMessage.set(res.message);
          this.isLoading.set(false);
        } else {
          Swal.fire({
            title: 'Success',
            text: 'Login Successfully',
            showConfirmButton: false,
            icon: 'success',
            topLayer: true,
            timer: 2000,
            ...novaSwalConfirmPrimary(),
            returnFocus: false,
            scrollbarPadding: false,
            ...novaSwalDarkBase(),
          }).then(() => {
            if (this.auth.hasAnyRole(['admin', 'owner'])) {
              this.router.navigate(['/game-manage']);
            } else {
              this.router.navigate(['/main']);
            }
          });
        }
      },
      error: (err) => {
        console.error('not found api ', err);
        Swal.fire({
          icon: 'error',
          title: 'Failed',
          timer: 2000,
          topLayer: true,
          showConfirmButton: false,
          text: 'Username or Password incorrect',
          ...novaSwalConfirmPrimary(),
          scrollbarPadding: false,
          ...novaSwalDarkBase(),
        });
        this.isLoading.set(false);
        this.apiMessage.set('username or password ไม่ถูกต้อง');
      },
    });
  }

  register() {
    const registerDialog = this.dialog.open(Register, {
      position: {},
      width: '50vw',
      panelClass: 'register-panel',
    });
  }
}
