import { uiStateMouseOverSegmentsSelector } from './selectors'

describe('> uiState/selectors.ts', () => {
  describe('> mouseOverSegments', () => {
    it('> should filter out regions explicitly designated as unselectable', () => {
      const unSelSeg = {
        segment: {
          unselectable: true
        }
      }

      const selSeg0 = {
        segment: 1
      }

      const selSeg1 = {
        segment: {
          name: 'hello world',
          unselectable: false
        }
      }
      const filteredResult = uiStateMouseOverSegmentsSelector.projector([unSelSeg, selSeg0, selSeg1])

      expect(filteredResult).toEqual([selSeg0, selSeg1])
    })
  })
})
