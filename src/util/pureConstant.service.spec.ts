import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { viewerStateFetchedAtlasesSelector, viewerStateFetchedTemplatesSelector } from "src/services/state/viewerState/selectors"
import { PureContantService } from "./pureConstant.service"

describe('> pureConstant.service.ts', () => {
  describe('> PureContantService', () => {
    let httpController: HttpTestingController
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports:[
          HttpClientTestingModule,
        ],
        providers: [
          provideMockStore(),
          {
            provide: AtlasWorkerService,
            useValue: {
              worker: null
            }
          }
        ]
      })

      const mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateFetchedTemplatesSelector, [])
      mockStore.overrideSelector(viewerStateFetchedAtlasesSelector, [])
      httpController = TestBed.inject(HttpTestingController)
    })

    afterEach(() => {
      httpController.verify()
    })

    it('> can be init', () => {
      const service = TestBed.inject(PureContantService)
      const exp = httpController.expectOne(`${service.backendUrl}/atlases/`)
      exp.flush([])
      expect(service).toBeTruthy()
    })
    describe('> allFetchingReady$', () => {

      it('> can be init, and configuration emits allFetchingReady$', () => {
        const service = TestBed.inject(PureContantService)
        const exp = httpController.expectOne(`${service.backendUrl}/atlases/`)
        exp.flush([])
        service.allFetchingReady$.subscribe()
        const expT = httpController.expectOne(`${service.backendUrl}templates`)
        expT.flush([])
        expect(
          service.allFetchingReady$
        ).toBeObservable(
          hot('a', {
            a: true,
          })
        )
      })
  
    })
  })
})
