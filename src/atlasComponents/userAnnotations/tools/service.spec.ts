import { TestBed } from "@angular/core/testing"
import { ModularUserAnnotationToolService } from "./service"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { NoopAnimationsModule } from "@angular/platform-browser/animations"
import { MatSnackBarModule } from "@angular/material/snack-bar"
import { ANNOTATION_EVENT_INJ_TOKEN, INJ_ANNOT_TARGET } from "./type"
import { NEVER, Subject } from "rxjs"
import { atlasSelection } from "src/state"

describe("userAnnotations/service.ts", () => {

  describe("ModularUserAnnotationToolService", () => {
    let service: ModularUserAnnotationToolService
    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [
          NoopAnimationsModule,
          MatSnackBarModule,
        ],
        providers: [
          provideMockStore(),
          {
            provide: INJ_ANNOT_TARGET,
            useValue: NEVER
          },
          {
            provide: ANNOTATION_EVENT_INJ_TOKEN,
            useValue: new Subject()
          },
          ModularUserAnnotationToolService
        ]
      })

      const mStore = TestBed.inject(MockStore)
      mStore.overrideSelector(atlasSelection.selectors.selectedTemplate, null)
      mStore.overrideSelector(atlasSelection.selectors.viewerMode, null)
    })
    it("> can be init", () => {
      const svc = TestBed.inject(ModularUserAnnotationToolService)
      expect(svc).toBeDefined()
    })
  })
})
