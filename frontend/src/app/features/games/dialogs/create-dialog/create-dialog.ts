import { Component, inject, ChangeDetectorRef, OnInit } from '@angular/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { FormControl, ReactiveFormsModule, RequiredValidator, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { GameService } from '../../services/game.service';
import { GameStateService } from '../../services/game-state.service';
import { MatDialog } from '@angular/material/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { combineLatest, map } from 'rxjs';
import { MatError } from '@angular/material/input';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';

@Component({
  selector: 'app-create-dialog',
  imports: [
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatError,
  ],
  templateUrl: './create-dialog.html',
  styleUrl: './create-dialog.css',
})
export class CreateDialog implements OnInit {
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);
  private dialog = inject(MatDialog);
  private overlay = inject(Overlay);

  allcate: any[] = [];
  gameDetail: any[] = [];
  currentgameName = new FormControl('', [Validators.required]);
  currentgamePrice = new FormControl<number | null>(null, [
    Validators.pattern('^[0-9]+$'),
    Validators.required,
    Validators.min(0),
  ]);
  currentgameDescription: any = new FormControl('', [Validators.required]);
  categoryList: any[] = [];
  gameCategory = new FormControl<string[]>([], {
    nonNullable: true,
    validators: [Validators.required],
  });
  realgame: any = [];
  currentCateId: number[] = [];

  ngOnInit() {
    this.gameService
      .getAllCategories()
      .pipe(map((r) => r.detail))
      .subscribe({
        next: (res) => {
          console.log('category = ', res);

          res.forEach((g: any) => {
            this.categoryList.push(g);
            console.log('saa', this.categoryList);
          });
        },

        error: (err) => {
          console.log('error = ', err);
        },
      });
    this.gameCategory.valueChanges.subscribe((selected) => {
      console.log(selected);

      const selectCate = this.categoryList.filter((c: any) => selected.includes(c.catagory_name));
      const id = selectCate.map((r: any) => r.catagory_id);
      this.currentCateId = id;
      console.log(id);
    });
  }

  updateName() {
    const name = this.currentgameName.value;
    console.log('name = ', name);
  }

  updatePrice() {
    const price = this.currentgamePrice.value;

    console.log('price ', price);
    this.gameState.gamePrice(!price ? null : price);
  }

  updateDescription() {
    const descrip = this.currentgameDescription.value;

    this.gameState.gameDescrription(!descrip ? null : descrip);
    console.log('desasd = ', descrip);
  }

  createGame() {
    console.log('name =', this.currentgameName.value);
    console.log('price =', this.currentgamePrice.value);
    console.log('descrip = ', this.currentgameDescription.value);
    console.log('cate = ', this.currentCateId);
    this.gameState.gameName(String(this.currentgameName.value));
    this.gameState.gamePrice(Number(this.currentgamePrice.value));
    this.gameState.gameDescrription(String(this.currentgameDescription.value));
    this.gameState.gameSelectedId(this.currentCateId);

    this.gameService.postCreateGame().subscribe({
      next: (res) => {
        console.log('gamePost = ', res);
        console.log('status', res.status);
        if (res.status === 200) {
          Swal.fire({
            icon: 'success',
            title: 'Successfully',
            text: 'Game was added',
            timer: 2000,
            showConfirmButton: false,
            topLayer: true,
            ...novaSwalDarkBase(),
            ...novaSwalConfirmPrimary(),
            scrollbarPadding: false,
          });
          this.currentgameName.reset();
          this.currentgamePrice.reset();
          this.currentgameDescription.reset();
          this.gameCategory.reset([]);
          this.cdr.detectChanges();

          setTimeout(() => {
            this.gameService.clearGameCache();
            this.gameState.triggerAllGameRefresh();
          }, 1000);
        }
      },
      error: (err) => {
        console.log('gamePost = ', err);
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
  }
}
