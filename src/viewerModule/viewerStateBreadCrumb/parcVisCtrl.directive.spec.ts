import {ComponentFixture, TestBed} from "@angular/core/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {CommonModule} from "@angular/common";
import {AngularMaterialModule} from "src/sharedModules";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ComponentsModule} from "src/components";
import {PureContantService, UtilModule} from "src/util";
import {Component} from "@angular/core";
import {ParcVisCtrlDirective} from "src/viewerModule/viewerStateBreadCrumb/parcVisCtrl.directive";
import {NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {BehaviorSubject} from "rxjs";
import {By} from "@angular/platform-browser";
import {
    viewerStateSelectedParcellationSelector,
    viewerStateSelectedTemplatePureSelector
} from "src/services/state/viewerState/selectors";

describe('> parcVisCtrl.directive.ts', () => {
    describe('> ParcVisCtrlDirective', () => {

        @Component({
            template: ''
        })
        class DummyCmp{}

        let fixture: ComponentFixture<DummyCmp>
        let mockStore: MockStore

        let mockNehubaViewer = {
            updateUserLandmarks: jasmine.createSpy(),
            nehubaViewer: {
                ngviewer: {
                    layerManager: {
                        getLayerByName: jasmine.createSpy('getLayerByName'),
                        get managedLayers() {
                            return []
                        },
                        set managedLayers(val) {
                            return
                        }
                    },
                    display: {
                        scheduleRedraw: jasmine.createSpy('scheduleRedraw')
                    }
                }
            }
        }


        afterEach(() => {
            mockNehubaViewer.nehubaViewer.ngviewer.layerManager.getLayerByName.calls.reset()
            mockNehubaViewer.nehubaViewer.ngviewer.display.scheduleRedraw.calls.reset()
        })

        beforeEach(() => {
            TestBed.configureTestingModule({
                imports: [
                    CommonModule,
                    AngularMaterialModule,
                    FormsModule,
                    ReactiveFormsModule,
                    ComponentsModule,
                    UtilModule,
                ],
                declarations: [
                    ParcVisCtrlDirective,
                    DummyCmp
                ],
                providers: [
                    provideMockStore(),
                    {
                        provide: NEHUBA_INSTANCE_INJTKN,
                        useFactory: () => {
                            return new BehaviorSubject(mockNehubaViewer).asObservable()
                        }
                    },
                    {
                        provide: PureContantService,
                        useFactory: () => {
                            return {
                                getViewerConfig: jasmine.createSpy('getViewerConfig')
                            }
                        }
                    }
                ]
            }).overrideComponent(DummyCmp, {
                set: {
                    template: `<div s-xplr-parc-vis-ctrl></div>`
                }
            }).compileComponents()

        })




        beforeEach(() => {
            mockStore = TestBed.inject(MockStore)
            mockStore.overrideSelector(viewerStateSelectedTemplatePureSelector, {})
            mockStore.overrideSelector(viewerStateSelectedParcellationSelector, {})
        })

        describe('> toggleParcVsbl', () => {
          let getViewerConfigSpy: jasmine.Spy
          let getLayerByNameSpy: jasmine.Spy

          beforeEach(() => {
            const pureCstSvc = TestBed.inject(PureContantService)
            getViewerConfigSpy = pureCstSvc.getViewerConfig as jasmine.Spy
            getLayerByNameSpy = mockNehubaViewer.nehubaViewer.ngviewer.layerManager.getLayerByName
            fixture = TestBed.createComponent(DummyCmp)
            fixture.detectChanges()
          })

          it('> can be inited', () => {

              const fixture = TestBed.createComponent(DummyCmp)
              fixture.detectChanges()
              const el = fixture.debugElement.query(By.directive(ParcVisCtrlDirective))
              const dir = el.injector.get(ParcVisCtrlDirective) as ParcVisCtrlDirective
              expect(dir).toBeTruthy()
          })

          it('> calls pureSvc.getViewerConfig', async () => {
              getViewerConfigSpy.and.returnValue({})
              const el = fixture.debugElement.query(By.directive(ParcVisCtrlDirective))
              const dir = el.injector.get(ParcVisCtrlDirective) as ParcVisCtrlDirective
              await dir.toggleParcellation()
              expect(getViewerConfigSpy).toHaveBeenCalled()
          })

          describe('> if visible is true', () => {
            let el
            let dir

            beforeEach(async () => {
                el = fixture.debugElement.query(By.directive(ParcVisCtrlDirective))
                dir = el.injector.get(ParcVisCtrlDirective) as ParcVisCtrlDirective
                dir.visible = false
                dir.hiddenLayerNames = ['foo', 'bar', 'baz']
                getViewerConfigSpy.and.resolveTo({
                    'foo': {},
                    'bar': {},
                    'baz': {}
                })

                const pureCstSvc = TestBed.inject(PureContantService)
                getLayerByNameSpy = mockNehubaViewer.nehubaViewer.ngviewer.layerManager.getLayerByName
                getViewerConfigSpy = pureCstSvc.getViewerConfig as jasmine.Spy


            })
            it('> go through all hideen layer names and set them to true', async () => {
              const setVisibleSpy = jasmine.createSpy('setVisible')
              getLayerByNameSpy.and.returnValue({
                setVisible: setVisibleSpy
              })

              await dir.toggleParcellation()

              expect(getLayerByNameSpy).toHaveBeenCalledTimes(3)

              for (const arg of ['foo', 'bar', 'baz']) {
                expect(getLayerByNameSpy).toHaveBeenCalledWith(arg)
              }
              expect(setVisibleSpy).toHaveBeenCalledTimes(3)
              expect(setVisibleSpy).toHaveBeenCalledWith(true)
              expect(setVisibleSpy).not.toHaveBeenCalledWith(false)
            })
            it('> hiddenLayerNames resets', async () => {

              const el = fixture.debugElement.query(By.directive(ParcVisCtrlDirective))
              const dir = el.injector.get(ParcVisCtrlDirective) as ParcVisCtrlDirective
              await dir.toggleParcellation()
              expect(dir.hiddenLayerNames).toEqual([])
            })
          })

          describe('> if visible is false', () => {
            let managedLayerSpyProp: jasmine.Spy
            let setVisibleSpy: jasmine.Spy
            let dir
            beforeEach(() => {
              const el = fixture.debugElement.query(By.directive(ParcVisCtrlDirective))
              dir = el.injector.get(ParcVisCtrlDirective) as ParcVisCtrlDirective
              dir.visible = false
              dir.hiddenLayerNames = [
                  'foo',
                  'baz'
              ]

              setVisibleSpy = jasmine.createSpy('setVisible')
              getLayerByNameSpy.and.returnValue({
                setVisible: setVisibleSpy
              })
              getViewerConfigSpy.and.resolveTo({
                'foo': {},
                'bar': {},
                'baz': {}
              })
              managedLayerSpyProp = spyOnProperty(mockNehubaViewer.nehubaViewer.ngviewer.layerManager, 'managedLayers')
              managedLayerSpyProp.and.returnValue([{
                visible: true,
                name: 'foo'
              }, {
                visible: false,
                name: 'bar'
              }, {
                visible: true,
                name: 'baz'
              }])
            })

            afterEach(() => {
              managedLayerSpyProp.calls.reset()
              dir.visible = false
              dir.hiddenLayerNames = [
                  'foo',
                  'baz'
              ]
            })

            // it('> calls schedulRedraw', async () => {
            //   // await dir.toggleParcellation()
            //   await new Promise(rs => requestAnimationFrame(rs))
            //   expect(mockNehubaViewer.nehubaViewer.ngviewer.display.scheduleRedraw).toHaveBeenCalled()
            // })

            it('> only calls setVisible false on visible layers', async () => {

              await dir.toggleParcellation()
              expect(getLayerByNameSpy).toHaveBeenCalledTimes(2)

              for (const arg of ['foo', 'baz']) {
                expect(getLayerByNameSpy).toHaveBeenCalledWith(arg)
              }
              expect(setVisibleSpy).toHaveBeenCalledTimes(2)
              expect(setVisibleSpy).toHaveBeenCalledWith(true)
              expect(setVisibleSpy).not.toHaveBeenCalledWith(false)
            })

            it('> sets hiddenLayerNames correctly', async () => {
                expect(dir.hiddenLayerNames).toEqual(['foo', 'baz'])
            })

          })
        })

    })
})
