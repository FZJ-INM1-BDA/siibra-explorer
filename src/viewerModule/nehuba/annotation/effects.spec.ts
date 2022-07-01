import { TestBed } from "@angular/core/testing"
import { provideMockActions } from "@ngrx/effects/testing"
import { Action } from "@ngrx/store"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { hot } from "jasmine-marbles"
import { Observable } from "rxjs"
import { annotation, atlasAppearance } from "src/state"
import { NgAnnotationEffects } from "./effects"

describe("effects.ts", () => {
  describe("NgAnnotationEffects", () => {
    let actions$: Observable<Action>
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideMockStore(),
          provideMockActions(() => actions$),
          NgAnnotationEffects,
        ]
      })
    })
    describe("onAnnotationHideQuadrant", () => {
      describe("> when space filtered annotation does not exist", () => {
        it("> should setOctantRemoval true", () => {
          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(annotation.selectors.spaceFilteredAnnotations, [])
          const effect = TestBed.inject(NgAnnotationEffects)
          expect(effect.onAnnotationHideQuadrant).toBeObservable(
            hot('a', {
              a: atlasAppearance.actions.setOctantRemoval({
                flag: true
              })
            })
          )
        })
      })
      describe("> when space filtered annotation exist", () => {
        it("> should setOctantRemoval false", () => {
          const mockStore = TestBed.inject(MockStore)
          mockStore.overrideSelector(annotation.selectors.spaceFilteredAnnotations, [{} as any])
          const effect = TestBed.inject(NgAnnotationEffects)
          expect(effect.onAnnotationHideQuadrant).toBeObservable(
            hot('a', {
              a: atlasAppearance.actions.setOctantRemoval({
                flag: false
              })
            })
          )
        })
      })

      describe("> on switch of space filtered annotations length", () => {
        it("> should emit accordingly")
      })
      describe("> on repeated emit of space filtered annotations length", () => {
        it("> should only emit once")
      })
    })
  })
})