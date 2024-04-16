import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SAPIModule } from 'src/atlasComponents/sapi';

import { EntryComponent } from './entry.component';
import { provideMockStore } from '@ngrx/store/testing';
import { FeatureModule } from '../module';
import { FEATURE_CONCEPT_TOKEN, TPRB } from '../util';

describe('EntryComponent', () => {
  let component: EntryComponent;
  let fixture: ComponentFixture<EntryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        SAPIModule,
        FeatureModule,
      ],
      declarations: [  ],
      providers: [
        provideMockStore(),
        {
          provide: FEATURE_CONCEPT_TOKEN,
          useValue: {
            register(id: string, tprb: TPRB){}
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EntryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
