import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointAssignmentComponent } from './point-assignment.component';

describe('PointAssignmentComponent', () => {
  let component: PointAssignmentComponent;
  let fixture: ComponentFixture<PointAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PointAssignmentComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
