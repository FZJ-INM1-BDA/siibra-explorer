import { cvtNehubaConfigToNavigationObj, ViewerStateControllerUseEffect, defaultNavigationObject, defaultNehubaConfigObject } from './viewerState.useEffect'
import { Observable, of, throwError } from 'rxjs'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { MockStore, provideMockStore } from '@ngrx/store/testing'
import { defaultRootState } from 'src/services/stateStore.service'
import { Injectable } from '@angular/core'
import { TemplateCoordinatesTransformation, ITemplateCoordXformResp } from 'src/services/templateCoordinatesTransformation.service'
import { AngularMaterialModule } from 'src/sharedModules'
import { HttpClientModule } from '@angular/common/http'
import { PureContantService } from 'src/util'


let returnPosition = null
const dummyParc1 = {
  name: 'dummyParc1'
} as any
const dummyTmpl1 = {
  '@id': 'dummyTmpl1-id',
  name: 'dummyTmpl1',
  parcellations: [dummyParc1],
  nehubaConfig: {
    dataset: {
      initialNgState: {
        ...defaultNehubaConfigObject
      }
    }
  }
} as any

const dummyParc2 = {
  name: 'dummyParc2'
}
const dummyTmpl2 = {
  '@id': 'dummyTmpl2-id',
  name: 'dummyTmpl2',
  parcellations: [dummyParc2],
  nehubaConfig: {
    dataset: {
      initialNgState: {
        ...defaultNehubaConfigObject
      }
    }
  }
}

@Injectable()
class MockCoordXformService{
  getPointCoordinatesForTemplate(src:string, tgt: string, pos: [number, number, number]): Observable<ITemplateCoordXformResp>{
    return returnPosition
      ? of({ status: 'completed', result: returnPosition } as ITemplateCoordXformResp)
      : of({ status: 'error', statusText: 'Failing query' } as ITemplateCoordXformResp)
  }
}

const initialState = JSON.parse(JSON.stringify( defaultRootState ))
const mockFetchedTemplates = [
  dummyTmpl2,
  dummyTmpl1
]
initialState.viewerState.fetchedTemplates = mockFetchedTemplates
initialState.viewerState.templateSelected = dummyTmpl2
const currentNavigation = {
  position: [4, 5, 6],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [ 0, 0, 0, 1],
  perspectiveZoom: 2e5,
  zoom: 1e5
}
initialState.viewerState.navigation = currentNavigation

class MockPureConstantService{
  allFetchingReady$ = of(true)
  initFetchTemplate$ = of([])

  getRegionDetail(){
    return of(null)
  }
}

const mockPureConstantService = new MockPureConstantService()
describe('> viewerState.useEffect.ts', () => {
  describe('> ViewerStateControllerUseEffect', () => {
    let actions$: Observable<any>
    let spy: jasmine.Spy
    let mockStore: MockStore
    beforeEach(() => {

      const mock = new MockCoordXformService()
      spy = spyOn(mock, 'getPointCoordinatesForTemplate').and.callThrough()
      returnPosition = null

      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientModule,
        ],
        providers: [
          ViewerStateControllerUseEffect,
          provideMockActions(() => actions$),
          provideMockStore({ initialState }),
          {
            provide: TemplateCoordinatesTransformation,
            useValue: mock
          },
          {
            provide: PureContantService,
            useValue: mockPureConstantService
          }
        ]
      })

      mockStore = TestBed.inject(MockStore)
    })

  
    describe('> onSelectAtlasSelectTmplParc$', () => {
      let mockStore: MockStore
      beforeEach(() => {
        mockStore = TestBed.inject(MockStore)
      })

      it('> if atlas not found, return general error', () => {

      })
    
      describe('> if atlas found', () => {
        const mockParc1 = {
          ['@id']: 'parc-1',
          availableIn: [{
            ['@id']: 'test-1'
          }]
        }
        const mockParc0 = {
          ['@id']: 'parc-0',
          availableIn: [{
            ['@id']: 'hello world'
          }]
        }
        const mockTmplSpc = {
          ['@id']: 'hello world',
          availableIn: [ mockParc0 ]
        }
        const mockTmplSpc1 = {
          ['@id']: 'test-1',
          availableIn: [ mockParc1 ]
        }

        describe('> if template key val is not provided', () => {
          describe('> will try to find the id of the first tmpl', () => {

            it('> if fails, will return general error', () => {

            })
          
            it('> if succeeds, will dispatch new viewer', () => {

            })
      
          })
        })

        describe('> if template key val is provided', () => {

          const completeMockTmpl = {
            ...mockTmplSpc,
            parcellations: [ mockParc0 ]
          }
          const completeMocktmpl1 = {
            ...mockTmplSpc1,
            parcellations: [ mockParc1 ]
          }
          beforeEach(() => {

          })
          it('> will select template.@id', () => {

          })
          
          it('> if template.@id is not defined, will fallback to first template', () => {

          })
        })
      })
    })
  })

  describe('> cvtNehubaConfigToNavigationObj', () => {
    describe('> returns default obj when input is malformed', () => {
      it('> if no arg is provided', () => {

        const obj = cvtNehubaConfigToNavigationObj()
        expect(obj).toEqual(defaultNavigationObject)
      })
      it('> if null or undefined is provided', () => {

        const obj = cvtNehubaConfigToNavigationObj(null)
        expect(obj).toEqual(defaultNavigationObject)

        const obj2 = cvtNehubaConfigToNavigationObj(undefined)
        expect(obj2).toEqual(defaultNavigationObject)
      })
      it('> if malformed', () => {
        
        const obj = cvtNehubaConfigToNavigationObj(dummyTmpl2)
        expect(obj).toEqual(defaultNavigationObject)

        const obj2 = cvtNehubaConfigToNavigationObj({})
        expect(obj2).toEqual(defaultNavigationObject)
      })
    })
    it('> converts nehubaConfig object to navigation object', () => {
      const obj = cvtNehubaConfigToNavigationObj(dummyTmpl2.nehubaConfig.dataset.initialNgState)
      expect(obj).toEqual(defaultNavigationObject)
    })
  })

})
