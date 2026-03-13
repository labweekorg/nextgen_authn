import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ComcastSignComponent } from './comcast-sign.component';

describe('ComcastSignComponent', () => {
  let component: ComcastSignComponent;
  let fixture: ComponentFixture<ComcastSignComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComcastSignComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ComcastSignComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
