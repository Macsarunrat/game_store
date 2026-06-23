import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddImg } from './add-img';

describe('AddImg', () => {
  let component: AddImg;
  let fixture: ComponentFixture<AddImg>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddImg],
    }).compileComponents();

    fixture = TestBed.createComponent(AddImg);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
