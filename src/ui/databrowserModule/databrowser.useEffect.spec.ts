// TODO reenable test
// when injecting DataBrowserUseEffect, referenceError: defaultState is not defined error was thrown

// import { DataBrowserUseEffect } from './databrowser.useEffect'
// import { TestBed, async } from '@angular/core/testing'
// import { AngularMaterialModule } from '../sharedModules/angularMaterial.module'
// import { Observable } from 'rxjs'
// import { provideMockActions } from '@ngrx/effects/testing'
// import { provideMockStore } from '@ngrx/store/testing'
// import { defaultRootState } from 'src/services/stateStore.service'
// import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing'
// import { DatabrowserModule } from './databrowser.module'
// import { hot } from 'jasmine-marbles'
// import { KgSingleDatasetService } from './singleDataset/singleDataset.base'

// describe('databrowser.useEffect.spec.ts', () => {

//   it("fails", () => {
//     expect(true).toEqual(true)
//   })
//   describe('DataBrowserUseEffect', () => {
//     let actions$: Observable<any>
//     beforeEach(async(() => {
//       TestBed.configureTestingModule({
//         providers: [
//           DataBrowserUseEffect,
//           provideMockActions(() => actions$),
//           provideMockStore({ initialState: defaultRootState })
//         ]
//       }).compileComponents()
//     }))

//     afterEach(() => {
//       const ctrl = TestBed.inject(HttpTestingController)
//       ctrl.verify()
//     })

//     describe('storePreviewDatasetFile$', () => {
//       it('on init, emit []', () => {
//         // const effect = TestBed.inject(DataBrowserUseEffect)
//         // expect(
//         //   (effect as any).storePreviewDatasetFile$ as Observable<any>
//         // ).toBeObservable(
//         //   hot(
//         //     'a',
//         //     {
//         //       a: []
//         //     }
//         //   )
//         // )
        
//       })
//       // it('on datasetPreviews change, kgSingleDatasetService.getInfoFromKg gets called', () => {
//       //   const store = TestBed.get(Store)
//       //   const copiedState = JSON.parse(JSON.stringify( defaultRootState ))
//       // })
//     })
//     describe('previewRegisteredVolumes$', () => {

//     })
//   })
// })