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
import { RenderViewOriginDatasetLabelPipe } from '../parcellationRegion/region.base'
import { By } from '@angular/platform-browser'
import { ARIA_LABELS } from 'common/constants'
import { NoopAnimationsModule } from '@angular/platform-browser/animations'
import { RegionAccordionTooltipTextPipe } from '../util'
import { hot } from 'jasmine-marbles'

const { 
  TOGGLE_SIDE_PANEL,
  EXPAND,
  COLLAPSE
} = ARIA_LABELS

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
          NoopAnimationsModule,
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
          SafeStylePipe,
          RenderViewOriginDatasetLabelPipe,
          RegionAccordionTooltipTextPipe,
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
      fixture.componentInstance.currentOnHoverObs$ = hot('')
      const el = fixture.debugElement.componentInstance
      expect(el).toBeTruthy()
    })

    describe('> on selectedTemplatechange', () => {
      
      it('> calls importNehubaPr', async () => {
        const fixture = TestBed.createComponent(NehubaContainer)
        fixture.componentInstance.currentOnHoverObs$ = hot('')

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
        fixture.componentInstance.currentOnHoverObs$ = hot('')
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

    describe('> extended sidepanel hides and shows as expected', () => {
      describe('> on start, if nothing is selected', () => {
        beforeEach(() => {
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
        })

        it('> both should be shut', () => {
          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(false)
          expect(
            fixture.componentInstance.matDrawerMinor.opened
          ).toEqual(false)
        })

        it('> opening via tab should result in only top drawer open', () => {

          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
          toggleBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          
          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(true)
          expect(
            fixture.componentInstance.matDrawerMinor.opened
          ).toEqual(false)
        })

        it('> on opening top drawer, explore features should not be present', () => {

          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
          toggleBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${EXPAND}"]`) )
          expect(expandRegionFeatureBtn).toBeNull()
        })
        it('> collapse btn should not be visible', () => {

          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
          toggleBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
          expect(expandRegionFeatureBtn).toBeNull()
        })
      })

      describe('> on start, if something is selected', () => {
        beforeEach(() => {
          const mockStore = TestBed.inject(MockStore)
          const newState = {
            ...defaultRootState,
            viewerState: {
              ...defaultRootState.viewerState,
              fetchedTemplates: [ bigbrainJson ],
              templateSelected: bigbrainJson,
              parcellationSelected: bigbrainJson.parcellations[0],
              regionsSelected: [{
                name: "foobar"
              }]
            },
            [viewerStateHelperStoreName]: {
              fetchedAtlases: [ humanAtlas ],
              selectedAtlasId: humanAtlas['@id']
            }
          }

          mockStore.setState(newState)
        })
        it('> both should be open', () => {
          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(true)
          expect(
            fixture.componentInstance.matDrawerMinor.opened
          ).toEqual(true)

          expect(
            fixture.componentInstance.navSideDrawerMainSwitch.switchState
          ).toEqual(true)
          expect(
            fixture.componentInstance.navSideDrawerMinorSwitch.switchState
          ).toEqual(true)
        })

        it('> closing main drawer via tag should close both', () => {
          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const toggleBtn = fixture.debugElement.query( By.css(`[aria-label="${TOGGLE_SIDE_PANEL}"]`) )
          toggleBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(false)

          /**
           * TODO investigate why openedStart/closedStart events fail to fire
           */
          // expect(
          //   fixture.componentInstance.matDrawerMinor.opened
          // ).toEqual(false)

          // expect(
          //   fixture.componentInstance.navSideDrawerMainSwitch.switchState
          // ).toEqual(false)
          // expect(
          //   fixture.componentInstance.navSideDrawerMinorSwitch.switchState
          // ).toEqual(false)
        })
        it('> collapse btn should be visible', () => {

          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
          expect(collapseRegionFeatureBtn).not.toBeNull()
        })
        it('> clicking on collapse btn should minimize 1 drawer', () => {

          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
          collapseRegionFeatureBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(true)

          /**
           * TODO investigate why property does not get updated
           */
          // expect(
          //   fixture.componentInstance.matDrawerMinor.opened
          // ).toEqual(false)

          expect(
            fixture.componentInstance.navSideDrawerMainSwitch.switchState
          ).toEqual(true)
          expect(
            fixture.componentInstance.navSideDrawerMinorSwitch.switchState
          ).toEqual(false)
        })

        it('> on minimize drawer, clicking expand btn should expand everything', () => {
          const fixture = TestBed.createComponent(NehubaContainer)
          fixture.componentInstance.currentOnHoverObs$ = hot('')
          fixture.detectChanges()
          const collapseRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-secondary-open="true"] [aria-label="${COLLAPSE}"]`) )
          collapseRegionFeatureBtn.triggerEventHandler('click', null)
          fixture.detectChanges()
          const expandRegionFeatureBtn = fixture.debugElement.query( By.css(`mat-drawer[data-mat-drawer-primary-open="true"] [aria-label="${EXPAND}"]`) )
          expandRegionFeatureBtn.triggerEventHandler('click', null)
          fixture.detectChanges()

          expect(
            fixture.componentInstance.matDrawerMain.opened
          ).toEqual(true)
          expect(
            fixture.componentInstance.matDrawerMinor.opened
          ).toEqual(true)

          expect(
            fixture.componentInstance.navSideDrawerMainSwitch.switchState
          ).toEqual(true)
          /**
           * TODO figoure out why switch state is updated async, and karma can't force update state
           */
          // expect(
          //   fixture.componentInstance.navSideDrawerMinorSwitch.switchState
          // ).toEqual(true)
        })
      })

      describe('> side bar content', () => {

        /**
         * TODO
         */
        it('> if nothing is shown, it should show place holder text')

        /**
         * TODO
         */
        it('> if something (region features/connectivity) exists, placeh holder text should be hdiden')
      })
    })
  })
})