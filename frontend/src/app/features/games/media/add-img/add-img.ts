import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { GameService } from '../../services/game.service';
import { GameStateService } from '../../services/game-state.service';
import Swal from 'sweetalert2';
import { novaSwalConfirmPrimary, novaSwalDarkBase } from '@theme/swal-theme';

@Component({
  selector: 'app-add-img',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
  ],
  templateUrl: './add-img.html',
  styleUrl: './add-img.css',
})
export class AddImg {
  choice = new FormControl<boolean>(false);
  choiceList: boolean[] = [true, false];
  newImageFiles: File[] = [];
  nameImg: string = '';
  gameid: number = 0;
  previewImages: { file: File; url: string }[] = [];

  readonly data = inject(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<AddImg>);
  private gameService = inject(GameService);
  private gameState = inject(GameStateService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.gameid = this.data.id;
    console.log('data game = ', this.gameid);
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;

    if (input.files && input.files.length > 0) {
      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        //  หัวใจสำคัญ: สร้าง URL ชั่วคราวสำหรับพรีวิวภาพ
        const imageUrl = URL.createObjectURL(file);

        // เก็บทั้งไฟล์ (ไว้ส่ง API) และ URL (ไว้โชว์ใน HTML)
        this.previewImages.push({
          file: file,
          url: imageUrl,
        });
      }

      this.previewImages.forEach((g) => {
        console.log('asdas = ', g.file.name);
        this.nameImg = g.file.name;
      });
      console.log('ไฟล์ที่เลือกทั้งหมด:', this.previewImages);

      const lastSelectedFile = this.previewImages[0].file;
      this.gameState.gamefill(lastSelectedFile);
      console.log('lsss ', lastSelectedFile);

      console.log('choice ', this.choice.value);
      const isMain: boolean = Boolean(this.choice.value);
      this.gameState.gameIsmain(isMain);

      console.log('asdas = ', this.gameid);
      this.gameState.gameIDS(this.gameid);

      input.value = ''; // ล้างค่าเพื่อให้เลือกไฟล์เดิมซ้ำได้
    }
  }

  removePreview(index: number) {
    // ดึง URL ออกมาเพื่อคืนหน่วยความจำให้เบราว์เซอร์ (Memory Management)
    URL.revokeObjectURL(this.previewImages[index].url);

    // ลบออกจาก Array
    this.previewImages.splice(index, 1);
  }

  ngAfterContentChecked() {
    this.cdr.detectChanges();
  }

  UpdateImg() {
    this.gameService.imgUpdate().subscribe({
      next: (res) => {
        console.log('update img = ', res);
        console.log('status ', res.status);
        if (res.status === 200) {
          this.previewImages = [];

          Swal.fire({
            text: 'Image was added',
            title: 'Successfully',
            icon: 'success',
            showConfirmButton: false,
            topLayer: true,
            ...novaSwalConfirmPrimary(),
            timer: 2000,
            scrollbarPadding: false,
            ...novaSwalDarkBase(),
          });
          this.cdr.detectChanges();
          this.gameService.clearGameCache();
          this.gameState.triggerAllGameRefresh();
          this.gameState.triggerRefresh();
        }
      },
      error: (err) => {
        console.log('error ', err);
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
}
