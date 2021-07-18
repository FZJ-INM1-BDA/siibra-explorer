import { selectorPluginCspPermission } from "./userConfigState.helper"

describe('> userConfigState.helper.ts', () => {
  describe('> selectorPluginCspPermission', () => {
    const expectedTrue = {
      value: true
    }
    const expectedFalse = {
      value: false
    }
    describe('> malformed init value', () => {
      describe('> undefined userconfigstate', () => {
        it('> return expected false val', () => {
          const returnVal = selectorPluginCspPermission.projector(null, { key: 'foo-bar' })
          expect(returnVal).toEqual(expectedFalse)
        })
      })
      describe('> undefined pluginCsp property', () => {
        it('> return expected false val', () => {
          const returnVal = selectorPluginCspPermission.projector({}, { key: 'foo-bar' })
          expect(returnVal).toEqual(expectedFalse)
        })
      })
    })

    describe('> well fored init valu', () => {

      describe('> undefined key', () => {
        it('> return expected false val', () => {
          const returnVal = selectorPluginCspPermission.projector({
            pluginCsp: {'yes-man': true}
          }, { key: 'foo-bar' })
          expect(returnVal).toEqual(expectedFalse)
        })
      })

      describe('> truthly defined key', () => {
        it('> return expected true val', () => {
          const returnVal = selectorPluginCspPermission.projector({ pluginCsp:
            { 'foo-bar': true }
          }, { key: 'foo-bar' })
          expect(returnVal).toEqual(expectedTrue)
        })
      })
    })
  })
})