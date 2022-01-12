import { CommonModule } from "@angular/common"
import { ComponentFixture, TestBed } from "@angular/core/testing"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { ComponentsModule } from "src/components"
import { viewerStateSelectTemplateWithId, viewerStateToggleLayer } from "src/services/state/viewerState.store.helper"
import { AngularMaterialModule } from "src/sharedModules"
import { QuickTourModule } from "src/ui/quickTour"
import { GetGroupedParcPipe } from "../pipes/getGroupedParc.pipe"
import { GetIndividualParcPipe } from "../pipes/getIndividualParc.pipe"
import { GetNonbaseParcPipe } from "../pipes/getNonBaseParc.pipe"
import { AtlasLayerSelector } from "./atlasLayerSelector.component"

describe("> atlasLayerSelector.component.ts", () => {
  describe("> AtlasLayerSelector", () => {
    let fixture: ComponentFixture<AtlasLayerSelector>
    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [
          CommonModule,
          AngularMaterialModule,
          NoopAnimationsModule,
          QuickTourModule,
          ComponentsModule,
        ],
        declarations: [
          AtlasLayerSelector,
          GetIndividualParcPipe,
          GetNonbaseParcPipe,
          GetGroupedParcPipe,
        ],
        providers: [
          provideMockStore()
        ]
      }).compileComponents()
    })

    it("> can be init", () => {
      fixture = TestBed.createComponent(AtlasLayerSelector)
      expect(fixture).toBeTruthy()
    })

    describe("> methods", () => {
      beforeEach(() => {
        fixture = TestBed.createComponent(AtlasLayerSelector)
      })
      describe("> selectParcellationWithName", () => {
        let tmplSupportParcPipeTransform: jasmine.Spy
        let storeDispatchSpy: jasmine.Spy
        const dummySelectedTmpl = {
          "this": "obj"
        }
        const dummyParc = {
          "foo": "bar",
          "availableIn": [{
            "baz": "yoo"
          }]
        }
        beforeEach(() => {
          tmplSupportParcPipeTransform = spyOn(fixture.componentInstance['currTmplSupportParcPipe'], 'transform')
          const store = TestBed.inject(MockStore)
          storeDispatchSpy = spyOn(store, 'dispatch')
          fixture.componentInstance['selectedTemplate'] = dummySelectedTmpl
        })
        afterEach(() => {
          if (tmplSupportParcPipeTransform) {
            tmplSupportParcPipeTransform.calls.reset()
          }
        })
        it("> calls pipe.transform", () => {
          tmplSupportParcPipeTransform.and.returnValue(true)
          fixture.componentInstance.selectParcellationWithName(dummyParc)
          expect(tmplSupportParcPipeTransform).toHaveBeenCalledWith(dummySelectedTmpl, dummyParc)
          expect(storeDispatchSpy).toHaveBeenCalledTimes(1)
        })
        
        const tmplChgReqParam = [true, false]
        
        for (const tmplChgReq of tmplChgReqParam) {
          describe(`> tmplChgReq: ${tmplChgReq}`, () => {
            it("> expect the correct type of method to be called", () => {
              tmplSupportParcPipeTransform.and.returnValue(!tmplChgReq)
              fixture.componentInstance.selectParcellationWithName(dummyParc)
              const allArgs = storeDispatchSpy.calls.allArgs()
              expect(allArgs.length).toEqual(1)
              expect(allArgs[0].length).toEqual(1)
              const action = allArgs[0][0]

              const expectedAction = tmplChgReq
                ? viewerStateSelectTemplateWithId
                : viewerStateToggleLayer

              expect(action.type).toEqual(expectedAction.type)
            })
          })
        }
      })
    })
  })
})
