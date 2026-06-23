import {
  ChangeDetectorRef,
  Component,
  Inject,
  Input,
  OnChanges,
  OnInit,
  SimpleChange,
  SimpleChanges,
} from '@angular/core';
import { inject } from '@angular/core';
import { GameService } from '../../services/game.service';
import { GameStateService } from '../../services/game-state.service';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { NovaConfirmService } from '../../../../shared/confirm/nova-confirm.service';
import { AddImg } from '../add-img/add-img';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';
import { NgClass } from '@angular/common'; // 🚀 1. Import ตัวนี้เพิ่มเข้ามาครับ
import { StaticUrlPipe } from '../../../../shared/pipes/static-url-pipe';

@Component({
  selector: 'app-game-media',
  imports: [MatButtonModule, MatDialogModule, MatIconModule, StaticUrlPipe, NgClass],
  templateUrl: './game-media.html',
  styleUrl: './game-media.css',
})
export class GameMedia implements OnChanges, OnInit {
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);
  private confirm = inject(NovaConfirmService);

  @Input() game_id: number = 0;
  public data = inject(MAT_DIALOG_DATA, { optional: true });

  isDialog: boolean = false;
  gameVideo: any = [];
  gameImage: any = [];
  gameDetail: any = [];
  ownedGame: number[] = [];
  videoUrl: string[] = [];
  gameImageMain: string = '';
  selectedImg: number[] = [];
  isDelete: boolean = false;
  newImageFiles: File[] = [];

  scrollLeft(element: HTMLElement) {
    element.scrollBy({ left: -200, behavior: 'smooth' });
  }

  // สั่งเลื่อนไปทางขวา 300px
  scrollRight(element: HTMLElement) {
    element.scrollBy({ left: 200, behavior: 'smooth' });
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['game_id'] && changes['game_id'].currentValue) {
      console.log('ได้รับ ID จากหน้า Detail แล้ว เตรียมโหลดข้อมูลของ ID:', this.game_id);
      this.loadMedia(this.game_id);
    }
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  ngOnInit(): void {
    if (this.data && this.data.isDialog) {
      this.game_id = this.data.id;
      this.isDialog = true;
      this.loadMedia(this.game_id);
    }
    this.gameState.refresh$.subscribe(() => {
      if (this.game_id) {
        this.loadMedia(this.game_id);
      }
    });
  }

  loadMedia(id: number) {
    this.gameImage = [];
    this.gameImageMain = '';
    this.gameVideo = [];
    this.gameService.getAllGame().subscribe({
      next: (game_res) => {
        const game_all = game_res.detail;
        this.gameDetail = game_all.find((item: any) => item.game_id === id);

        if (!this.gameDetail) {
          console.warn('not found game', id);
          return;
        }
        //console.log(this.gameDetail);

        const imgObj = this.gameDetail.images;
        console.log('ควรเป็น อาเรย์', imgObj);

        imgObj.forEach((img: any) => {
          if (
            (img.image.toLowerCase().endsWith('.jpg') ||
              img.image.toLowerCase().endsWith('.png') ||
              img.image.toLowerCase().endsWith('.jpeg')) &&
            img.is_main == false
          ) {
            // console.log('ภาพที่กรอง', img.image);

            this.gameImage.push(img);
          }
          if (img.image.toLowerCase().endsWith('.mp4')) {
            this.gameVideo.push(img);
            console.log('วิดีโอ ', this.gameVideo);
          }
          if (img.is_main === true) {
            const maiImage = imgObj.findLast((item: any) => item.is_main === true);
            this.gameImageMain = maiImage.image;
            // this.gameImageMain = img.image;
            console.log('image-main ', this.gameImageMain);
          }
        });
        console.log('ภาพในการloop img เท่านั้น ', this.gameImage);
        // console.log('วิดีโอ ', this.gameVideo);

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('error = ', err);
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

    // คุณสามารถนำ this.gameId ไปยิง API ต่อในนี้ได้เลย
  }

  imgDelete() {
    if (this.isDelete === false) {
      Swal.fire({
        title: 'Delete',
        text: 'Selecte Image to Delete',
        reverseButtons: true,
        ...novaSwalConfirmPrimary(),
        topLayer: true,
        scrollbarPadding: false,
        ...novaSwalDarkBase(),
      });
      this.isDelete = !this.isDelete;
      this.selectedImg = [];
    } else {
      Swal.fire({
        title: 'Delete',
        text: 'Delete Was Cancel',
        reverseButtons: true,
        ...novaSwalConfirmPrimary(),
        topLayer: true,
        scrollbarPadding: false,
        ...novaSwalDarkBase(),
      });
      this.isDelete = !this.isDelete;
      this.selectedImg = [];
    }
  }

  toggleImg(imgId: number) {
    if (this.isDelete === false) {
      return;
    }

    const index = this.selectedImg.indexOf(imgId);
    if (index === -1) {
      this.selectedImg.push(imgId);
    } else {
      this.selectedImg.splice(index, 1);
    }

    console.log(' ภาพ ปัจจุบัน ', this.selectedImg);
    this.gameState.gameSelectedImg(this.selectedImg);
  }

  isSelected(img_id: number): boolean {
    return this.selectedImg.includes(img_id);
  }

  dialogDel() {
    this.confirm
      .open({
        title: 'Delete Image',
        message: 'คุณต้องการลบภาพใช่หรือไม่',
        confirmText: 'ลบ',
        cancelText: 'ยกเลิก',
      })
      .subscribe((status) => {
        if (status) {
          console.log('post API');

          this.gameService.deleteImg().subscribe({
            next: (res) => {
              console.log('delete already ', res);
              this.isDelete = !this.isDelete;
              this.gameService.clearGameCache();
              this.gameState.triggerRefresh();
              this.cdr.detectChanges();
              if (res.status === 200) {
                Swal.fire({
                  title: 'Successfully ',
                  text: 'Image was delete',
                  topLayer: true,
                  showConfirmButton: false,
                  icon: 'success',
                  ...novaSwalConfirmPrimary(),
                  scrollbarPadding: false,
                  ...novaSwalDarkBase(),
                });
              }
            },
            error: (err) => {
              console.log('deleate err = ', err);
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

  formDialog() {
    const form = this.dialog.open(AddImg, {
      data: {
        id: this.game_id,
      },
      width: 'min(92vw, 460px)',
      maxWidth: '92vw',
      panelClass: 'customupdate-container',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
    });
  }
}
