import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PassKeyComponent } from './pass-key.component';

describe('PassKeyComponent', () => {
  let component: PassKeyComponent;
  let fixture: ComponentFixture<PassKeyComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PassKeyComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PassKeyComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
