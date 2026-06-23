import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ScoreChart } from './score-chart';

describe('ScoreChart', () => {
  let component: ScoreChart;
  let fixture: ComponentFixture<ScoreChart>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ScoreChart],
    }).compileComponents();

    fixture = TestBed.createComponent(ScoreChart);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
