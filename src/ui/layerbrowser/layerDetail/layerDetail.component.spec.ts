import { LayerDetailComponent, VIEWER_INJECTION_TOKEN } from './layerDetail.component'
import { async, TestBed } from '@angular/core/testing'
import { NgLayersService } from '../ngLayerService.service'
import { By } from '@angular/platform-browser'
import * as CONSTANT from 'src/util/constants'
import { AngularMaterialModule } from 'src/sharedModules'
import { CommonModule } from '@angular/common'
import { FormsModule, ReactiveFormsModule } from '@angular/forms'

const getSpies = (service: NgLayersService) => {
  const lowThMapGetSpy = spyOn(service.lowThresholdMap, 'get').and.callThrough()
  const highThMapGetSpy = spyOn(service.highThresholdMap, 'get').and.callThrough()
  const brightnessMapGetSpy = spyOn(service.brightnessMap, 'get').and.callThrough()
  const contractMapGetSpy = spyOn(service.contrastMap, 'get').and.callThrough()
  const removeBgMapGetSpy = spyOn(service.removeBgMap, 'get').and.callThrough()

  const lowThMapSetSpy = spyOn(service.lowThresholdMap, 'set').and.callThrough()
  const highThMapSetSpy = spyOn(service.highThresholdMap, 'set').and.callThrough()
  const brightnessMapSetSpy = spyOn(service.brightnessMap, 'set').and.callThrough()
  const contrastMapSetSpy = spyOn(service.contrastMap, 'set').and.callThrough()
  const removeBgMapSetSpy = spyOn(service.removeBgMap, 'set').and.callThrough()

  return {
    lowThMapGetSpy,
    highThMapGetSpy,
    brightnessMapGetSpy,
    contractMapGetSpy,
    removeBgMapGetSpy,
    lowThMapSetSpy,
    highThMapSetSpy,
    brightnessMapSetSpy,
    contrastMapSetSpy,
    removeBgMapSetSpy,
  }
}

const getCtrl = () => {
  const lowThSlider = By.css('mat-slider[aria-label="Set lower threshold"]')
  const highThSlider = By.css('mat-slider[aria-label="Set higher threshold"]')
  const brightnessSlider = By.css('mat-slider[aria-label="Set brightness"]')
  const contrastSlider = By.css('mat-slider[aria-label="Set contrast"]')
  const removeBgSlideToggle = By.css('mat-slide-toggle[aria-label="Remove background"]')
  return {
    lowThSlider,
    highThSlider,
    brightnessSlider,
    contrastSlider,
    removeBgSlideToggle,
  }
}

const getSliderChangeTest = ctrlName => describe(`testing: ${ctrlName}`, () => {

  it('on change, calls window', () => {
    const service = TestBed.inject(NgLayersService)
    const spies = getSpies(service)
    
    const fixture = TestBed.createComponent(LayerDetailComponent)
    const layerName = `hello-kitty`
    fixture.componentInstance.layerName = layerName
    const triggerChSpy = spyOn(fixture.componentInstance, 'triggerChange')
    const ctrls = getCtrl()
    
    const sLower = fixture.debugElement.query( ctrls[`${ctrlName}Slider`] )
    sLower.componentInstance.input.emit({ value: 0.5 })
    expect(spies[`${ctrlName}MapSetSpy`]).toHaveBeenCalledWith(layerName, 0.5)
    expect(triggerChSpy).toHaveBeenCalled()
  })
})

const fragmentMainSpy = {
  value: `test value`,
  restoreState: () => {}
}

const defaultViewer = {
  layerManager: {
    getLayerByName: jasmine.createSpy('getLayerByName').and.returnValue({layer: {fragmentMain: fragmentMainSpy}})
  }
}

describe('> layerDetail.component.ts', () => {
  describe('> LayerDetailComponent', () => {

    beforeEach(async(() => {
      TestBed.configureTestingModule({
        declarations: [
          LayerDetailComponent
        ],
        imports: [
          AngularMaterialModule,
          CommonModule,
          FormsModule,
          ReactiveFormsModule,
        ],
        providers: [
          NgLayersService,
          {
            provide: VIEWER_INJECTION_TOKEN,
            useValue: defaultViewer
          }
        ]
      }).compileComponents()
    }))

    describe('> basic funcitonalities', () => {

      it('> it should be created', () => {
        const fixture = TestBed.createComponent(LayerDetailComponent)
        const element = fixture.debugElement.componentInstance
        expect(element).toBeTruthy()
      })
  
      it('> on bind input, if input is truthy, calls get on layerService maps', () => {
        const service = TestBed.inject(NgLayersService)
        TestBed.overrideProvider(VIEWER_INJECTION_TOKEN, {
          useValue: {}
        })
        const {
          brightnessMapGetSpy,
          contractMapGetSpy,
          highThMapGetSpy,
          lowThMapGetSpy,
          removeBgMapGetSpy
        } = getSpies(service)
  
        const layerName = `hello-kitty`
        const fixture = TestBed.createComponent(LayerDetailComponent)
        fixture.componentInstance.layerName = layerName
        fixture.componentInstance.ngOnChanges()
        fixture.detectChanges()
        expect(brightnessMapGetSpy).toHaveBeenCalledWith(layerName)
        expect(contractMapGetSpy).toHaveBeenCalledWith(layerName)
        expect(highThMapGetSpy).toHaveBeenCalledWith(layerName)
        expect(lowThMapGetSpy).toHaveBeenCalledWith(layerName)
        expect(removeBgMapGetSpy).toHaveBeenCalledWith(layerName)
      })
  
      it('> on bind input, if input is falsy, does not call layerService map get', () => {
        const service = TestBed.inject(NgLayersService)
        const {
          brightnessMapGetSpy,
          contractMapGetSpy,
          highThMapGetSpy,
          lowThMapGetSpy,
          removeBgMapGetSpy
        } = getSpies(service)
  
        const layerName = null
        const fixture = TestBed.createComponent(LayerDetailComponent)
        fixture.componentInstance.layerName = layerName
        fixture.componentInstance.ngOnChanges()
        fixture.detectChanges()
        expect(brightnessMapGetSpy).not.toHaveBeenCalled()
        expect(contractMapGetSpy).not.toHaveBeenCalled()
        expect(highThMapGetSpy).not.toHaveBeenCalled()
        expect(lowThMapGetSpy).not.toHaveBeenCalled()
        expect(removeBgMapGetSpy).not.toHaveBeenCalled()
      })
  
    })

    const testingSlidersCtrl = [
      'lowTh',
      'highTh',
      'brightness',
      'contrast',
    ]

    for (const sliderCtrl of testingSlidersCtrl ) {
      getSliderChangeTest(sliderCtrl)
    }

    describe('testing: removeBG toggle', () => {
      it('on change, calls window', () => {

        const service = TestBed.inject(NgLayersService)
        const { removeBgMapSetSpy } = getSpies(service)
        
        const fixture = TestBed.createComponent(LayerDetailComponent)
        const triggerChSpy = spyOn(fixture.componentInstance, 'triggerChange')
        const layerName = `hello-kitty`
        fixture.componentInstance.layerName = layerName

        const { removeBgSlideToggle } = getCtrl()
        const bgToggle = fixture.debugElement.query( removeBgSlideToggle )
        bgToggle.componentInstance.change.emit({ checked: true })
        expect(removeBgMapSetSpy).toHaveBeenCalledWith('hello-kitty', true)
        expect(triggerChSpy).toHaveBeenCalled()

        removeBgMapSetSpy.calls.reset()
        triggerChSpy.calls.reset()
        expect(removeBgMapSetSpy).not.toHaveBeenCalled()
        expect(triggerChSpy).not.toHaveBeenCalled()

        bgToggle.componentInstance.change.emit({ checked: false })

        expect(removeBgMapSetSpy).toHaveBeenCalledWith('hello-kitty', false)
        expect(triggerChSpy).toHaveBeenCalled()
      })
    })

    describe('triggerChange', () => {
      it('should throw if viewer is not defined', () => {
        TestBed.overrideProvider(VIEWER_INJECTION_TOKEN, {
          useValue: null
        })
        const fixutre = TestBed.createComponent(LayerDetailComponent)
        expect(function(){
          fixutre.componentInstance.triggerChange()
        }).toThrowError('viewer is not defined')
      })

      it('should throw if layer is not found', () => {
        const fakeGetLayerByName = jasmine.createSpy().and.returnValue(undefined)
        const fakeNgInstance = {
          layerManager: {
            getLayerByName: fakeGetLayerByName
          }
        }

        TestBed.overrideProvider(VIEWER_INJECTION_TOKEN, {
          useValue: fakeNgInstance
        })

        const fixutre = TestBed.createComponent(LayerDetailComponent)
        const layerName = `test-kitty`

        fixutre.componentInstance.layerName = layerName

        expect(function(){
          fixutre.componentInstance.triggerChange()
        }).toThrowError(`layer with name: ${layerName}, not found.`)
      })

      it('should throw if layer.layer.fragmentMain is undefined', () => {
        const layerName = `test-kitty`

        const fakeLayer = {
          hello: 'world'
        }
        const fakeGetLayerByName = jasmine.createSpy().and.returnValue(fakeLayer)
        const fakeNgInstance = {
          layerManager: {
            getLayerByName: fakeGetLayerByName
          }
        }

        TestBed.overrideProvider(VIEWER_INJECTION_TOKEN, {
          useValue: fakeNgInstance
        })

        const fixutre = TestBed.createComponent(LayerDetailComponent)

        fixutre.componentInstance.layerName = layerName

        expect(function(){
          fixutre.componentInstance.triggerChange()
        }).toThrowError(`layer.fragmentMain is not defined... is this an image layer?`)
      })

      it('should call getShader and restoreState if all goes right', () => {

        const replacementShader = `blabla ahder`
        const getShaderSpy = jasmine.createSpy('getShader').and.returnValue(replacementShader)
        spyOnProperty(CONSTANT, 'getShader').and.returnValue(getShaderSpy)
        
        const layerName = `test-kitty`

        const fakeRestoreState = jasmine.createSpy('fakeGetLayerByName')
        const fakeLayer = {
          layer: {
            fragmentMain: {
              restoreState: fakeRestoreState
            }
          }
        }
        const fakeGetLayerByName = jasmine.createSpy('fakeGetLayerByName').and.returnValue(fakeLayer)
        const fakeNgInstance = {
          layerManager: {
            getLayerByName: fakeGetLayerByName
          }
        }
        TestBed.overrideProvider(VIEWER_INJECTION_TOKEN, {
          useValue: fakeNgInstance
        })
        
        const fixutre = TestBed.createComponent(LayerDetailComponent)
        fixutre.componentInstance.layerName = layerName
        fixutre.detectChanges()

        fixutre.componentInstance.triggerChange()
        
        expect(fakeGetLayerByName).toHaveBeenCalledWith(layerName)
        expect(getShaderSpy).toHaveBeenCalled()
        expect(fakeRestoreState).toHaveBeenCalledWith(replacementShader)
      })
    })
  })
})