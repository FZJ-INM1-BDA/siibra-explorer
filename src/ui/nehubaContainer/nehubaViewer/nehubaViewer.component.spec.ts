import { TestBed, async } from "@angular/core/testing"
import { CommonModule, DOCUMENT } from "@angular/common"
import { NehubaViewerUnit, IMPORT_NEHUBA_INJECT_TOKEN } from "./nehubaViewer.component"
import { importNehubaFactory } from "../util"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { LoggingModule } from "src/logging"


describe('nehubaViewer.component,ts', () => {
  describe('NehubaViewerUnit', () => {
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          CommonModule,
          LoggingModule
        ],
        declarations: [
          NehubaViewerUnit
        ],
        providers:[
          {
            provide: IMPORT_NEHUBA_INJECT_TOKEN,
            useFactory: importNehubaFactory,
            deps: [ DOCUMENT ]
          },
          AtlasWorkerService
        ]
      }).compileComponents()
    }))

    it('> creates component', () => {
      const fixture = TestBed.createComponent(NehubaViewerUnit)
      expect(fixture.componentInstance).toBeTruthy()
    })

    describe('> getters', () => {
      it('> showLayersName is a combination of multiNgIdsLabelIndexMap key values and overrideShowLayers', () => {
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        const overrideShowLayers = [
          `test-1`,
          `test-2`
        ]
        fixture.componentInstance.overrideShowLayers = overrideShowLayers
        fixture.componentInstance.multiNgIdsLabelIndexMap = new Map([
          ['test-3', new Map()]
        ])

        fixture.detectChanges()

        expect(fixture.componentInstance.showLayersName).toEqual([
          `test-1`,
          `test-2`,
          `test-3`
        ])
      })
    })

    describe('> on create', () => {
      it('> calls onInit lifecycle param properly', () => {
        const onInitSpy = jasmine.createSpy('onInit')
        const fixture = TestBed.createComponent(NehubaViewerUnit)
        fixture.componentInstance.lifecycle = {
          onInit: onInitSpy
        }

        fixture.detectChanges()

        expect(onInitSpy).toHaveBeenCalled()
      })
    })
  })
})