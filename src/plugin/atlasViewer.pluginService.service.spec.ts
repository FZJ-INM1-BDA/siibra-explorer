import { CommonModule } from "@angular/common"
import { HttpClientTestingModule, HttpTestingController } from "@angular/common/http/testing"
import { NgModule } from "@angular/core"
import { async, fakeAsync, TestBed, tick } from "@angular/core/testing"
import { MockStore, provideMockStore } from "@ngrx/store/testing"
import { ComponentsModule } from "src/components"
import { DialogService } from "src/services/dialogService.service"
import { selectorPluginCspPermission } from "src/services/state/userConfigState.helper"
import { AngularMaterialModule } from "src/sharedModules"
import { PureContantService } from "src/util"
import { APPEND_SCRIPT_TOKEN, REMOVE_SCRIPT_TOKEN } from "src/util/constants"
import { WidgetModule, WidgetServices } from "src/widget"
import { PluginServices } from "./atlasViewer.pluginService.service"
import { PluginModule } from "./plugin.module"
import { PluginUnit } from "./pluginUnit/pluginUnit.component"

const MOCK_PLUGIN_MANIFEST = {
  name: 'fzj.xg.MOCK_PLUGIN_MANIFEST',
  templateURL: 'http://localhost:10001/template.html',
  scriptURL: 'http://localhost:10001/script.js'
}

const spyfn = {
  appendSrc: jasmine.createSpy('appendSrc')
}



describe('> atlasViewer.pluginService.service.ts', () => {
  describe('> PluginServices', () => {
    
    let pluginService: PluginServices
    let httpMock: HttpTestingController
    let mockStore: MockStore
    
    beforeEach(async(() => {
      TestBed.configureTestingModule({
        imports: [
          AngularMaterialModule,
          CommonModule,
          WidgetModule,
          PluginModule,
          HttpClientTestingModule,
          ComponentsModule,
        ],
        providers: [
          provideMockStore(),
          PluginServices,
          {
            provide: APPEND_SCRIPT_TOKEN,
            useValue: spyfn.appendSrc
          },
          {
            provide: REMOVE_SCRIPT_TOKEN,
            useValue: () => Promise.resolve()
          },
          {
            provide: DialogService,
            useValue: {
              getUserConfirm: () => Promise.resolve()
            }
          },
          {
            provide: PureContantService,
            useValue: {
              backendUrl: `http://localhost:3000/`
            }
          }
        ]
      }).compileComponents().then(() => {
        
        httpMock = TestBed.inject(HttpTestingController)
        pluginService = TestBed.inject(PluginServices)
        mockStore = TestBed.inject(MockStore)
        pluginService.pluginViewContainerRef = {
          createComponent: () => {
            return {
              onDestroy: () => {},
              instance: {
                elementRef: {
                  nativeElement: {
                    append: () => {}
                  }
                }
              }
            }
          }
        } as any

        httpMock.expectOne('http://localhost:3000/plugins/manifests').flush('[]')

        const widgetService = TestBed.inject(WidgetServices)
        /**
         * widget service floatingcontainer not inst in this circumstance
         * TODO fix widget service tests importing widget service are not as flaky
         */
        widgetService.addNewWidget = () => {
          return {} as any
        }
      })
    }))

    afterEach(() => {
      spyfn.appendSrc.calls.reset()
      const ctrl = TestBed.inject(HttpTestingController)
      ctrl.verify()
    })

    it('> service can be inst', () => {
      expect(pluginService).toBeTruthy()
    })

    it('expectOne is working as expected', done => {
      
      pluginService.fetch('test')
        .then(text => {
          expect(text).toEqual('bla')
          done()
        })
      httpMock.expectOne('test').flush('bla')
        
    })

    /**
     * need to consider user confirmation on csp etc
     */
    describe('#launchPlugin', () => {

      beforeEach(() => {
        mockStore.overrideSelector(selectorPluginCspPermission, { value: false })
      })

      describe('> basic fetching functionality', () => {
        it('> fetches templateURL and scriptURL properly', fakeAsync(() => {
          
          pluginService.launchPlugin({...MOCK_PLUGIN_MANIFEST})

          tick(100)
          
          const mockTemplate = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.templateURL)
          mockTemplate.flush('hello world')
          
          tick(100)
          
          expect(spyfn.appendSrc).toHaveBeenCalledTimes(1)
          expect(spyfn.appendSrc).toHaveBeenCalledWith(MOCK_PLUGIN_MANIFEST.scriptURL)
          
        }))

        it('> template overrides templateURL', fakeAsync(() => {
          pluginService.launchPlugin({
            ...MOCK_PLUGIN_MANIFEST,
            template: ''
          })

          tick(20)
          httpMock.expectNone(MOCK_PLUGIN_MANIFEST.templateURL)
        }))

        it('> script with scriptURL throws', done => {
          pluginService.launchPlugin({
            ...MOCK_PLUGIN_MANIFEST,
            script: '',
            scriptURL: null
          })
            .then(() => {
              /**
               * should not pass
               */
              expect(true).toEqual(false)
            })
            .catch(e => {
              done()
            })
          
          /**
           * http call will not be made, as rejection happens by Promise.reject, while fetch call probably happens at the next event cycle
           */
          httpMock.expectNone(MOCK_PLUGIN_MANIFEST.templateURL)
        })
      
        describe('> user permission', () => {
          let userConfirmSpy: jasmine.Spy
          let readyPluginSpy: jasmine.Spy
          let cspManifest = {
            ...MOCK_PLUGIN_MANIFEST,
            csp: {
              'connect-src': [`'unsafe-eval'`]
            }
          }
          afterEach(() => {
            userConfirmSpy.calls.reset()
            readyPluginSpy.calls.reset()
          })
          beforeEach(() => {
            readyPluginSpy = spyOn(pluginService, 'readyPlugin').and.callFake(() => Promise.reject())
            const dialogService = TestBed.inject(DialogService)
            userConfirmSpy = spyOn(dialogService, 'getUserConfirm')
          })

          describe('> if user permission has been given', () => {
            beforeEach(fakeAsync(() => {
              mockStore.overrideSelector(selectorPluginCspPermission, { value: true })
              userConfirmSpy.and.callFake(() => Promise.reject())
              pluginService.launchPlugin({
                ...cspManifest
              }).catch(() => {
                /**
                 * expecting to throw because call fake returning promise.reject in beforeEach
                 */
              })
              tick(20)
            }))
            it('> will not ask for permission', () => {
              expect(userConfirmSpy).not.toHaveBeenCalled()
            })

            it('> will call ready plugin', () => {
              expect(readyPluginSpy).toHaveBeenCalled()
            })
          })

          describe('> if user permission has not yet been given', () => {
            beforeEach(() => {
              mockStore.overrideSelector(selectorPluginCspPermission, { value: false })
            })
            describe('> user permission', () => {
              beforeEach(fakeAsync(() => {
                pluginService.launchPlugin({
                  ...cspManifest
                }).catch(() => {
                  /**
                   * expecting to throw because call fake returning promise.reject in beforeEach
                   */
                })
                tick(40)
              }))
              it('> will be asked for', () => {
                expect(userConfirmSpy).toHaveBeenCalled()
              })
            })

            describe('> if user accepts', () => {
              beforeEach(fakeAsync(() => {
                userConfirmSpy.and.callFake(() => Promise.resolve())

                pluginService.launchPlugin({
                  ...cspManifest
                }).catch(() => {
                  /**
                   * expecting to throw because call fake returning promise.reject in beforeEach
                   */
                })
              }))
              it('> calls /POST user/pluginPermissions', () => {
                httpMock.expectOne({
                  method: 'POST',
                  url: 'http://localhost:3000/user/pluginPermissions'
                })
              })
            })

            describe('> if user declines', () => {

              beforeEach(fakeAsync(() => {
                userConfirmSpy.and.callFake(() => Promise.reject())

                pluginService.launchPlugin({
                  ...cspManifest
                }).catch(() => {
                  /**
                   * expecting to throw because call fake returning promise.reject in beforeEach
                   */
                })
              }))
              it('> calls /POST user/pluginPermissions', () => {
                httpMock.expectNone({
                  method: 'POST',
                  url: 'http://localhost:3000/user/pluginPermissions'
                })
              })
            })
          })
        })
      })

      describe('> racing slow connection when launching plugin', () => {
        it('> when template/script has yet been fetched, repeated launchPlugin should not result in repeated fetching', fakeAsync(() => {

          expect(pluginService.pluginIsLaunching(MOCK_PLUGIN_MANIFEST.name)).toBeFalsy()
          expect(pluginService.pluginHasLaunched(MOCK_PLUGIN_MANIFEST.name)).toBeFalsy()
          pluginService.launchPlugin({...MOCK_PLUGIN_MANIFEST})
          pluginService.launchPlugin({...MOCK_PLUGIN_MANIFEST})
          tick(20)
          const req = httpMock.expectOne(MOCK_PLUGIN_MANIFEST.templateURL)
          req.flush('baba')
          tick(20)
          expect(spyfn.appendSrc).toHaveBeenCalledTimes(1)

          expect(
            pluginService.pluginIsLaunching(MOCK_PLUGIN_MANIFEST.name) ||
            pluginService.pluginHasLaunched(MOCK_PLUGIN_MANIFEST.name)
          ).toBeTruthy()
        }))
      })
    
    })
  })
})
