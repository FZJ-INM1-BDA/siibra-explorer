import { SortModalityAlphabeticallyPipe } from "./modalityPicker.component"
import { CountedDataModality } from "../databrowser.service"

describe('> modalityPicker.component.ts', () => {
  describe('> ModalityPicker', () => {
    // TODO
  })

  describe('> SortModalityAlphabeticallyPipe', () => {

    const mods: CountedDataModality[] = [{
      name: 'bbb',
      occurance: 0,
      visible: false
    }, {
      name: 'AAA',
      occurance: 1,
      visible: false
    }, {
      name: '007',
      occurance: 17,
      visible: false
    }]
    const beforeInput = [...mods]
    const pipe = new SortModalityAlphabeticallyPipe()

    const output = pipe.transform(mods)

    it('> does not mutate', () => {
      expect(mods).toEqual(beforeInput)
    })
    it('> should sort modalities as expected', () => {
      expect(output).toEqual([
        mods[2], mods[1], mods[0]
      ])
    })
  })
})
