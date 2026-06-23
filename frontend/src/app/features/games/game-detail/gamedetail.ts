import { Component, inject, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../services/game.service';
import { GameStateService } from '../services/game-state.service';
import { Navbar } from '../../../layout/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import Swal from 'sweetalert2';
import { NovaConfirmService } from '../../../shared/confirm/nova-confirm.service';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';
import { CommonModule } from '@angular/common';
import { StaticUrlPipe } from '../../../shared/pipes/static-url-pipe';
import { STATIC_URL } from '../../../core/constants/app-constants';

@Component({
  selector: 'app-gamedetail',
  imports: [MatCardModule, MatDialogModule, MatButtonModule, CommonModule, StaticUrlPipe],
  templateUrl: './gamedetail.html',
  styleUrl: './gamedetail.css',
})
export class Gamedetail implements OnInit {
  private route = inject(ActivatedRoute);
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private confirm = inject(NovaConfirmService);

  game_id: number = 0;
  gameDetail: any = [];
  gameVideo: any = [];
  gameImage: any = [];
  videoUrl: string[] = [];
  gameImageMain: string = '';
  ownedGame: number[] = [];
  isgameBuy: boolean = false;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {
    this.game_id = data.id;
  }

  scrollLeft(element: HTMLElement) {
    element.scrollBy({ left: -300, behavior: 'smooth' });
  }

  // สั่งเลื่อนไปทางขวา 300px
  scrollRight(element: HTMLElement) {
    element.scrollBy({ left: 300, behavior: 'smooth' });
  }

  ngOnInit() {
    this.gameState.gamePurchased$.subscribe((id) => {
      this.ownedGame = id;
      // console.log('เกมที่ได้มา ', this.ownedGame);
    });
    console.log('ID ที่ได้รับใน Popup คือ:', this.game_id);
    this.gameService.getAllGame().subscribe({
      next: (game_res) => {
        const game_all = game_res.detail;
        this.gameDetail = game_all.find((item: any) => item.game_id === this.game_id);
        console.log(this.gameDetail);

        const imgObj = this.gameDetail.images;
        console.log('ควรเป็น อาเรย์', imgObj);

        imgObj.forEach((img: any) => {
          if (
            (img.image.toLowerCase().endsWith('.jpg') ||
              img.image.toLowerCase().endsWith('.png')) &&
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
      },
    });

    // คุณสามารถนำ this.gameId ไปยิง API ต่อในนี้ได้เลย
  }

  buyGame() {
    console.log('ปุ่มกดบายได้แล้ว');
    console.log(this.game_id);
    this.confirm
      .open({
        title: 'Buy Game',
        message: 'คุณต้องการซื้อเกมนี้ใช่หรือไม่',
        icon: 'question',
        confirmText: 'ซื้อ',
        cancelText: 'ยกเลิก',
      })
      .subscribe((res) => {
        if (res) {
          this.gameState.gameSelected(this.game_id);
          this.gameService.buyGameNow();
          this.isgameBuy = !this.isgameBuy;
          this.cdr.detectChanges();
          Swal.fire({
            title: 'Buy Successfully',
            text: 'ดำเนินการเสร็จสิ้น รอการยืนยันจากระบบ',
            showConfirmButton: false,
            timer: 3000,
            topLayer: true,
            icon: 'success',
            ...novaSwalConfirmPrimary(),
            scrollbarPadding: false,
            ...novaSwalDarkBase(),
          });

          this.gameService.clearGameCache();
          this.gameState.triggerAllGameRefresh();

          //this.dialog.closeAll();
        }
        this.gameService.gameStripe$.subscribe({
          next: (res: any) => {
            console.log('link = ', res);
            window.location.href = res;
          },
          error: (err) => {
            console.error('link failed = ', err);
          },
        });
      });
  }

  isGameOwned(game_id: any): boolean {
    // console.log('game = ', game_id);
    // console.log('asdsa = ', this.ownedGame);

    const Is_buy = this.ownedGame.some((g: any) => g.game_id === game_id);
    //console.log('a da = ', dd);

    return Is_buy;
  }
}
