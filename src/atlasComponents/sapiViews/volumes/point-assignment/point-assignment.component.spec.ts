import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointAssignmentComponent } from './point-assignment.component';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { EMPTY } from 'rxjs';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';
import { provideMockStore } from '@ngrx/store/testing';
import { AngularMaterialModule } from 'src/sharedModules';

describe('PointAssignmentComponent', () => {
  let component: PointAssignmentComponent;
  let fixture: ComponentFixture<PointAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ PointAssignmentComponent ],
      imports: [ AngularMaterialModule, NoopAnimationsModule ],
      providers: [
        provideMockStore(),
        {
          provide: SAPI,
          useValue: {
            v3Get: () => EMPTY
          }
        }
      ]
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
