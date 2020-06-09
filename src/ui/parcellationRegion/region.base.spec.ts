import { regionInOtherTemplateSelector } from './region.base'

const mr1wrong = {
  labelIndex: 1,
  name: 'mr1',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'fff-bbb'
    }
  }
}

const mr0wrong = {
  labelIndex: 1,
  name: 'mr0',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'aaa-fff'
    }
  }
}


const mr1lh = {
  labelIndex: 1,
  name: 'mr1 - left hemisphere',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'ccc-bbb'
    }
  }
}

const mr1rh = {
  labelIndex: 1,
  name: 'mr1 - right hemisphere',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'ccc-bbb'
    }
  }
}

const mr0lh = {
  labelIndex: 1,
  name: 'mr0 - left hemisphere',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'aaa-bbb'
    }
  }
}

const mr0rh = {
  labelIndex: 1,
  name: 'mr0 - right hemisphere',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'aaa-bbb'
    }
  }
}

const mr1 = {
  labelIndex: 1,
  name: 'mr1',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'ccc-bbb'
    }
  }
}

const mr0 = {
  labelIndex: 1,
  name: 'mr0',
  fullId: {
    kg: {
      kgSchema: 'fzj/mock/pr',
      kgId: 'aaa-bbb'
    }
  }
}

// parcellations

const mp1h = {
  name: 'mp1h',
  regions: [ mr1lh, mr0lh,  mr0rh, mr1rh ]
}

const mpWrong = {
  name: 'mp1h',
  regions: [ mr1wrong, mr0wrong ]
}

const mp0 = {
  name: 'mp0',
  regions: [ mr1, mr0 ]
}

// templates

const mt0 = {
  name: 'mt0',
  fullId: 'fzj/mock/rs/v0.0.0/aaa-bbb',
  parcellations: [ mp0 ]
}

const mt1 = {
  name: 'mt1',
  fullId: 'fzj/mock/rs/v0.0.0/bbb-bbb',
  parcellations: [ mp0 ]
}

const mt2 = {
  name: 'mt2',
  fullId: 'fzj/mock/rs/v0.0.0/ccc-bbb',
  parcellations: [ mp1h ]
}

const mt3 = {
  name: 'mt3',
  fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
  parcellations: [ mp1h ]
}

const mtWrong = {
  name: 'mtWrong',
  fullId: 'fzj/mock/rs/v0.0.0/ddd-bbb',
  parcellations: [ mpWrong ]
}

const mockFetchedTemplates = [ mt0, mt1, mt2, mt3, mtWrong ]

describe('> region.base.ts', () => {
  describe('> getRegionInOtherTemplatesSelector', () => {
    describe('> no hemisphere selected, simulates big brain cyto map', () => {

      let result: any[]
      beforeAll(() => {
        result = regionInOtherTemplateSelector.projector({ fetchedTemplates: mockFetchedTemplates, templateSelected: mt0 }, { region: mr0 })
      })

      it('> length checks out', () => {
        expect(result.length).toEqual(5)
      })

      it('> does not contain itself', () => {
        expect(result).not.toContain(
          jasmine.objectContaining({
            template: mt0,
            parcellation: mp0,
            region: mr0
          })
        )
      })

      it('> no hemisphere result has no hemisphere meta data', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt1,
            parcellation: mp0,
            region: mr0
          })
        )
      })

      it('> hemisphere result has hemisphere metadata # 1', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt2,
            parcellation: mp1h,
            region: mr0lh,
            hemisphere: 'left hemisphere'
          })
        )
      })
      it('> hemisphere result has hemisphere metadata # 2', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt3,
            parcellation: mp1h,
            region: mr0lh,
            hemisphere: 'left hemisphere'
          })
        )
      })
      it('> hemisphere result has hemisphere metadata # 3', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt3,
            parcellation: mp1h,
            region: mr0rh,
            hemisphere: 'right hemisphere'
          })
        )
      })
      it('> hemisphere result has hemisphere metadata # 4', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt3,
            parcellation: mp1h,
            region: mr0rh,
            hemisphere: 'right hemisphere'
          })
        )
      })
    })

    describe('> hemisphere data selected (left hemisphere), simulates julich-brain in mni152', () => {
      let result
      beforeAll(() => {
        result = regionInOtherTemplateSelector.projector({ fetchedTemplates: mockFetchedTemplates, templateSelected: mt2 }, { region: mr0lh })
      })

      it('> length checks out', () => {
        expect(result.length).toEqual(3)
      })

      it('> does not select wrong hemisphere (right hemisphere)', () => {
        expect(result).not.toContain(
          jasmine.objectContaining({
            template: mt3,
            parcellation: mp1h,
            region: mr0rh,
          })
        )
      })

      it('> select the corresponding hemisphere (left hemisphere), but without hemisphere metadata', () => {
        expect(result).toContain(
          jasmine.objectContaining({
            template: mt3,
            parcellation: mp1h,
            region: mr0lh
          })
        )
      })
    })
  })
})
