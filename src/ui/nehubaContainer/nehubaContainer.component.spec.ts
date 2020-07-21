import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { TestBed, async } from "@angular/core/testing"
import { NehubaContainer } from "./nehubaContainer.component"
import { provideMockStore, MockStore } from "@ngrx/store/testing"
import { defaultRootState } from 'src/services/stateStore.service'
import { ComponentsModule } from "src/components"
import { AngularMaterialModule } from "../sharedModules/angularMaterial.module"
import { TouchSideClass } from "./touchSideClass.directive"
import { MaximmisePanelButton } from "./maximisePanelButton/maximisePanelButton.component"
import { LandmarkUnit } from './landmarkUnit/landmarkUnit.component'
import { LayoutModule } from 'src/layouts/layout.module'
import { UtilModule } from "src/util"
import { AtlasLayerSelector } from "../atlasLayerSelector/atlasLayerSelector.component"
import { StatusCardComponent } from './statusCard/statusCard.component'
import { NehubaViewerTouchDirective } from './nehubaViewerInterface/nehubaViewerTouch.directive'
import { MobileOverlay } from "./mobileOverlay/mobileOverlay.component"
import { RegionMenuComponent } from "../parcellationRegion/regionMenu/regionMenu.component"
import { DatabrowserModule } from "../databrowserModule"
import { SplashScreen } from "./splashScreen/splashScreen.component"
import { CurrentLayout } from 'src/ui/config/currentLayout/currentLayout.component'
import { RegionDirective } from 'src/ui/parcellationRegion/region.directive'
import { RegionTextSearchAutocomplete } from "../viewerStateController/regionSearch/regionSearch.component"
import { MobileControlNubStylePipe } from './pipes/mobileControlNubStyle.pipe'
import { ReorderPanelIndexPipe } from './reorderPanelIndex.pipe'
import { SafeStylePipe } from 'src/util/pipes/safeStyle.pipe'
import { AuthModule } from 'src/auth'
import { StateModule } from 'src/state'
import { ReactiveFormsModule, FormsModule } from '@angular/forms'
import { HttpClientModule } from '@angular/common/http'
import { WidgetModule } from 'src/widget'
import { PluginModule } from 'src/atlasViewer/pluginUnit/plugin.module'
import { NehubaModule } from './nehuba.module'
import { CommonModule } from '@angular/common'
import { IMPORT_NEHUBA_INJECT_TOKEN } from './nehubaViewer/nehubaViewer.component'
import { viewerStateHelperStoreName } from 'src/services/state/viewerState.store.helper'

const _bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const _bigbrainNehubaConfigJson = require('!json-loader!src/res/ext/bigbrainNehubaConfig.json')
const bigbrainJson = {
  ..._bigbrainJson,
  nehubaConfig: _bigbrainNehubaConfigJson
}
const humanAtlas = require('!json-loader!src/res/ext/atlas/atlas_multiLevelHuman.json')
const importNehubaSpy = jasmine.createSpy('importNehubaSpy').and.returnValue(Promise.reject())

describe('> nehubaContainer.component.ts', () => {

  describe('> NehubaContainer', () => {

    beforeEach(async(() => {

      TestBed.configureTestingModule({
        imports: [
          PluginModule,
          WidgetModule,
          ComponentsModule,
          AngularMaterialModule,
          LayoutModule,
          UtilModule,
          DatabrowserModule,
          NehubaModule,
          AuthModule,
          StateModule,
          FormsModule,
          ReactiveFormsModule,
          HttpClientModule,
          CommonModule
        ],
        declarations: [
          NehubaContainer,
          TouchSideClass,
          MaximmisePanelButton,
          LandmarkUnit,
          AtlasLayerSelector,
          StatusCardComponent,
          NehubaViewerTouchDirective,
          MobileOverlay,
          RegionMenuComponent,
          SplashScreen,
          CurrentLayout,
          RegionDirective,
          RegionTextSearchAutocomplete,

          // pipes
          MobileControlNubStylePipe,
          ReorderPanelIndexPipe,
          SafeStylePipe
        ],
        providers: [
          provideMockStore({ initialState: defaultRootState }),
          {
            provide: IMPORT_NEHUBA_INJECT_TOKEN,
            useValue: importNehubaSpy
          }
        ],
        schemas: [
          CUSTOM_ELEMENTS_SCHEMA
        ],
      }).compileComponents()

    }))

    it('> component can be created', () => {
      const fixture = TestBed.createComponent(NehubaContainer)
      const el = fixture.debugElement.componentInstance
      expect(el).toBeTruthy()
    })

    describe('> on selectedTemplatechange', () => {
      
      it('> calls importNehubaPr', async () => {
        const fixture = TestBed.createComponent(NehubaContainer)

        const mockStore = TestBed.inject(MockStore)
        const newState = {
          ...defaultRootState,
          viewerState: {
            ...defaultRootState.viewerState,
            fetchedTemplates: [ bigbrainJson ],
            templateSelected: bigbrainJson,
            parcellationSelected: bigbrainJson.parcellations[0]
          },
          [viewerStateHelperStoreName]: {
            fetchedAtlases: [ humanAtlas ],
            selectedAtlasId: humanAtlas['@id']
          }
        }

        mockStore.setState(newState)
        fixture.detectChanges()
        expect(importNehubaSpy).toHaveBeenCalled()
      })

      /**
       * TODO perhaps move this to e2e?
       */
      it('> drag handle reattaches properly')
    })

    describe('> on selectedparcellation change', () => {
      it('> should set ngId of nehubaViewer', () => {
        
        const fixture = TestBed.createComponent(NehubaContainer)
        const el = fixture.debugElement.componentInstance as NehubaContainer
        const mockStore = TestBed.inject(MockStore)
        const newState = {
          ...defaultRootState,
          viewerState: {
            ...defaultRootState.viewerState,
            fetchedTemplates: [ bigbrainJson ],
            templateSelected: bigbrainJson,
            parcellationSelected: bigbrainJson.parcellations[0]
          },
          [viewerStateHelperStoreName]: {
            fetchedAtlases: [ humanAtlas ],
            selectedAtlasId: humanAtlas['@id']
          }
        }

        mockStore.setState(newState)
        fixture.detectChanges()

        const setSpy = spyOnProperty(el.nehubaViewer, 'ngIds', 'set')

        const newState2 = {
          ...defaultRootState,
          viewerState: {
            ...defaultRootState.viewerState,
            fetchedTemplates: [ bigbrainJson ],
            templateSelected: bigbrainJson,
            parcellationSelected: bigbrainJson.parcellations[1]
          },
          [viewerStateHelperStoreName]: {
            fetchedAtlases: [ humanAtlas ],
            selectedAtlasId: humanAtlas['@id']
          }
        }

        mockStore.setState(newState2)
        fixture.detectChanges()

        expect(setSpy).toHaveBeenCalled()
        
      })
    })
  })
})