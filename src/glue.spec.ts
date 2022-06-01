import { ClickInterceptorService } from "./glue"
import { getRandomHex } from 'common/util'

const mockActionOnSpyReturnVal0 = { 
  id: getRandomHex(),
  matDialogRef: {
    componentInstance: {
      untouchedIndex: 0
    }
  }
}
const mockActionOnSpyReturnVal1 = { 
  id: getRandomHex(),
  matDialogRef: {
    componentInstance: {
      untouchedIndex: 0
    }
  }
}
let actionOnWidgetSpy

const nifti = {
  mimetype: "application/nifti",
  url: "http://abc.xyz",
  referenceSpaces: [],
  volumeMetadata: {
    min: 0.1,
    max: 0.45,
    colormap: 'viridis'
  },
  name: 'helloworld',
  filename: 'foobar'
}

const chart = {
  mimetype: "application/json",
  data: {
    "chart.js": {
      type: "radar"
    }
  },
  referenceSpaces: []
}

const region0 = {
  name: 'region0',
  originDatasets: [{
    kgId: getRandomHex(),
    kgSchema: 'minds/core/dataset/v1.0.0',
    filename: getRandomHex()
  }]
}

const region1 = {
  name: 'name',
  originDatasets: [{
    kgId: getRandomHex(),
    kgSchema: 'minds/core/dataset/v1.0.0',
    filename: getRandomHex()
  }]
}

const file1 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const file2 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const file3 = {
  datasetId: getRandomHex(),
  filename: getRandomHex()
}

const dataset1 = {
  fullId: 'minds/core/dataset/v1.0.0/aaa-bbb-ccc-000'
}

describe('> glue.ts', () => {

  describe('> ClickInterceptorService', () => {
    /**
     * TODO finish writing the test for ClickInterceptorService
     */
    let interceptorService: ClickInterceptorService

    beforeEach(() => {
      interceptorService = new ClickInterceptorService()
    })

    describe('> # callRegFns', () => {
      let spy1: jasmine.Spy,
        spy2: jasmine.Spy,
        spy3: jasmine.Spy
      beforeEach(() => {
        spy1 = jasmine.createSpy('spy1')
        spy2 = jasmine.createSpy('spy2')
        spy3 = jasmine.createSpy('spy3')
        interceptorService['callbacks'] = [
          spy1,
          spy2,
          spy3,
        ]
        spy1.and.returnValue(true)
        spy2.and.returnValue(true)
        spy3.and.returnValue(true)
      })
      it('> fns are all called', () => {

        interceptorService.callRegFns('stuff')
        expect(spy1).toHaveBeenCalled()
        expect(spy2).toHaveBeenCalled()
        expect(spy3).toHaveBeenCalled()
      })
      it('> will run fns from first idx to last idx', () => {

        interceptorService.callRegFns('stuff')
        expect(spy1).toHaveBeenCalledBefore(spy2)
        expect(spy2).toHaveBeenCalledBefore(spy3)
      })
      it('> will stop at when next is not called', () => {

        spy2.and.returnValue(false)
        interceptorService.callRegFns('stuff')

        expect(spy1).toHaveBeenCalled()
        expect(spy2).toHaveBeenCalled()
        expect(spy3).not.toHaveBeenCalled()
      })
    })
  })
})
