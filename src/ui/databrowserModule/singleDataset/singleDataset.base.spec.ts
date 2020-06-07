import { SingleDatasetView } from './detailedView/singleDataset.component'
import { TestBed, async } from '@angular/core/testing';
import { AngularMaterialModule } from 'src/ui/sharedModules/angularMaterial.module';
import { ComponentsModule } from 'src/components/components.module';
import { DatabrowserService, KgSingleDatasetService } from './singleDataset.base';
import { HttpClientModule } from '@angular/common/http';
import { hot } from 'jasmine-marbles';

// TODO complete unit tests after refactor

// describe('singleDataset.base.ts', () => {

//   beforeEach(async(() => {

//     const mockDbService = {
//       favedDataentries$: hot(''),
//       saveToFav: jasmine.createSpy('saveToFav'),
//       removeFromFav: jasmine.createSpy('removeFromFav')
//     }

//     const returnValue = 'returnValue'

//     const mockSingleDsService = {
//       getInfoFromKg: jasmine.createSpy('getInfoFromKg').and.returnValue(Promise.resolve()),
//       getDownloadZipFromKgHref: jasmine.createSpy('getDownloadZipFromKgHref').and.returnValue(returnValue),
//       showPreviewList: jasmine.createSpy('showPreviewList')
//     }

//     TestBed.configureTestingModule({
//       imports: [
//         AngularMaterialModule,
//         ComponentsModule,
//         HttpClientModule
//       ],
//       declarations: [
//         SingleDatasetView
//       ],
//       providers: [
//         {
//           provide: DatabrowserService,
//           useValue: mockDbService
//         },
//         {
//           provide: KgSingleDatasetService,
//           useValue: mockSingleDsService
//         },
//       ]
//     }).compileComponents()
//   }))
//   describe('SingleDatasetBase', () => {
//     it('on init, component is truthy', () => {
      
//       const fixture = TestBed.createComponent(SingleDatasetView)
//       const app = fixture.debugElement.componentInstance;
    
//       expect(app).toBeTruthy();
//     })
//   })
// })
