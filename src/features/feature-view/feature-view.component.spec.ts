import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EMPTY } from 'rxjs';
import { SAPI } from 'src/atlasComponents/sapi';
import { DARKTHEME } from 'src/util/injectionTokens';

import { FeatureViewComponent } from './feature-view.component';
import { provideMockStore } from '@ngrx/store/testing';
import { AngularMaterialModule } from 'src/sharedModules';
import { FEATURE_CONCEPT_TOKEN } from '../util';

describe('FeatureViewComponent', () => {
  let component: FeatureViewComponent;
  let fixture: ComponentFixture<FeatureViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        CommonModule,
        AngularMaterialModule,
      ],
      declarations: [ FeatureViewComponent ],
      providers: [
        provideMockStore(),
        {
          provide: DARKTHEME,
          useValue: EMPTY
        },
        {
          provide: SAPI,
          useValue: {
            getFeaturePlot(...args) {
              return EMPTY
            },
            getV3FeaturewDetailWithId(...args) {
              return EMPTY
            },
            sapiEndpoint$: EMPTY
          }
        },
        {
          provide: FEATURE_CONCEPT_TOKEN,
          useValue: {
            concept$: EMPTY
          }
        }
      ]
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
