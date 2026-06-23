import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamedetailAdmin } from './gamedetail-admin';

describe('GamedetailAdmin', () => {
  let component: GamedetailAdmin;
  let fixture: ComponentFixture<GamedetailAdmin>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamedetailAdmin],
    }).compileComponents();

    fixture = TestBed.createComponent(GamedetailAdmin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
