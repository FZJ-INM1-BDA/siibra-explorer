import { async, TestBed } from '@angular/core/testing'
import { AngularMaterialModule } from '../../ui/sharedModules/angularMaterial.module'
import { SearchSideNav } from './searchSideNav.component'
import { provideMockStore } from '@ngrx/store/testing'
import { COLIN, JUBRAIN_COLIN_CH123_LEFT, JUBRAIN_COLIN_CH123_RIGHT, JUBRAIN_COLIN, HttpMockRequestInterceptor } from 'spec/util'
import { HTTP_INTERCEPTORS } from '@angular/common/http'
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { UtilModule } from 'src/util'
import { TemplateParcellationHasMoreInfo } from 'src/util/pipes/templateParcellationHasMoreInfo.pipe'
import { AppendtooltipTextPipe } from 'src/util/pipes/appendTooltipText.pipe'
import { BinSavedRegionsSelectionPipe } from '../viewerStateController/viewerState.pipes'

describe('test', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [
        SearchSideNav,
        TemplateParcellationHasMoreInfo,
        AppendtooltipTextPipe,
        BinSavedRegionsSelectionPipe
      ],
      imports: [
        AngularMaterialModule,

        // required for iavSwitch etc
        UtilModule,
      ],
      providers: [
        provideMockStore({ initialState: {
          // ...defaultRootState,
          uiState: {
            // ...defaultRootState.uiState,
            sidePanelExploreCurrentViewIsOpen: true
          },
          viewerState: {
            // ...defaultRootState.viewerState,
            templateSelected: COLIN,
            parcellationSelected: JUBRAIN_COLIN,
            regionsSelected:[ JUBRAIN_COLIN_CH123_LEFT, JUBRAIN_COLIN_CH123_RIGHT ]
          }
        }}),
        {
          provide: HTTP_INTERCEPTORS,
          useClass: HttpMockRequestInterceptor,
          multi: true
        }
        
      ],
      schemas: [
        CUSTOM_ELEMENTS_SCHEMA
      ]
    }).compileComponents()
  }))
  
  it('should create component', () => {

    const fixture = TestBed.createComponent(SearchSideNav);
    const app = fixture.debugElement.componentInstance;
    
    expect(app).toBeTruthy();

  })

  // TODO restore test after ViewerStateController has been refactored

  // it('viewerStateController should be visible', async () => {

  //   const fixture = TestBed.createComponent(SearchSideNav);
    
  //   const vsController = fixture.debugElement.query(By.directive(ViewerStateController))
  //   expect(vsController).toBeTruthy();
  // })

  it('when parent size is defined, child component should be of the same size', () => {
    const fixture = TestBed.createComponent(SearchSideNav)

    fixture.nativeElement.style.width = '1000px'
    fixture.nativeElement.style.height = '1000px'

    fixture.debugElement.nativeElement.classList.add('h-100', 'w-100', 'd-block', 'overflow-visible')

    fixture.detectChanges()

    expect(fixture.debugElement.nativeElement.style.width).toEqual('1000px')
    expect(fixture.debugElement.nativeElement.style.height).toEqual('1000px')
  })

  // TODO reenable when UIModule has been refactored
  // currently, custom schema is perhaps ruining init of 

  // it('when multiple regions are selected, cdk should be visible', () => {

  //   const fixture = TestBed.createComponent(SearchSideNav);
  //   fixture.nativeElement.style.width = '1000px'
  //   fixture.nativeElement.style.height = '1000px'
    
  //   fixture.debugElement.nativeElement.classList.add('h-100', 'd-block', 'overflow-visible')
  //   fixture.detectChanges()

  //   expect(fixture.debugElement.nativeElement.clientWidth).toBeGreaterThan(100)
  //   expect(fixture.debugElement.nativeElement.clientHeight).toBeGreaterThan(100)

  //   const cdkViewPort = fixture.debugElement.query(By.directive(CdkFixedSizeVirtualScroll))
  //   expect(cdkViewPort).toBeTruthy()

  //   expect(cdkViewPort.nativeElement.clientWidth).toBeGreaterThan(80)
  //   expect(cdkViewPort.nativeElement.clientHeight).toBeGreaterThan(80)
  // })
})
