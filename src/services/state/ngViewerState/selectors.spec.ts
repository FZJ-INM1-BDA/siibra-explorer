import { ngViewerSelectorClearView } from './selectors'

let clearViewQueue = {}

describe('> ngViewerState/selectors.ts', () => {
  describe('> ngViewerSelectorClearView', () => {
    beforeEach(() => {
      clearViewQueue = {}
    })
    describe('> when prop is not provided', () => {
      it('> if clearViewQueue is empty (on startup)', () => {
        const result = ngViewerSelectorClearView.projector(clearViewQueue)
        expect(result).toEqual(false)
      })
      it('> if clearViewQueue is non empty, but falsy, should return false', () => {
        clearViewQueue['hello - world'] = null
        clearViewQueue['oo bar'] = false
        const result = ngViewerSelectorClearView.projector(clearViewQueue)
        expect(result).toEqual(false)
      })
      it('> if clearViewQueue is non empty and truthy, should return true', () => {
        clearViewQueue['hello - world'] = 1
        const result = ngViewerSelectorClearView.projector(clearViewQueue)
        expect(result).toEqual(true)
      })
    })
    describe('> when prop is provided', () => {
      it('> only provides clear view status of the required', () => {
        clearViewQueue['hello - world'] = 1
        const result0 = ngViewerSelectorClearView.projector(clearViewQueue, { id: 'hello - world' })
        const result1 = ngViewerSelectorClearView.projector(clearViewQueue, { id: 'foo bar' })
        expect(result0).toEqual(true)
        expect(result1).toEqual(false)
      })
    })
  })
})