import { SingleDatasetView } from './detailedView/singleDataset.component'
import { TestBed, async } from '@angular/core/testing';
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module';
import { DatabrowserModule } from '../databrowser.module';
import { ComponentsModule } from 'src/components/components.module';
import { DatabrowserService, KgSingleDatasetService } from './singleDataset.base';
import { provideMockStore } from '@ngrx/store/testing';
import { defaultRootState } from 'src/services/stateStore.service';
import { HttpClientModule } from '@angular/common/http';

describe('singleDataset.base.ts', () => {

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule,
        DatabrowserModule,
        ComponentsModule,
        HttpClientModule
      ],
      providers: [
        DatabrowserService,
        KgSingleDatasetService,
        provideMockStore({
          initialState: defaultRootState
        })
      ]
    }).compileComponents()
  }))
  describe('SingleDatasetBase', () => {
    it('on init, component is truthy', () => {
      
      const fixture = TestBed.createComponent(SingleDatasetView)
      const app = fixture.debugElement.componentInstance;
    
      expect(app).toBeTruthy();
    })
  })
})
