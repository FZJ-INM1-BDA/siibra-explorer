const { populateSet, datasetBelongToParcellation, retry, datasetBelongsInTemplate, filterDatasets, datasetRegionExistsInParcellationRegion, _getParcellations, filterDatasetsByRegion } = require('./util')
const { fake } = require('sinon')
const { assert, expect } = require('chai')
const waxholmv2 = require('./testData/waxholmv2')
const allen2015 = require('./testData/allen2015')
const bigbrain = require('./testData/bigbrain')
const humanReceptor = require('./testData/humanReceptor')
const mni152JuBrain = require('./testData/mni152JuBrain')
const colin27 = require('./testData/colin27')
const hoc1Pmap = require('./testData/hoc1pmap')

const SKIP_RETRY_TEST = process.env.SKIP_RETRY_TEST

describe('datasets/util.js', () => {

  describe('retry', () => {

    if(SKIP_RETRY_TEST) return

    let val = 0
  
    const failCall = fake()
    const succeedCall = fake()
  
    const prFn = () => {
      val++
      return val >=3
        ? (succeedCall(), Promise.resolve())
        : (failCall(), Promise.reject())
    }
  
    beforeEach(() => {
      val = 0
      succeedCall.resetHistory()
      failCall.resetHistory()
    })
  
    it('retry until succeed', async () => {
      await retry(prFn)
      assert(succeedCall.called)
      assert(failCall.calledTwice)
    })
  
    it('retry with shorter timeouts', async () => {
      await retry(prFn, { timeout: 100 })
      assert(succeedCall.called)
      assert(failCall.calledTwice)
    })
  
    it('when retries excceeded, retry fn throws', async () => {
      try {
        await retry(prFn, { timeout: 100, retries: 2 })
        assert(false, 'retry fn should throw if retries exceed')
      } catch (e) {
        assert(true)
      }
    })
  })

  describe('datasetBelongsInTemplate', () => {
    it('should filter datasets with template defined', () => {
      for (const ds of bigbrain) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.true
        
      }
      for (const ds of colin27) {

        const belong = datasetBelongsInTemplate({ templateName: 'MNI Colin 27' })(ds)
        expect(belong).to.be.true
      }
    })

    it('should NOT include datasets without any reference space defined', () => {
      for (const ds of humanReceptor) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.false
      }
    })

    it('should filter out referenceSpaces not in list', () => {
      for (const ds of bigbrain) {

        const belong = datasetBelongsInTemplate({ templateName: 'MNI 152 ICBM 2009c Nonlinear Asymmetric' })(ds)
        expect(belong).to.be.false
      }
      for (const ds of mni152JuBrain) {

        const belong = datasetBelongsInTemplate({ templateName: 'Big Brain (Histology)' })(ds)
        expect(belong).to.be.false
      }
    })
  })
  
  describe('datasetRegionExistsInParcellationRegion', () => {
    it('should filter waxholm v2 properly', async () => {

      const waxholmv2Pr = waxholmv2.map(dataset => {
        return dataset.parcellationRegion
      })

      const { waxholm2Set } = await _getParcellations()
      for (const pr of waxholmv2Pr){

      const flag = await datasetRegionExistsInParcellationRegion(pr, waxholm2Set)
        expect(flag).to.be.true
      }
    })

    it('should filter mni152JuBrain jubrain properly', async () => {
      const { juBrainSet } = await _getParcellations()
      for (const ds of mni152JuBrain){
        
        const { parcellationRegion: prs } = ds
        const flag = await datasetRegionExistsInParcellationRegion(prs, juBrainSet)
        expect(flag).to.be.true
      }
    })

    it('should filter allen2015 properly', async () => {
      const { allen2015Set } = await _getParcellations()
      for (const ds of allen2015){
        
        const flag2015 = await datasetRegionExistsInParcellationRegion(ds.parcellationRegion, allen2015Set)
        expect(
          flag2015
        ).to.be.true

      }
    })

    it('should filterout allen2015 datasets in allen2017', async () => {

      const { allen2017Set } = await _getParcellations()
      for (const ds of allen2015){
        
        const flag2017 = await datasetRegionExistsInParcellationRegion(ds.parcellationRegion, allen2017Set)
        expect(
          flag2017
        ).to.be.false
      }
    })
    
  })
  
  describe('filterDatasets', () => {
    it('should filter waxholm v1 properly', async () => {
      const filteredResult = await filterDatasets(waxholmv2, { parcellationName: 'Waxholm Space rat brain atlas v1' })
      expect(filteredResult).to.have.length(0)
    })

    it('should filter waxholm v2 properly', async () => {
      const filteredResult = await filterDatasets(waxholmv2, { parcellationName: 'Waxholm Space rat brain atlas v2' })
      expect(filteredResult).to.have.length(1)
    })

    it('should filter allen 2015 properly', async () => {

      const filteredResult = await filterDatasets(allen2015, { parcellationName: 'Allen Mouse Common Coordinate Framework v3 2015' })
      expect(filteredResult).to.have.length(allen2015.length)
    })
  })

  describe('datasetBelongToParcellation', () => {
    const dataset = {
      parcellationAtlas:[{
        name: 'jubrain v17'
      }]
    }
    const parcellationName = 'jubrain v17'
    const dataset2 = {
      parcellationAtlas:[{
        name: 'jubrain v18'
      }]
    }
    const parcellationName2 = 'jubrain v18'
    it('if parcellation name is undefined, will always return true', () => {
      expect(
        datasetBelongToParcellation({ 
          parcellationName: null,
          dataset
        })
      ).to.be.true
    })
    it('if parcellationAtlas of dataset is empty array, will always return true', () => {
      expect(
        datasetBelongToParcellation({ 
          dataset: { parcellationAtlas: [] },
          parcellationName
        })).to.be.true
    })
    it('if parcellationAtlas of dataset is non empty array, and parcellationName is defined, should return false if they do not match', () => {
      expect(
        datasetBelongToParcellation({
          dataset,
          parcellationName: parcellationName2
        })
      ).to.be.false
    })

    it('if parcellationAtlas of dataset is non empty array, and parcellationName is defined, should return true if they do match', () => {
      expect(
        datasetBelongToParcellation({
          dataset,
          parcellationName
        })
      ).to.be.true
    })

    it('allen2015 belong to parcellation', () => {
      for (const ds of allen2015){

        expect(
          datasetBelongToParcellation({
            dataset: ds,
            parcellationName: 'Allen Mouse Common Coordinate Framework v3 2015'
          })
        ).to.be.true
      }
    })

    it('hoc1pmap should not belong to bundle parcellation', () => {
      for (const ds of hoc1Pmap){
        expect(
          datasetBelongToParcellation({
            dataset: ds,
            parcellationName: 'Fibre Bundle Atlas - Long Bundle'
          })
        ).to.be.false
        expect(
          datasetBelongToParcellation({
            dataset: ds,
            parcellationName: 'Fibre Bundle Atlas - Short Bundle'
          })
        ).to.be.false
      }
    })
  })

  describe('populateSet', () => {
    it('should populate relatedAreas', () => {
      const area44 = {
        "name": "Area 44 (IFG)",
        "arealabel": "Area-44",
        "status": "publicP",
        "labelIndex": null,
        "synonyms": [],
        "relatedAreas": [
          {
            "name": "Area 44v",
            "fullId": {
              "kg": {
                "kgSchema": "minds/core/parcellationregion/v1.0.0",
                "kgId": "7e5e7aa8-28b8-445b-8980-2a6f3fa645b3"
              }
            }
          },
          {
            "name": "Area 44d",
            "fullId": {
              "kg": {
                "kgSchema": "minds/core/parcellationregion/v1.0.0",
                "kgId": "8aeae833-81c8-4e27-a8d6-deee339d6052"
              }
            }
          }
        ],
        "rgb": [
          54,
          74,
          75
        ],
        "children": [
        ],
        "fullId": {
          "kg": {
            "kgSchema": "minds/core/parcellationregion/v1.0.0",
            "kgId": "8a6be82c-5947-4fff-8348-cf9bf73e4f40"
          }
        }
      }
      const set = populateSet([area44])
      expect(Array.from(set)).to.contain.members([
        'minds/core/parcellationregion/v1.0.0/7e5e7aa8-28b8-445b-8980-2a6f3fa645b3',
        'minds/core/parcellationregion/v1.0.0/8aeae833-81c8-4e27-a8d6-deee339d6052',
        'minds/core/parcellationregion/v1.0.0/8a6be82c-5947-4fff-8348-cf9bf73e4f40',
      ])
    })
  })

  describe('filterDatasetsByRegion', () => {

    const idHumanArea7ASPL = 'minds/core/parcellationregion/v1.0.0/e26e999f-77ad-4934-9569-8290ed05ebda'
    const idHumanArea7A = `minds/core/parcellationregion/v1.0.0/811f4adb-4a7c-45c1-8034-4afa9edf586a`
    const idMouseWholeBrain = `minds/core/parcellationregion/v1.0.0/be45bc91-8db5-419f-9471-73a320f44e06`
    const idMousePrimaryMotor = `minds/core/parcellationregion/v1.0.0/a07b4390-62db-451b-b211-a45f67c6b18e`
    const idMousePrimarySomatosensory = `minds/core/parcellationregion/v1.0.0/f99995b6-a3d0-42be-88c3-eff8a83e60ea`

    const dataHumanArea7ASPL = {
      name: 'dataHumanArea7ASPL',
      parcellationRegion: [{
        fullId: idHumanArea7ASPL
      }]
    }
    const dataMouseWholeBrain = {
      name: 'dataMouseWholeBrain',
      parcellationRegion: [{
        fullId: idMouseWholeBrain
      }]
    }

    const dataMousePrimaryMotor = {
      name: 'dataMousePrimaryMotor',
      parcellationRegion: [{
        // Mouse Primary motor area (2017)
        fullId: idMousePrimaryMotor
      }]
    }

    describe('human parc regions', () => {
      it('should leave in data with matching reference space', async () => {
        const result = await filterDatasetsByRegion([dataHumanArea7ASPL], idHumanArea7ASPL)
        expect(result).to.deep.equal([dataHumanArea7ASPL])
      })
      it('should filter out data with no matching reference space', async () => {
        const result = await filterDatasetsByRegion([dataMouseWholeBrain], idHumanArea7ASPL)
        expect(result).to.deep.equal([])
      })
      it('if query region is relatedAreas, should also leave in dataset', async () => {
        const result = await filterDatasetsByRegion([dataHumanArea7ASPL], idHumanArea7A)
        expect(result).to.deep.equal([dataHumanArea7ASPL])
      })
    })

    describe('mouse parc regions', () => {
      
      it('should leave in data with matchin reference space', async () => {
        const result = await filterDatasetsByRegion([dataMouseWholeBrain], idMouseWholeBrain)
        expect(result).to.deep.equal([dataMouseWholeBrain])

        const result2 = await filterDatasetsByRegion([dataMousePrimaryMotor], idMousePrimaryMotor)
        expect(result2).to.deep.equal([dataMousePrimaryMotor])
      })
      it('should filter out data with no matching referene space', async () => {
        const result = await filterDatasetsByRegion([dataHumanArea7ASPL], idMouseWholeBrain)
        expect(result).to.deep.equal([])
      })
      it('should filter out data if sup region is selected', async () => {
        // example: whole brain is selected, but dataset in primary motor area will be FILTERED OUT
        const result = await filterDatasetsByRegion([dataMousePrimaryMotor], idMouseWholeBrain)
        expect(result).to.deep.equal([])
      })
      it('should leave in data when sub region is selected', async () => {
        const result = await filterDatasetsByRegion([dataMouseWholeBrain], idMousePrimaryMotor)
        expect(result).to.deep.equal([dataMouseWholeBrain])
      })
    })
  })
})
