import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ChangePerspectiveOrientationComponent } from './changePerspectiveOrientation.component';

describe('ChangePerspectiveOrientationComponent', () => {
  let component: ChangePerspectiveOrientationComponent;
  let fixture: ComponentFixture<ChangePerspectiveOrientationComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ChangePerspectiveOrientationComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ChangePerspectiveOrientationComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
