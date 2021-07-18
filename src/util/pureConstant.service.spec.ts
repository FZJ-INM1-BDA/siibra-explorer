import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { TestBed } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { BS_ENDPOINT } from "src/atlasComponents/regionalFeatures/bsFeatures"
import { AtlasWorkerService } from "src/atlasViewer/atlasViewer.workerService.service"
import { viewerStateFetchedAtlasesSelector, viewerStateFetchedTemplatesSelector } from "src/services/state/viewerState/selectors"
import { PureContantService } from "./pureConstant.service"
import { TAtlas } from "./siibraApiConstants/types"

const MOCK_BS_ENDPOINT = `http://localhost:1234`

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
          },
          {
            provide: BS_ENDPOINT,
            useValue: MOCK_BS_ENDPOINT
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
      const exp = httpController.expectOne(`${MOCK_BS_ENDPOINT}/atlases`)
      exp.flush([])
      expect(service).toBeTruthy()
    })
    describe('> allFetchingReady$', () => {
      const mockAtlas: TAtlas = {
        id: 'mockatlas id',
        name: 'mockatlas name',
        links: {
          parcellations: {
            href: `${MOCK_BS_ENDPOINT}/mockatlas-parcellation-href`
          },
          spaces: {
            href: `${MOCK_BS_ENDPOINT}/atlas-spaces`
          }
        }
      }
      it('> can be init, and configuration emits allFetchingReady$', () => {
        const service = TestBed.inject(PureContantService)
        const exp = httpController.expectOne(`${MOCK_BS_ENDPOINT}/atlases`)
        exp.flush([mockAtlas])
        service.allFetchingReady$.subscribe()

        const expT1 = httpController.expectOne(`${MOCK_BS_ENDPOINT}/atlases/${encodeURIComponent(mockAtlas.id)}/spaces`)
        expT1.flush([])
        const expP1 = httpController.expectOne(`${MOCK_BS_ENDPOINT}/atlases/${encodeURIComponent(mockAtlas.id)}/parcellations`)
        expP1.flush([])
      })
  
    })
  })
})
