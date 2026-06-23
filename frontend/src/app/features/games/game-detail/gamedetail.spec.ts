import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gamedetail } from './gamedetail';

describe('Gamedetail', () => {
  let component: Gamedetail;
  let fixture: ComponentFixture<Gamedetail>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gamedetail],
    }).compileComponents();

    fixture = TestBed.createComponent(Gamedetail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
