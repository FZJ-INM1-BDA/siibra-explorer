import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SnapPerspectiveOrientationCmp } from './snapPerspectiveOrientation.component';
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { AngularMaterialModule } from 'src/sharedModules';
import { CommonModule } from '@angular/common';

describe('SnapPerspectiveOrientationCmp', () => {
  let component: SnapPerspectiveOrientationCmp;
  let fixture: ComponentFixture<SnapPerspectiveOrientationCmp>;
  let mockStore: MockStore;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule,
        CommonModule
      ],
      declarations: [ SnapPerspectiveOrientationCmp ],
      providers: [provideMockStore()],

    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(SnapPerspectiveOrientationCmp);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
