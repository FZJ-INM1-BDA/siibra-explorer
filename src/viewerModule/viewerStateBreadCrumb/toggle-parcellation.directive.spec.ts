import {async, ComponentFixture, TestBed} from "@angular/core/testing";
import {HarnessLoader} from "@angular/cdk/testing";
import {MockStore, provideMockStore} from "@ngrx/store/testing";
import {CommonModule} from "@angular/common";
import {AngularMaterialModule} from "src/sharedModules";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {ComponentsModule} from "src/components";
import {PureContantService, UtilModule} from "src/util";
import {Component} from "@angular/core";
import {ToggleParcellationDirective} from "src/viewerModule/viewerStateBreadCrumb/toggle-parcellation.directive";
import {NEHUBA_INSTANCE_INJTKN} from "src/viewerModule/nehuba/util";
import {BehaviorSubject} from "rxjs";

fdescribe('> toggle-parcellation.directive.ts', () => {
    describe('> ToggleParcellationDirective', () => {

        @Component({
            template: ''
        })
        class DummyCmp{}

        let fixture: ComponentFixture<DummyCmp>
        let loader: HarnessLoader
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
            mockNehubaViewer.updateUserLandmarks.calls.reset()
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
                    ToggleParcellationDirective,
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
              const el = fixture.debugElement.query(By.directive(ToggleParcellationDirective))
              const dir = el.injector.get(ToggleParcellationDirective) as ToggleParcellationDirective
              expect(dir).toBeTruthy()
          })

          it('> calls pureSvc.getViewerConfig', async () => {
              getViewerConfigSpy.and.returnValue({})
              const el = fixture.debugElement.query(By.directive(ToggleParcellationDirective))
              const dir = el.injector.get(ToggleParcellationDirective) as ToggleParcellationDirective
              await dir.toggleParcellation()
              expect(getViewerConfigSpy).toHaveBeenCalled()
          })

          describe('> if _flagDelin is true', () => {

            beforeEach(async () => {
              fixture.componentInstance['_flagDelin'] = true
              fixture.componentInstance['hiddenLayerNames'] = [
                'foo',
                'bar',
                'baz'
              ]

            })
            it('> go through all hideen layer names and set them to true', async () => {
              const el = fixture.debugElement.query(By.directive(ToggleParcellationDirective))
              const dir = el.injector.get(ToggleParcellationDirective) as ToggleParcellationDirective

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

              const el = fixture.debugElement.query(By.directive(ToggleParcellationDirective))
              const dir = el.injector.get(ToggleParcellationDirective) as ToggleParcellationDirective
              await dir.toggleParcellation()
              expect(fixture.componentInstance['hiddenLayerNames']).toEqual([])
            })
          })

          describe('> if _flagDelin is false', () => {
            let managedLayerSpyProp: jasmine.Spy
            let setVisibleSpy: jasmine.Spy
            beforeEach(() => {
              fixture.componentInstance['_flagDelin'] = false
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
            })

            it('> calls schedulRedraw', async () => {
              await fixture.componentInstance['toggleParcVsbl']()
              await new Promise(rs => requestAnimationFrame(rs))
              expect(mockNehubaViewer.nehubaViewer.ngviewer.display.scheduleRedraw).toHaveBeenCalled()
            })

            it('> only calls setVisible false on visible layers', async () => {
              await fixture.componentInstance['toggleParcVsbl']()
              expect(getLayerByNameSpy).toHaveBeenCalledTimes(2)

              for (const arg of ['foo', 'baz']) {
                expect(getLayerByNameSpy).toHaveBeenCalledWith(arg)
              }
              expect(setVisibleSpy).toHaveBeenCalledTimes(2)
              expect(setVisibleSpy).toHaveBeenCalledWith(false)
              expect(setVisibleSpy).not.toHaveBeenCalledWith(true)
            })

            it('> sets hiddenLayerNames correctly', async () => {
              await fixture.componentInstance['toggleParcVsbl']()
              expect(fixture.componentInstance['hiddenLayerNames']).toEqual(['foo', 'baz'])
            })
          })
        })

    })
})
