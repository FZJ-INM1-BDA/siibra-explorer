import { TestBed } from "@angular/core/testing"
import { Action } from "@ngrx/store"
import { provideMockActions } from "@ngrx/effects/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { Observable, of } from "rxjs"
import { isNewerThan, ViewerStateHelperEffect } from "./viewerState.store.helper"
import { viewerStateGetSelectedAtlas, viewerStateSelectedTemplateSelector } from "./viewerState/selectors"
import { viewerStateHelperSelectParcellationWithId, viewerStateRemoveAdditionalLayer } from "./viewerState/actions"
import { generalActionError } from "../stateStore.helper"
import { hot } from "jasmine-marbles"

describe('> viewerState.store.helper.ts', () => {
  const tmplId = 'test-tmpl-id'
  const tmplId0 = 'test-tmpl-id-0'
  describe('> ViewerStateHelperEffect', () => {
    let effect: ViewerStateHelperEffect
    let mockStore: MockStore
    let actions$: Observable<Action>
    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          ViewerStateHelperEffect,
          provideMockStore(),
          provideMockActions(() => actions$)
        ]
      })

      mockStore = TestBed.inject(MockStore)
      mockStore.overrideSelector(viewerStateSelectedTemplateSelector, {
        ['@id']: tmplId
      })

      actions$ = of(
        viewerStateRemoveAdditionalLayer({
          payload: {
            ['@id']: 'bla'
          }
        })
      )
    })

    describe('> if selected atlas has no matching tmpl space', () => {
      beforeEach(() => {
        mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
          templateSpaces: [{
            ['@id']: tmplId0
          }]
        })
      })
      it('> should emit gernal error', () => {
        effect = TestBed.inject(ViewerStateHelperEffect)
        effect.onRemoveAdditionalLayer$.subscribe(val => {
          expect(val.type === generalActionError.type)
        })
      })
    })

    describe('> if selected atlas has matching tmpl', () => {

      const parcId0 = 'test-parc-id-0'
      const parcId1 = 'test-parc-id-1'
      const tmpSp = {
        ['@id']: tmplId,
        availableIn: [{
          ['@id']: parcId0
        }],
      }
      beforeEach(() => {
        mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
          templateSpaces: [
            tmpSp
          ],
          parcellations: [],
        })
      })

      describe('> if parc is empty array', () => {
        it('> should emit with falsy as payload', () => {
          effect = TestBed.inject(ViewerStateHelperEffect)
          expect(
            effect.onRemoveAdditionalLayer$
          ).toBeObservable(
            hot('(a|)', {
              a: viewerStateHelperSelectParcellationWithId({
                payload: undefined
              })
            })
          )
        })
      })
      describe('> if no parc has eligible @id', () => {
        beforeEach(() => {
          mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
            templateSpaces: [
              tmpSp
            ],
            parcellations: [{
              ['@id']: parcId1
            }]
          })
        })
        it('> should emit with falsy as payload', () => {
          effect = TestBed.inject(ViewerStateHelperEffect)
          expect(
            effect.onRemoveAdditionalLayer$
          ).toBeObservable(
            hot('(a|)', {
              a: viewerStateHelperSelectParcellationWithId({
                payload: undefined
              })
            })
          )
        })
      })

      describe('> if some parc has eligible @id', () => {
        describe('> if no @version is available', () => {
          const parc1 = {
            ['@id']: parcId0,
            name: 'p0-0',
            baseLayer: true
          }
          const parc2 = {
            ['@id']: parcId0,
            name: 'p0-1',
            baseLayer: true
          }
          beforeEach(() => {

            mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
              templateSpaces: [
                tmpSp
              ],
              parcellations: [
                parc1,
                parc2
              ]
            })
          })
          it('> selects the first parc', () => {

            effect = TestBed.inject(ViewerStateHelperEffect)
            expect(
              effect.onRemoveAdditionalLayer$
            ).toBeObservable(
              hot('(a|)', {
                a: viewerStateHelperSelectParcellationWithId({
                  payload: parc1
                })
              })
            )
          })
        })

        describe('> if @version is available', () => {
          
          describe('> if there exist an entry without @next attribute', () => {
            
            const parc1 = {
              ['@id']: parcId0,
              name: 'p0-0',
              baseLayer: true,
              ['@version']: {
                ['@next']: 'random-value'
              }
            }
            const parc2 = {
              ['@id']: parcId0,
              name: 'p0-1',
              baseLayer: true,
              ['@version']: {
                ['@next']: null
              }
            }
            beforeEach(() => {

              mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
                templateSpaces: [
                  tmpSp
                ],
                parcellations: [
                  parc1,
                  parc2
                ]
              })
            })
            it('> selects the first one without @next attribute', () => {

              effect = TestBed.inject(ViewerStateHelperEffect)
              expect(
                effect.onRemoveAdditionalLayer$
              ).toBeObservable(
                hot('(a|)', {
                  a: viewerStateHelperSelectParcellationWithId({
                    payload: parc2
                  })
                })
              )
            })
          })
          describe('> if there exist no entry without @next attribute', () => {
            
            const parc1 = {
              ['@id']: parcId0,
              name: 'p0-0',
              baseLayer: true,
              ['@version']: {
                ['@next']: 'random-value'
              }
            }
            const parc2 = {
              ['@id']: parcId0,
              name: 'p0-1',
              baseLayer: true,
              ['@version']: {
                ['@next']: 'another-random-value'
              }
            }
            beforeEach(() => {

              mockStore.overrideSelector(viewerStateGetSelectedAtlas, {
                templateSpaces: [
                  tmpSp
                ],
                parcellations: [
                  parc1,
                  parc2
                ]
              })
            })
            it('> selects the first one without @next attribute', () => {

              effect = TestBed.inject(ViewerStateHelperEffect)
              expect(
                effect.onRemoveAdditionalLayer$
              ).toBeObservable(
                hot('(a|)', {
                  a: viewerStateHelperSelectParcellationWithId({
                    payload: parc1
                  })
                })
              )
            })
          })
        })
      })
    })
  })

  describe('> isNewerThan', () => {
    describe('> ill formed versions', () => {
      it('> in circular references, throws', () => {

        const parc0Circular = {

          "@version": {
            "@next": "aaa-bbb",
            "@this": "ccc-ddd",
            "name": "",
            "@previous": null,
          }
        }
        const parc1Circular = {
  
          "@version": {
            "@next": "ccc-ddd",
            "@this": "aaa-bbb",
            "name": "",
            "@previous": null,
          }
        }
        const p2 = {
          ["@id"]: "foo-bar"
        }
        const p3 = {
          ["@id"]: "baz"
        }
        expect(() => {
          isNewerThan([parc0Circular, parc1Circular], p2, p3)
        }).toThrow()
      })

      it('> if not found, will throw', () => {

        const parc0Circular = {

          "@version": {
            "@next": "aaa-bbb",
            "@this": "ccc-ddd",
            "name": "",
            "@previous": null,
          }
        }
        const parc1Circular = {
  
          "@version": {
            "@next": null,
            "@this": "aaa-bbb",
            "name": "",
            "@previous": null,
          }
        }
        const p2 = {
          ["@id"]: "foo-bar"
        }
        const p3 = {
          ["@id"]: "baz"
        }
        expect(() => {
          isNewerThan([parc0Circular, parc1Circular], p2, p3)
        }).toThrow()
      })
    })

    it('> works on well formed versions', () => {

      const parc0 = {
        "@version": {
          "@next": null,
          "@this": "aaa-bbb",
          "name": "",
          "@previous": "ccc-ddd",
        }
      }
      const parc1 = {
        "@version": {
          "@next": "aaa-bbb",
          "@this": "ccc-ddd",
          "name": "",
          "@previous": null,
        }
      }

      const p0 = {
        ['@id']: 'aaa-bbb'
      }
      const p1 = {
        ['@id']: 'ccc-ddd'
      }
      expect(
        isNewerThan([parc0, parc1], p0, p1)
      ).toBeTrue()
    })

  })
})