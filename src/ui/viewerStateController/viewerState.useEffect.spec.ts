import { ViewerStateControllerUseEffect } from './viewerState.useEffect'
import { Observable, of } from 'rxjs'
import { TestBed } from '@angular/core/testing'
import { provideMockActions } from '@ngrx/effects/testing'
import { provideMockStore } from '@ngrx/store/testing'
import { defaultRootState, NEWVIEWER } from 'src/services/stateStore.service'
import { Injectable } from '@angular/core'
import { TemplateCoordinatesTransformation, ITemplateCoordXformResp } from 'src/services/templateCoordinatesTransformation.service'
import { hot } from 'jasmine-marbles'
import { VIEWERSTATE_CONTROLLER_ACTION_TYPES } from './viewerState.base'
import { AngularMaterialModule } from '../sharedModules/angularMaterial.module'
import { HttpClientModule } from '@angular/common/http'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const colinJson = require('!json-loader!src/res/ext/colin.json')
const colinJsonNehubaConfig = require('!json-loader!src/res/ext/colinNehubaConfig.json')
const reconstitutedColin = {
  ...colinJson,
  nehubaConfig: colinJsonNehubaConfig
}
let returnPosition = null
@Injectable()
class MockCoordXformService{
  getPointCoordinatesForTemplate(src:string, tgt: string, pos: [number, number, number]): Observable<ITemplateCoordXformResp>{
    return returnPosition
      ? of({ status: 'completed', result: returnPosition } as ITemplateCoordXformResp)
      : of({ status: 'error', statusText: 'Failing query' } as ITemplateCoordXformResp)
  }
}

const initialState = defaultRootState
defaultRootState.viewerState.fetchedTemplates = [
  bigbrainJson,
  reconstitutedColin
]
initialState.viewerState.templateSelected = defaultRootState.viewerState.fetchedTemplates[0]
const currentNavigation = {
  position: [4, 5, 6],
  orientation: [0, 0, 0, 1],
  perspectiveOrientation: [ 0, 0, 0, 1],
  perspectiveZoom: 2e5,
  zoom: 1e5
}
initialState.viewerState.navigation = currentNavigation

describe('viewerState.useEffect.ts', () => {
  describe('ViewerStateControllerUseEffect', () => {
    let actions$: Observable<any>
    let spy: any
    beforeEach(() => {

      const mock = new MockCoordXformService()
      spy = spyOn(mock, 'getPointCoordinatesForTemplate').and.callThrough()
      returnPosition = null
      actions$ = hot(
        'a',
        {
          a: { 
            type: VIEWERSTATE_CONTROLLER_ACTION_TYPES.SELECT_TEMPLATE_WITH_NAME,
            payload: reconstitutedColin
          }
        }
      )

      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientModule
        ],
        providers: [
          ViewerStateControllerUseEffect,
          provideMockActions(() => actions$),
          provideMockStore({ initialState }),
          {
            provide: TemplateCoordinatesTransformation,
            useValue: mock
          }
        ]
      })
    })

    describe('selectTemplateWithName$', () => {

      it('if coordXform returns error', () => {

        const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        expect(
          viewerStateCtrlEffect.selectTemplateWithName$
        ).toBeObservable(
          hot(
            'a',
            {
              a: {
                type: NEWVIEWER,
                selectTemplate: reconstitutedColin,
                selectParcellation: reconstitutedColin.parcellations[0]
              }
            }
          )
        )
      })

      it('calls with correct param', () => {

        // necessary for observable to fire
        const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        expect(
          viewerStateCtrlEffect.selectTemplateWithName$
        ).toBeObservable(
          hot(
            'a',
            {
              a: {
                type: NEWVIEWER,
                selectTemplate: reconstitutedColin,
                selectParcellation: reconstitutedColin.parcellations[0]
              }
            }
          )
        )
        expect(spy).toHaveBeenCalledWith(
          bigbrainJson.name,
          reconstitutedColin.name,
          initialState.viewerState.navigation.position
        )
      })

      it('if coordXform returns complete', () => {
        returnPosition = [ 1.11e6, 2.22e6, 3.33e6 ]

        const viewerStateCtrlEffect = TestBed.inject(ViewerStateControllerUseEffect)
        const updatedColin = JSON.parse( JSON.stringify( reconstitutedColin ) )
        const updatedColinNavigation = updatedColin.nehubaConfig.dataset.initialNgState.navigation

        const { zoom, orientation, perspectiveOrientation, position, perspectiveZoom } = currentNavigation

        for (const idx of [0, 1, 2]) {
          updatedColinNavigation.pose.position.voxelCoordinates[idx] = returnPosition[idx] / updatedColinNavigation.pose.position.voxelSize[idx]
        }
        updatedColinNavigation.zoomFactor = zoom
        updatedColinNavigation.pose.orientation = orientation

        expect(
          viewerStateCtrlEffect.selectTemplateWithName$
        ).toBeObservable(
          hot(
            'a',
            {
              a: {
                type: NEWVIEWER,
                selectTemplate: updatedColin,
                selectParcellation: updatedColin.parcellations[0]
              }
            }
          )
        )
      })
    })
  })
})