import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BioMetricsComponent } from './bio-metrics.component';

describe('BioMetricsComponent', () => {
  let component: BioMetricsComponent;
  let fixture: ComponentFixture<BioMetricsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ BioMetricsComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BioMetricsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
