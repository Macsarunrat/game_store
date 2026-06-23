import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Successdialog } from './successdialog';

describe('Successdialog', () => {
  let component: Successdialog;
  let fixture: ComponentFixture<Successdialog>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Successdialog],
    }).compileComponents();

    fixture = TestBed.createComponent(Successdialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
