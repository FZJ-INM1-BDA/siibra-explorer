import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpotlightBackdropComponent } from './spotlight-backdrop.component';

describe('SpotlightBackdropComponent', () => {
  let component: SpotlightBackdropComponent;
  let fixture: ComponentFixture<SpotlightBackdropComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpotlightBackdropComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpotlightBackdropComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
