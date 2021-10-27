import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChangePerspectiveOrientationComponent } from './changePerspectiveOrientation.component';
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { AngularMaterialModule } from 'src/sharedModules';
import { CommonModule } from '@angular/common';

describe('ChangePerspectiveOrientationComponent', () => {
  let component: ChangePerspectiveOrientationComponent;
  let fixture: ComponentFixture<ChangePerspectiveOrientationComponent>;
  let mockStore: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule,
        CommonModule
      ],
      declarations: [ ChangePerspectiveOrientationComponent ],
      providers: [provideMockStore()],

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
