import { Component, inject, OnInit, Inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { GameService } from '../services/game.service';
import { GameStateService } from '../services/game-state.service';
import { Navbar } from '../../../layout/navbar/navbar';
import { MatCardModule } from '@angular/material/card';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { UpdateDialog } from '../dialogs/update-dialog/update-dialog';
import { BehaviorSubject, switchMap } from 'rxjs';
import { GameMedia } from '../media/game-media/game-media';
import { CommonModule } from '@angular/common';
import { StaticUrlPipe } from '../../../shared/pipes/static-url-pipe';

@Component({
  selector: 'app-gamedetail-admin',
  imports: [
    MatCardModule,
    MatDialogModule,
    MatButtonModule,
    GameMedia,
    CommonModule,
    StaticUrlPipe,
  ],
  templateUrl: './gamedetail-admin.html',
  styleUrl: './gamedetail-admin.css',
})
export class GamedetailAdmin implements OnInit {
  refreshTrigger$ = new BehaviorSubject<boolean>(true);
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private overlay = inject(Overlay);

  game_id: number = 0;
  gameDetail: any = [];
  gameVideo: any = [];
  gameImage: any = [];
  videoUrl: string[] = [];
  gameImageMain: string = '';
  ownedGame: number[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialog,
  ) {
    this.game_id = data.id;
  }

  ngOnInit() {
    this.gameState.refresh$.subscribe(() => {
      console.log('Game detail ทราบ');
      this.refreshTrigger$.next(true);
    });
    this.gameState.gamePurchased$.subscribe((id) => {
      this.ownedGame = id;
      // console.log('เกมที่ได้มา ', this.ownedGame);
    });
    console.log('ID ที่ได้รับใน Popup คือ:', this.game_id);
    this.refreshTrigger$.pipe(switchMap(() => this.gameService.getAllGame())).subscribe({
      next: (game_res) => {
        const game_all = game_res.detail;
        this.gameDetail = game_all.find((item: any) => item.game_id === this.game_id);
        console.log(this.gameDetail);

        const gameImg = this.gameDetail.images;
        gameImg.forEach((g: any) => {
          if (g.is_main === true) {
            const imgMain = g.image;

            this.gameImageMain = imgMain;
            console.log('dasa ', this.gameImageMain);
          }
        });

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('error = ', err);
      },
    });

    // คุณสามารถนำ this.gameId ไปยิง API ต่อในนี้ได้เลย
  }

  updateForm() {
    this.gameState.updateGameDetail(this.gameDetail);
    console.log('can Click');
    const update = this.dialog.open(UpdateDialog, {
      width: '100%',
      maxWidth: '30vw',
      minHeight: '65vh',
      panelClass: 'customupdate-container',
      scrollStrategy: this.overlay.scrollStrategies.noop(),
    });
    update.afterClosed().subscribe((is_update) => {
      console.log('update = ', is_update);
      if (is_update === true) {
        this.refreshTrigger$.next(true);
      }
    });
  }
}
