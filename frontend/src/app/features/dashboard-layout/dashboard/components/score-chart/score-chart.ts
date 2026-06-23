import { Component, inject, Input, input, model } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-score-chart',
  imports: [MatIconModule],
  templateUrl: './score-chart.html',
  styleUrl: './score-chart.css',
})
export class ScoreChart {
  @Input() icon!: string;
  @Input() label!: string;
  @Input() value!: string | number;
}
