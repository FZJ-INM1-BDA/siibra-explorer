import * as util from 'common/util'
import { getRgb } from './layerCtrl.util'

describe('> layerCtrl.util.ts', () => {
  describe('> #getRgb', () => {
    let strToRgbSpy: jasmine.Spy
    let strToRgbValue: [number, number, number]
    beforeEach(() => {
      strToRgbSpy = spyOn(util, 'strToRgb')
      strToRgbValue = [1,2,3]
      strToRgbSpy.and.returnValue(strToRgbValue)
    })

    describe('> region has rgb defined', () => {
      const labelIndex = 1020
      const region = {
        ngId: 'foo-bar',
        rgb: [100, 200, 255] as [number, number, number]
      }
      it('> should return region rgb', () => {
        expect(
          getRgb(labelIndex, region)
        ).toEqual({
          red: 100,
          green: 200,
          blue: 255
        })
      })
    })

    describe('> if region does not have rgb defined', () => {
      describe('> if labelIndex > 65500', () => {
        const region = {
          ngId: 'foo-bar',
        }
        const labelIndex = 65535
        it('> should return white', () => {
          expect(
            getRgb(labelIndex, region)
          ).toEqual({
            red: 255,
            green: 255,
            blue: 255
          })
        })
      })

      describe('> otherwise', () => {
        const region = {
          ngId: 'foo-bar',
        }
        const labelIndex = 12
        it('> should call strToRgb', () => {
          getRgb(labelIndex, region)
          expect(strToRgbSpy).toHaveBeenCalledWith(`${region.ngId}${labelIndex}`)
        })

        it('> returns what strToRgb returns', () => {
          expect(
            getRgb(labelIndex, region)
          ).toEqual({
            red: 1,
            green: 2,
            blue: 3
          })
        })
      })
    })
  })
})