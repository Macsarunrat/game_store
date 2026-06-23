import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatError, MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, FormsModule, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { GameService } from '../../services/game.service';
import { GameStateService } from '../../services/game-state.service';
import { inject } from '@angular/core';
import { OnInit } from '@angular/core';
import { combineLatest, forkJoin, map } from 'rxjs';
import { ChangeDetectorRef } from '@angular/core';
import { NovaConfirmService } from '../../../../shared/confirm/nova-confirm.service';
import { MAT_ERROR } from '@angular/material/form-field';
import { ToastrService } from 'ngx-toastr';
import { MatDialogRef } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';

@Component({
  selector: 'app-update-dialog',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    MatError,
  ],
  templateUrl: './update-dialog.html',
  styleUrl: './update-dialog.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateDialog implements OnInit {
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private dialogref = inject(MatDialogRef<UpdateDialog>);
  private confirm = inject(NovaConfirmService);
  allcate: any[] = [];
  gameDetail: any[] = [];
  gameCategory = new FormControl<string[]>([], { nonNullable: true });
  currentgameName: any = new FormControl('');
  currentgamePrice = new FormControl<number | null>(null, Validators.pattern('^[0-9]+$'));
  currentgameDescription: any = new FormControl('');
  categoryList: string[] = [];
  realgame: any = [];

  ngOnInit(): void {
    this.gameService.getAllCategories().subscribe({
      next: (cate) => {
        this.allcate = cate.detail;
        console.log('cate All detail ', this.allcate);
        this.categoryList = this.allcate.map((g) => g.catagory_name);
        this.cdr.detectChanges();
      },
    });

    this.gameState.currentGameDetail$.subscribe({
      next: (detail) => {
        this.gameDetail = detail;
        console.log('detail game = ', this.gameDetail);
      },
      error: (err) => {
        console.error('error from detail ', err);
      },
    });

    this.gameState.currentGameDetail$.pipe(map((item: any) => item.catagories)).subscribe({
      next: (item) => {
        console.log('detail cate  =', item);
        const categoryNames = Array.isArray(item)
          ? item
              .map((category: any) => {
                if (typeof category === 'string') {
                  return category;
                }

                return category?.catagory_name || category?.category_name || category?.name || '';
              })
              .filter(Boolean)
          : [];

        this.gameCategory.patchValue(categoryNames);

        this.cdr.detectChanges();
      },

      error: (err) => {
        console.error('error detail = ', err);
      },
    });
  }

  openConfirm() {
    this.confirm
      .open({
        title: 'ยืนยันการเปลี่ยนแปลงข้อมูล',
        icon: 'question',
        confirmText: 'บันทึก',
        cancelText: 'ยกเลิก',
      })
      .subscribe((result) => {
        if (result) {
          console.log('ยิง api');
          this.gameService.clearGameCache();

          (this.updateName(), this.updatePrice(), this.updateDescription());
          this.gameState.gameCateId(this.getCategoryId());
          this.gameService.postUpdateGameData().subscribe({
            next: (resp) => {
              console.log('after api ', resp);
              this.dialogref.close(true);
              if (resp.status === 200) {
                this.cdr.detectChanges();
                this.gameService.clearGameCache();
                this.gameState.triggerAllGameRefresh();
              }
            },
            error: (err) => {
              console.error('after api erro ', err);
              Swal.fire({
                icon: 'error',
                title: 'Failed',
                timer: 2000,
                topLayer: true,
                showConfirmButton: false,
                text: err.error.message || 'Something went wrong',
                ...novaSwalDarkBase(),
                ...novaSwalConfirmPrimary(),
                scrollbarPadding: false,
              });
            },
          });

          //ดูค้า id เกมปัจจุบันบน selection
          //forkJoin

          combineLatest([
            this.gameState.postUpdateGameName$,
            this.gameState.postUpdateDescription$,
            this.gameState.postUpdateGamePrice$,
            this.gameState.postUpdateGameCategory$,
          ]).subscribe(([name, description, price, category]) => {
            console.log('name ', name);
            console.log('des', description);
            console.log('price', price);
            console.log(category);
          });
        } else console.log('cancel');
      });
  }

  getCategoryId(): number[] {
    const selectName = this.gameCategory.value;
    if (!selectName || !this.allcate) {
      return [];
    }
    const selectId = this.allcate
      .filter((cate: any) => selectName.includes(cate.catagory_name))
      .map((cate: any) => cate.catagory_id);
    return selectId;
  }

  updateName() {
    const name = this.currentgameName.value;
    // console.log('name = ', name);

    this.gameState.gameName(!name ? null : name);
  }

  updatePrice() {
    const price = this.currentgamePrice.value;

    // console.log('price ', price);
    this.gameState.gamePrice(!price ? null : price);
  }

  updateDescription() {
    const descrip = this.currentgameDescription.value;

    this.gameState.gameDescrription(!descrip ? null : descrip);
    // console.log('desasd = ', descrip);
  }
}
