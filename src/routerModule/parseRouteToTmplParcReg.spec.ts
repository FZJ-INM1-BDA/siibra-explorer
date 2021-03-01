import { parseSearchParamForTemplateParcellationRegion } from './parseRouteToTmplParcReg'

const url = `/a:juelich:iav:atlas:v1.0.0:1/t:minds:core:referencespace:v1.0.0:dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2/p:minds:core:parcellationatlas:v1.0.0:94c1125b-b87e-45e4-901c-00daee7f2579-25/@:0.0.0.-W000..2_ZG29.-ASCS.2-8jM2._aAY3..BSR0..0.1w4W0~.0..1jtG`

const fakeState = {
}
const fakeTmpl = {
  '@id': 'foobar'
}
const fakeParc = {
  '@id': 'buzbaz'
}
const fakeRegions = [{
  ngId: 'foo',
  labelIndex: 152
}]

describe('parseRouteToTmplParcReg.ts', () => {
  describe('> parseSearchParamForTemplateParcellationRegion', () => {
    it('> parses selected region properly', () => {
      
    })
  })
})