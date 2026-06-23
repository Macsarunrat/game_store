import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GameMedia } from './game-media';

describe('GameMedia', () => {
  let component: GameMedia;
  let fixture: ComponentFixture<GameMedia>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GameMedia],
    }).compileComponents();

    fixture = TestBed.createComponent(GameMedia);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
