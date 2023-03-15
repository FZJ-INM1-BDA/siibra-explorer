import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { SAPIModule } from 'src/atlasComponents/sapi';
import { DARKTHEME } from 'src/util/injectionTokens';

import { FeatureViewComponent } from './feature-view.component';

describe('FeatureViewComponent', () => {
  let component: FeatureViewComponent;
  let fixture: ComponentFixture<FeatureViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SAPIModule,
        CommonModule,
      ],
      declarations: [ FeatureViewComponent ],
      providers: [{
        provide: DARKTHEME,
        useValue: EMPTY
      }]
    })
    .compileComponents();

    fixture = TestBed.createComponent(FeatureViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
