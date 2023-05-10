import { CommonModule } from '@angular/common';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SAPIModule } from 'src/atlasComponents/sapi';

import { EntryComponent } from './entry.component';
import { provideMockStore } from '@ngrx/store/testing';
import { FeatureModule } from '../module';

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
        provideMockStore()
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
