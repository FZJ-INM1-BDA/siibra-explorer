import { } from 'jasmine'
import { AtlasViewerAPIServices } from "src/atlasViewer/atlasViewer.apiService.service";
import { async, TestBed } from "@angular/core/testing";
import { provideMockActions } from "@ngrx/effects/testing";
import { provideMockStore } from "@ngrx/store/testing";
import { defaultRootState } from "src/services/stateStore.service";
import { Observable, of } from "rxjs";
import { Action } from "@ngrx/store";
import { AngularMaterialModule } from "src/ui/sharedModules/angularMaterial.module";
import { HttpClientModule } from '@angular/common/http';
import { WidgetModule } from './widgetUnit/widget.module';
import { PluginModule } from './pluginUnit/plugin.module';
const actions$: Observable<Action> = of({ type: 'TEST' })


describe('atlasViewer.apiService.service.ts', () => {
  describe('getUserToSelectARegion', () => {

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          HttpClientModule,
          WidgetModule,
          PluginModule,
        ],
        providers: [
          AtlasViewerAPIServices,
          provideMockActions(() => actions$),
          provideMockStore({ initialState: defaultRootState })
        ]
      }).compileComponents()
    }))

    it('should return value on resolve', async () => {
      const regionToSend = 'test-region'
      let sentData: any
      const apiService = TestBed.get(AtlasViewerAPIServices)
      const callApi = apiService.interactiveViewer.uiHandle.getUserToSelectARegion('selecting Region mode message')
      apiService.getUserToSelectARegionResolve(regionToSend)
      await callApi.then(r => {
        sentData = r
      })
      expect(sentData).toEqual(regionToSend)
    })

    it('pluginRegionSelectionEnabled should false after resolve', async () => {
      const { uiState } = defaultRootState
      const regionToSend = 'test-region'
      let sentData: any
      const apiService = TestBed.get(AtlasViewerAPIServices)
      const callApi = apiService.interactiveViewer.uiHandle.getUserToSelectARegion('selecting Region mode message')
      apiService.getUserToSelectARegionResolve(regionToSend)
      await callApi.then(r => {
        sentData = r
      })
      expect(uiState.pluginRegionSelectionEnabled).toBe(false)
    })
  })
})