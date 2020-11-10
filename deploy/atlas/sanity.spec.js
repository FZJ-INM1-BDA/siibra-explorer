const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const asyncReadfile = promisify(fs.readFile)
const { expect, assert } = require('chai')

const templateFiles = [
  'bigbrain.json',
  'colin.json',
  'MNI152.json',
  'waxholmRatV2_0.json',
  'allenMouse.json'
]

const atlasFiles = [
  'atlas_multiLevelHuman.json',
  'atlas_waxholmRat.json',
  'atlas_allenMouse.json'
]

const templateIdToParcsMap = new Map()
const templateIdToTemplateMap = new Map()
const parcIdToTemplateId = new Map()
const parcIdToParcMap = new Map()

const rootDir = path.join(__dirname, '../../src/res/ext')

describe('> atlas sanity check', () => {
  before(async () => {
    for (const templateFile of templateFiles){
      const txt = await asyncReadfile(
        path.join(rootDir, templateFile),
        'utf-8'
      )
      const template = JSON.parse(txt)
      const { ['@id']: templateId, name: templateName, parcellations } = template
      if (!templateId) throw new Error(`${templateFile} / ${templateName} / @id not defined`)
      templateIdToTemplateMap.set(templateId, template)

      for (const parc of parcellations) {
        const { ['@id']: parcId, name: parcName } = parc
        if (!parcId) throw new Error(`${templateFile} / ${parcName} /@id not defined`)
        parcIdToParcMap.set(parcId, parc)

        const arr = templateIdToParcsMap.get(templateId) || []
        templateIdToParcsMap.set(templateId, arr.concat(parcId) )

        const arr2 = parcIdToTemplateId.get(parcId) || []
        parcIdToTemplateId.set(parcId, arr2.concat(templateId))
      }
    }
  })

  for (const atlas of atlasFiles) {
    describe(`> checking ${atlas}`, () => {
      
      beforeEach(async () => {
        const txt = await asyncReadfile(
          path.join(rootDir, 'atlas', atlas)
        )
        const { ['@id']: atlasId, name: atlasName, templateSpaces, parcellations } = JSON.parse(txt)

        describe(`> checking ${atlasName}`, () => {
          describe('> checking template spaces', () => {
            for (const { name: tName, ['@id']: tId, availableIn } of templateSpaces) {
              describe(`> checking ${tName} with id ${tId}`, () => {
                for (const { ['@id']: pId, name: pName } of availableIn) {
                  describe(`> checking ${pName}, with id ${pId}`, () => {
                    it('> template maps to parc', () => {
                      const arr = templateIdToParcsMap.get(tId)
                      const idx = arr.findIndex(id => id === pId)
                      assert(
                        idx >= 0,
                        'entry can be found'
                      )
                      arr.splice(idx, 1)
                    })

                    it('> parc maps to tmpl', () => {
                      
                      const arr = parcIdToTemplateId.get(pId)
                      if (!arr) throw new Error(`${pName} cannot be found`)
                      const idx = arr.findIndex(id => id === tId)
                      assert(
                        idx >= 0,
                        'entry can be found'
                      )
                      arr.splice(idx, 1)
                    })
                  })
                }
              })
            }
          })
        })
        
      })

      it('> dummy test', () => {
        expect(true).to.equal(true)
      })
    })
  }
})
