import { async, TestBed } from "@angular/core/testing"
import { PluginFactoryDirective, REGISTER_PLUGIN_FACTORY_DIRECTIVE } from "./pluginFactory.directive"
import { Component, ViewChild } from "@angular/core"
import { APPEND_SCRIPT_TOKEN, REMOVE_SCRIPT_TOKEN } from "src/util/constants"
import { By } from "@angular/platform-browser"

@Component({
  template: '<div></div>'
})
class TestCmp{

  @ViewChild(PluginFactoryDirective) pfd: PluginFactoryDirective
}

const dummyObj1 = {}
const dummyObj2 = {}
const appendSrcSpy = jasmine.createSpy('appendSrc').and.returnValues(
  Promise.resolve(dummyObj1),
  Promise.resolve(dummyObj2)
)
const removeSrcSpy = jasmine.createSpy('removeScript')
const registerSpy = jasmine.createSpy('registerSpy')

describe(`> pluginFactory.directive.ts`, () => {
  describe(`> PluginFactoryDirective`, () => {

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          PluginFactoryDirective,
          TestCmp
        ],
        providers: [
          {
            provide: APPEND_SCRIPT_TOKEN,
            useValue: appendSrcSpy
          },
          {
            provide: REMOVE_SCRIPT_TOKEN,
            useValue: removeSrcSpy
          },
          {
            provide: REGISTER_PLUGIN_FACTORY_DIRECTIVE,
            useValue: registerSpy
          }
        ]
      }).overrideComponent(TestCmp, {
        set: {
          template: `<div pluginFactoryDirective></div>`
        }
      }).compileComponents()
    }))

    afterEach(() => {
      appendSrcSpy.calls.reset()
      removeSrcSpy.calls.reset()
      registerSpy.calls.reset()
    })

    it('> creates directive', () => {
      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()

      const queriedDirective = fixture.debugElement.query( By.directive(PluginFactoryDirective) )
      expect(queriedDirective).toBeTruthy()
    })

    it('> register spy is called', () => {
      
      const fixture = TestBed.createComponent(TestCmp)
      fixture.detectChanges()
      expect(registerSpy).toHaveBeenCalledWith(fixture.componentInstance.pfd)
    })

    describe('> loading external libraries', () => {
      it('> load once, call append script', async () => {
        const fixture = TestBed.createComponent(TestCmp)
        fixture.detectChanges()
        const pfd = fixture.componentInstance.pfd
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        expect(appendSrcSpy).toHaveBeenCalledWith('https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js')
        expect(appendSrcSpy).toHaveBeenCalledTimes(1)
      })

      it('> load twice, called append script once', async () => {
        const fixture = TestBed.createComponent(TestCmp)
        fixture.detectChanges()
        const pfd = fixture.componentInstance.pfd
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        expect(appendSrcSpy).toHaveBeenCalledWith('https://cdn.jsdelivr.net/npm/vue@2.5.16/dist/vue.js')
        expect(appendSrcSpy).toHaveBeenCalledTimes(1)
      })

      it('> load unload, call remove script once', async () => {
        
        const fixture = TestBed.createComponent(TestCmp)
        fixture.detectChanges()
        const pfd = fixture.componentInstance.pfd
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        pfd.unloadExternalLibraries(['vue@2.5.16'])
        expect(removeSrcSpy).toHaveBeenCalledTimes(1)
      })

      it('> load twice, unload, does not call remove', async () => {

        const fixture = TestBed.createComponent(TestCmp)
        fixture.detectChanges()
        const pfd = fixture.componentInstance.pfd
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        pfd.unloadExternalLibraries(['vue@2.5.16'])
        expect(removeSrcSpy).not.toHaveBeenCalled()
      })

      it('> load, unload, load, call append script twice', async () => {
        
        const fixture = TestBed.createComponent(TestCmp)
        fixture.detectChanges()
        const pfd = fixture.componentInstance.pfd
        await pfd.loadExternalLibraries(['vue@2.5.16'])
        pfd.unloadExternalLibraries(['vue@2.5.16'])

        appendSrcSpy.calls.reset()
        expect(appendSrcSpy).not.toHaveBeenCalled()

        await pfd.loadExternalLibraries(['vue@2.5.16'])
        pfd.unloadExternalLibraries(['vue@2.5.16'])
        expect(appendSrcSpy).toHaveBeenCalledTimes(1)
      })
    })
  })
})