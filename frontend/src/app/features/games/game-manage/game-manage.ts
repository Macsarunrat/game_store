import { Component, OnInit, ChangeDetectorRef, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { Overlay } from '@angular/cdk/overlay';
import { Subject, takeUntil, debounceTime, distinctUntilChanged } from 'rxjs';

import { AuthService } from '../../../core/auth/auth';
import { GameService } from '../services/game.service';
import { GameStateService } from '../services/game-state.service';
import { UpdateDialog } from '../dialogs/update-dialog/update-dialog';
import { CreateDialog } from '../dialogs/create-dialog/create-dialog';
import { GameMedia } from '../media/game-media/game-media';
import { StaticUrlPipe } from '../../../shared/pipes/static-url-pipe';
import Swal from 'sweetalert2';
import { novaSwalConfirmAccent, novaSwalDarkBase } from '@theme/swal-theme';
import { NovaConfirmService } from '../../../shared/confirm/nova-confirm.service';
import { Animation } from '../../../shared/animate/all-animate/Fade-up/animation';

@Component({
  selector: 'app-game-manage',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
    MatPaginatorModule,
    StaticUrlPipe,
    Animation,
  ],
  templateUrl: './game-manage.html',
  styleUrl: './game-manage.css',
})
export class GameManage implements OnInit, OnDestroy {
  gamesList: any[] = [];
  filteredGames: any[] = [];
  pageGames: any[] = [];
  searchTerm: string = '';
  pageSize = 10;
  currentPage = 0;
  isOwner: boolean = false;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  private auth = inject(AuthService);
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private confirm = inject(NovaConfirmService);
  private router = inject(Router);

  ngOnInit() {
    this.isOwner = this.auth.hasRole('owner');
    this.loadGames();

    // Listen to changes from state service to keep in sync
    this.gameState.allGameRefresh$.subscribe(() => {
      this.loadGames();
    });

    this.searchSubject
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe((term: string) => {
        this.searchTerm = term;
        this.filterGames();
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy() {
    this.searchSubject.complete();
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadGames() {
    this.gameService.getAllGame().subscribe({
      next: (res) => {
        this.gamesList = res.detail || [];
        this.filterGames();
        this.cdr.detectChanges();
        console.log('Games loaded:', this.gamesList);
      },
      error: (err) => {
        console.error('Load games failed', err);
      },
    });
  }

  search(text: string) {
    this.searchSubject.next(text);
  }

  // ลอจิก filterGames ใช้ของเดิมได้เลย 100%
  filterGames(resetPage = true) {
    const searchTerm = this.searchTerm.trim().toLowerCase();

    if (!searchTerm) {
      this.filteredGames = [...this.gamesList];
    } else {
      this.filteredGames = this.gamesList.filter(
        (g) =>
          g.name.toLowerCase().includes(searchTerm) || g.game_id.toString().includes(searchTerm),
      );
    }

    if (resetPage) {
      this.currentPage = 0;
    }

    this.clampCurrentPage();
    this.updatePagedGames();
  }

  handlePageEvent(event: PageEvent) {
    this.currentPage = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedGames();

    //  1. สั่งให้ Angular อัปเดตข้อมูลในหน้าจอ (DOM) ให้เรียบร้อยก่อน
    this.cdr.detectChanges();

    //  2. ใช้ setTimeout ครอบ เพื่อรอให้เบราว์เซอร์ Render แถวใหม่เสร็จ แล้วค่อยสั่งเลื่อนขึ้นบนสุด
    setTimeout(() => {
      // ลองเลื่อนทั้งตัว Panel และเลื่อนแบบครอบคลุมเผื่อกรณี Layout อื่นด้วยครับ
      const element = document.querySelector('.main-content-panel');
      if (element) {
        element.scrollTo({ top: 0, behavior: 'smooth' });
      }

      // ตัวช่วยกันเหนียว: เลื่อนหน้าต่างหลักของเบราว์เซอร์ด้วย
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.documentElement.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50); // ดีเลย์ไว้ 50ms เพื่อความชัวร์ในการคำนวณความสูงใหม่ของบราวเซอร์
  }

  private updatePagedGames() {
    const startIndex = this.currentPage * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.pageGames = this.filteredGames.slice(startIndex, endIndex);
  }

  private clampCurrentPage() {
    const maxPage = Math.max(Math.ceil(this.filteredGames.length / this.pageSize) - 1, 0);
    this.currentPage = Math.min(this.currentPage, maxPage);
  }

  getMainImage(game: any): string {
    const mainImg = game.images?.find((img: any) => img.is_main === true);
    return mainImg ? mainImg.image : '';
  }

  isGameHidden(game: any): boolean {
    return game.is_hidden === true || game.is_hidden === 'True';
  }

  editStatus(event: Event, game: any) {
    event.stopPropagation(); // ป้องกันไม่ให้คลิกแล้วเด้งไปเปิด Media Dialog

    this.gameService.clearGameCache();

    // 1. อ่านสถานะปัจจุบัน: เช็คว่าซ่อนอยู่หรือไม่ (รองรับทั้ง Boolean true และ String 'True')
    const currentIsHidden = game.is_hidden === true || game.is_hidden === 'True';

    console.log('current ', currentIsHidden);

    // 2. กลับสถานะ: ถ้าซ่อนอยู่ให้เปลี่ยนเป็นแสดง, ถ้าแสดงอยู่ให้เปลี่ยนเป็นซ่อน
    const nextHiddenStatus = !currentIsHidden;

    console.log('next ', nextHiddenStatus);

    this.confirm
      .open({
        title: 'ต้องการจัดการสถานะของเกม?',
        message:
          currentIsHidden === false
            ? `คุณต้องการซ่อน "${game.name}" ใช่หรือไม่?`
            : `คุณต้องการยกเลิกการซ่อน "${game.name}" ใช่หรือไม่?`,
        confirmText: 'ยืนยัน',
        cancelText: 'ยกเลิก',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          // ส่ง statusString ที่เป็น "True" หรือ "False" ไปที่ Service
          this.gameService.gameHidden(game.game_id, nextHiddenStatus).subscribe({
            next: (res) => {
              if (res.status === 200) {
                Swal.fire({
                  title: 'สำเร็จ!',
                  text: 'ดำเนินการเสร็จสิ้น',
                  icon: 'success',
                  timer: 1500,
                  topLayer: true,
                  showConfirmButton: false,
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                });

                this.gameService.clearGameCache();
                this.loadGames(); // โหลดข้อมูลใหม่เพื่ออัปเดตสถานะล่าสุดบนหน้าจอ
              }
            },
            error: (err) => {
              console.error('API Error:', err);
              Swal.fire({
                title: 'ล้มเหลว',
                topLayer: true,
                text: err.error?.message || `เกิดข้อผิดพลาดจากระบบหลังบ้าน`,
                icon: 'error',
                scrollbarPadding: false,
                ...novaSwalDarkBase(),
                ...novaSwalConfirmAccent(),
              });
            },
          });
        }
      });
  }
  getCategoryString(game: any): string {
    const categories = game.catagories || game.categories || [];

    if (!Array.isArray(categories) || categories.length === 0) {
      return '-';
    }

    const categoryNames = categories
      .map((category: any) => {
        if (typeof category === 'string') {
          return category.trim();
        }

        return (
          category?.catagory_name ||
          category?.category_name ||
          category?.name ||
          category?.title ||
          ''
        ).trim();
      })
      .filter(Boolean);

    return categoryNames.length ? categoryNames.join(' / ') : '-';
  }

  openCreateDialog() {
    const dialogRef = this.dialog.open(CreateDialog, {
      width: 'min(92vw, 560px)',
      maxWidth: '92vw',
      panelClass: 'customupdate-container',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe(() => {
      this.gameService.clearGameCache();
      this.loadGames();
    });
  }

  openEditDialog(game: any) {
    this.gameState.updateGameDetail(game);
    const dialogRef = this.dialog.open(UpdateDialog, {
      width: 'min(92vw, 560px)',
      maxWidth: '92vw',
      panelClass: 'customupdate-container',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      autoFocus: false,
    });
    dialogRef.afterClosed().subscribe((updated) => {
      if (updated === true) {
        Swal.fire({
          title: 'สำเร็จ!',
          text: 'อัพเดตข้อมูลสำเร็จแล้ว',
          icon: 'success',
          timer: 1500,
          topLayer: true,
          showConfirmButton: false,
          scrollbarPadding: false,
          ...novaSwalDarkBase(),
        });
        this.gameService.clearGameCache();
        this.loadGames();
      }
    });
  }

  openMediaDialog(game: any) {
    const dialogRef = this.dialog.open(GameMedia, {
      width: 'min(95vw, 850px)',
      maxWidth: '95vw',
      panelClass: 'custom-media-dialog-container',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
      autoFocus: false,
      data: {
        id: game.game_id,
        isDialog: true,
      },
    });

    // รับค่า result ที่ส่งกลับมาตอนปิด Dialog
    dialogRef.afterClosed().subscribe((result) => {
      // ทำงานเมื่อ result มีค่าเป็น true (เกิดจากการกดยืนยันเท่านั้น)
      if (result) {
        this.gameService.clearGameCache();
        this.loadGames();
      }
    });
  }

  deleteGame(game: any) {
    this.confirm
      .open({
        title: 'ต้องการลบเกมข้อมูล?',
        message: `คุณต้องการลบเกม "${game.name}" ออกจากระบบใช่หรือไม่?`,

        confirmText: 'ลบเกม',
        cancelText: 'ยกเลิก',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.gameState.gameSelectedId([game.game_id]);
          this.gameService.deleteGames().subscribe({
            next: (res) => {
              if (res.status === 200) {
                Swal.fire({
                  title: 'สำเร็จ!',
                  text: 'ลบเกมสำเร็จแล้ว',
                  icon: 'success',
                  timer: 1500,
                  topLayer: true,
                  showConfirmButton: false,
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                });
                this.gameService.clearGameCache();
                this.loadGames();
              }
            },
            error: (err) => {
              console.error('Delete game failed', err);
              Swal.fire({
                title: 'ล้มเหลว',
                topLayer: true,
                text: err.error?.message || 'เกิดข้อผิดพลาดในการลบเกม',
                icon: 'error',
                scrollbarPadding: false,
                ...novaSwalDarkBase(),
                ...novaSwalConfirmAccent(),
              });
            },
          });
        }
      });
  }

  onImageClick(game: any) {
    const mainImg = game.images?.find((img: any) => img.is_main === true);

    this.confirm
      .openChoice({
        title: 'จัดการรูปภาพหลัก',
        message: `เกม "${game.name}"`,
        icon: 'info',
        confirmText: 'ภาพใหม่',
        denyText: 'ลบภาพ',
        showDenyButton: !!mainImg,
        cancelText: 'ยกเลิก',
      })
      .subscribe((result) => {
        if (result === 'confirm') {
          const fileInput = document.createElement('input');
          fileInput.type = 'file';
          fileInput.accept = 'image/*';
          fileInput.onchange = (event: any) => {
            const file = event.target.files[0];
            if (file) {
              this.uploadMainImage(game.game_id, file, mainImg?.image_id);
            }
          };
          fileInput.click();
        } else if (result === 'deny' && mainImg) {
          this.deleteMainImage(mainImg.image_id);
        }
      });
  }

  uploadMainImage(gameId: number, file: File, oldImageId?: number) {
    Swal.fire({
      title: 'กำลังอัปโหลด...',
      allowOutsideClick: false,
      scrollbarPadding: false,
      topLayer: true,
      ...novaSwalDarkBase(),
      didOpen: () => {
        Swal.showLoading();
      },
    });

    const proceedUpload = () => {
      this.gameState.gameIDS(gameId);
      this.gameState.gameIsmain(true);
      this.gameState.gamefill(file);

      this.gameService.imgUpdate().subscribe({
        next: (res) => {
          if (res.status === 200) {
            Swal.fire({
              title: 'สำเร็จ!',
              text: 'อัปโหลดภาพหลักสำเร็จแล้ว',
              icon: 'success',
              timer: 1500,
              topLayer: true,
              showConfirmButton: false,
              scrollbarPadding: false,
              ...novaSwalDarkBase(),
            });
            this.gameService.clearGameCache();
            this.loadGames();
          }
        },
        error: (err) => {
          console.error('Upload main image failed', err);
          Swal.fire({
            title: 'ล้มเหลว',
            topLayer: true,
            text: err.error?.message || 'เกิดข้อผิดพลาดในการอัปโหลด',
            icon: 'error',
            scrollbarPadding: false,
            ...novaSwalDarkBase(),
            ...novaSwalConfirmAccent(),
          });
        },
      });
    };

    if (oldImageId) {
      this.gameState.gameSelectedImg([oldImageId]);
      this.gameService.deleteImg().subscribe({
        next: () => {
          proceedUpload();
        },
        error: (err) => {
          console.warn('Delete old main image failed, trying upload anyway', err);
          proceedUpload();
        },
      });
    } else {
      proceedUpload();
    }
  }

  deleteMainImage(imageId: number) {
    this.confirm
      .open({
        title: 'ต้องการลบรูปภาพ?',
        message: 'คุณแน่ใจว่าต้องการลบรูปภาพหลักของเกมนี้ใช่หรือไม่?',
        variant: 'danger',
        confirmText: 'ลบรูปภาพ',
        cancelText: 'ยกเลิก',
      })
      .subscribe((confirmed) => {
        if (confirmed) {
          this.gameState.gameSelectedImg([imageId]);
          this.gameService.deleteImg().subscribe({
            next: (res) => {
              if (res.status === 200) {
                Swal.fire({
                  title: 'สำเร็จ!',
                  text: 'ลบรูปภาพหลักสำเร็จแล้ว',
                  icon: 'success',
                  topLayer: true,
                  timer: 1500,
                  showConfirmButton: false,
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                });
                this.gameService.clearGameCache();
                this.loadGames();
              }
            },
            error: (err) => {
              console.error('Delete image failed', err);
              Swal.fire({
                title: 'ล้มเหลว',
                text: err.error?.message || 'เกิดข้อผิดพลาดในการลบรูปภาพ',
                icon: 'error',
                topLayer: true,
                scrollbarPadding: false,
                ...novaSwalDarkBase(),
                ...novaSwalConfirmAccent(),
              });
            },
          });
        }
      });
  }
}
