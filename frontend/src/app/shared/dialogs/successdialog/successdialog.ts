import { Component, Inject } from '@angular/core';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MAT_DIALOG_DATA } from '@angular/material/dialog';

@Component({
  selector: 'app-successdialog',
  imports: [MatDialogModule],
  templateUrl: './successdialog.html',
  styleUrl: './successdialog.css',
})
export class Successdialog {
  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialog: MatDialogRef<Successdialog>,
  ) {}

  onOpen() {
    this.dialog.close(true);
  }

  onClose() {
    this.dialog.close(false);
  }
}
