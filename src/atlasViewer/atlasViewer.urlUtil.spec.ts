// tslint:disable:no-empty

import {} from 'jasmine'
import { defaultRootState } from 'src/services/stateStore.service'
import { cvtSearchParamToState, cvtStateToSearchParam, decodeToNumber, encodeNumber } from './atlasViewer.urlUtil'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const colin = require('!json-loader!src/res/ext/colin.json')
const mni152 = require('!json-loader!src/res/ext/MNI152.json')
const mni152Nehubaconfig = require('!json-loader!src/res/ext/MNI152NehubaConfig.json')
const allen = require('!json-loader!src/res/ext/allenMouse.json')
const waxholm = require('!json-loader!src/res/ext/waxholmRatV2_0.json')
const atlasHumanMultilevel = require('!json-loader!src/res/ext/atlas/atlas_multiLevelHuman.json')

const { defaultState: viewerHelperDefaultState,viewerStateHelperStoreName } = require('src/services/state/viewerState.store.helper')

const { viewerState, ...rest } = defaultRootState
const fetchedTemplateRootState = {
  ...rest,
  viewerState: {
    ...viewerState,
    fetchedTemplates: [ bigbrainJson, colin, mni152, allen, waxholm ],
  },
  [viewerStateHelperStoreName]: {
    ...viewerHelperDefaultState,
    fetchedAtlases: [ atlasHumanMultilevel ]
  }
}

// TODO finish writing tests
describe('atlasViewer.urlUtil.ts', () => {
  describe('cvtSearchParamToState', () => {

    it('> convert empty search param to empty state', () => {
      const searchparam = new URLSearchParams()
      expect(() => cvtSearchParamToState(searchparam, defaultRootState)).toThrow()
    })

    it('> parses template into atlasId properly', () => {
      const searchparam = new URLSearchParams()
      searchparam.set('templateSelected', bigbrainJson.name)
      
      const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
      expect(
        newState[viewerStateHelperStoreName]['selectedAtlasId']
      ).toEqual(
        atlasHumanMultilevel['@id']
      )
    })

    describe('> parses parcellation selected into overlayingAdditionalParcellations properly', () => {
      it('> if the selected layer is base layer, it should not populate overlayingAdditionalParcellations', () => {
        const searchparam = new URLSearchParams()

        searchparam.set('templateSelected', bigbrainJson.name)
        searchparam.set('parcellationSelected', bigbrainJson.parcellations[0].name)

        const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
        expect(
          newState[viewerStateHelperStoreName]['overlayingAdditionalParcellations']
        ).toEqual([])
      })

      it('> if the selected layer is non base layer, it should be populated', () => {
        const searchparam = new URLSearchParams()

        searchparam.set('templateSelected', bigbrainJson.name)
        searchparam.set('parcellationSelected', bigbrainJson.parcellations[1].name)

        const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
        expect(
          newState[viewerStateHelperStoreName]['overlayingAdditionalParcellations'].length
        ).toEqual(1)
        expect(
          newState[viewerStateHelperStoreName]['overlayingAdditionalParcellations'][0]['@id']
        ).toEqual(bigbrainJson.parcellations[1]['@id'])
      })
    })

    it('> successfully converts with only template defined', () => {
      const searchparam = new URLSearchParams('?templateSelected=Big+Brain+%28Histology%29')

      const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)

      const { parcellationSelected, templateSelected } = newState.viewerState
      expect(templateSelected.name).toEqual(bigbrainJson.name)
      expect(parcellationSelected.name).toEqual(bigbrainJson.parcellations[0].name)
    })

    it('successfully converts with template AND parcellation defined', () => {
      const searchparam = new URLSearchParams()
      searchparam.set('templateSelected', mni152.name)
      searchparam.set('parcellationSelected', mni152.parcellations[1].name)

      const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)

      const { parcellationSelected, templateSelected } = newState.viewerState
      expect(templateSelected.name).toEqual(mni152.name)
      expect(parcellationSelected.name).toEqual(mni152.parcellations[1].name)
    })

    it('successfully converts with template, parcellation AND selected regions defined', () => {

    })

    it('parses cNavigation correctly', () => {

    })

    describe('niftiLayers', () => {
      let searchparam = new URLSearchParams()
      beforeEach(() => {
        searchparam = new URLSearchParams()
        searchparam.set('templateSelected', mni152.name)
        searchparam.set('parcellationSelected', mni152.parcellations[1].name)
      })


      it('parses niftiLayers correctly', () => {
        const uri1 = `https://neuroglancer.humanbrainproject.eu/precomputed/JuBrain/17/icbm152casym/pmaps/Visual_hOc1_r_N10_nlin2MNI152ASYM2009C_2.4_publicP_a48ca5d938781ebaf1eaa25f59df74d0.nii.gz`
        const uri2 = `https://neuroglancer.humanbrainproject.eu/precomputed/JuBrain/17/icbm152casym/pmaps/Visual_hOc1_r_N10_nlin2MNI152ASYM2009C_2000.4_publicP_a48ca5d938781ebaf1eaa25f59df74d0.nii.gz`
        searchparam.set('niftiLayers', [uri1, uri2].join('__'))
  
        const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
        expect(newState.ngViewerState.layers.length).toEqual(2)
  
        const layer1 = newState.ngViewerState.layers[0]
        expect(layer1.name).toEqual(uri1)
        expect(layer1.source).toEqual(`nifti://${uri1}`)
        expect(layer1.mixability).toEqual('nonmixable')

        const layer2 = newState.ngViewerState.layers[1]
        expect(layer2.name).toEqual(uri2)
        expect(layer2.source).toEqual(`nifti://${uri2}`)
        expect(layer2.mixability).toEqual('nonmixable')
      })
      
      it('parses multiple niftiLayers correctly', () => {

        const uri = `https://neuroglancer.humanbrainproject.eu/precomputed/JuBrain/17/icbm152casym/pmaps/Visual_hOc1_r_N10_nlin2MNI152ASYM2009C_2.4_publicP_a48ca5d938781ebaf1eaa25f59df74d0.nii.gz`
        searchparam.set('niftiLayers', uri)
  
        const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
        expect(newState.ngViewerState.layers.length).toEqual(1)
  
        const layer = newState.ngViewerState.layers[0]
        expect(layer.name).toEqual(uri)
        expect(layer.source).toEqual(`nifti://${uri}`)
        expect(layer.mixability).toEqual('nonmixable')
      })
    })

    it('parses pluginStates correctly', () => {
      const searchParam = new URLSearchParams()
      searchParam.set('templateSelected', 'MNI 152 ICBM 2009c Nonlinear Asymmetric')
      searchParam.set('parcellationSelected', 'JuBrain Cytoarchitectonic Atlas')
      searchParam.set('pluginStates', 'http://localhost:3001/manifest.json')
  
      const newState = cvtSearchParamToState(searchParam, fetchedTemplateRootState)
      expect(newState.pluginState.initManifests).toEqual([
        ['INIT_MANIFEST_SRC', 'http://localhost:3001/manifest.json']
      ])
    })

    it('if both standaloneVolumes and templateSelected are set, only standaloneVolumes are honoured', () => {
      const searchParam = new URLSearchParams()
      
      searchParam.set('templateSelected', 'MNI 152 ICBM 2009c Nonlinear Asymmetric')
      searchParam.set('parcellationSelected', 'JuBrain Cytoarchitectonic Atlas')
      searchParam.set('standaloneVolumes', JSON.stringify(['nifti://http://localhost/nii.gz']))

      const newState = cvtSearchParamToState(searchParam, fetchedTemplateRootState)
      expect(newState.viewerState.templateSelected).toBeFalsy()
      expect(newState.viewerState.parcellationSelected).toBeFalsy()
      expect(newState.viewerState.standaloneVolumes).toEqual(['nifti://http://localhost/nii.gz'])
    })
  })

  describe('> cvtStateToSearchParam', () => {

    it('> should convert template selected', () => {
      const { viewerState } = defaultRootState
      const searchParam = cvtStateToSearchParam({
        ...defaultRootState,
        viewerState: {
          ...viewerState,
          templateSelected: bigbrainJson,
        }
      })

      const stringified = searchParam.toString()
      expect(stringified).toBe('templateSelected=Big+Brain+%28Histology%29')
    })
    it('> should convert template selected and parcellation selected', () => {
  
      const { viewerState } = defaultRootState
      const searchParam = cvtStateToSearchParam({
        ...defaultRootState,
        viewerState: {
          ...viewerState,
          templateSelected: bigbrainJson,
          parcellationSelected: bigbrainJson.parcellations[0]
        }
      })
  
      const stringified = searchParam.toString()
      expect(stringified).toBe('templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps+-+v2.4')
    })
  })

  const FLOAT_PRECISION = 6
  
  describe('encodeNumber/decodeToNumber', () => {
  
    const getCompareOriginal = (original: number[]) => (element: string, index: number) =>
      original[index].toString().length >= element.length
  
    const lengthShortened = (original: number[], encodedString: string[]) =>
      encodedString.every(getCompareOriginal(original))
  
    it('should encode/decode positive integer as expected', () => {
  
      const positiveInt = [
        0,
        1,
        99999999999,
        12347,
      ]
  
      const encodedString = positiveInt.map(n => encodeNumber(n))
      const decodedString = encodedString.map(s => decodeToNumber(s))
      expect(decodedString).toEqual(positiveInt)
  
      expect(lengthShortened(positiveInt, encodedString)).toBe(true)
    })
  
    it('should encode/decode ANY positive integer as expected', () => {
      const posInt = Array(1000).fill(null).map(() => {
        const numDig = Math.ceil(Math.random() * 7)
        return Math.floor(Math.random() * Math.pow(10, numDig))
      })
      const encodedString = posInt.map(n => encodeNumber(n))
      const decodedNumber = encodedString.map(s => decodeToNumber(s))
      expect(decodedNumber).toEqual(posInt)
  
      expect(lengthShortened(posInt, encodedString)).toBe(true)
    })
  
    it('should encode/decode signed integer as expected', () => {
  
      const signedInt = [
        0,
        -0,
        -1,
        1,
        128,
        -54,
      ]
  
      const encodedString = signedInt.map(n => encodeNumber(n))
      const decodedNumber = encodedString.map(s => decodeToNumber(s))
  
      /**
       * -0 will be converted to 0 by the encode/decode process, but does not deep equal, according to jasmine
       */
      expect(decodedNumber).toEqual(signedInt.map(v => v === 0 ? 0 : v))
  
      expect(lengthShortened(signedInt, encodedString)).toBe(true)
    })
  
    it('should encode/decode ANY signed integer as expected', () => {
  
      const signedInt = Array(1000).fill(null).map(() => {
        const numDig = Math.ceil(Math.random() * 7)
        return Math.floor(Math.random() * Math.pow(10, numDig)) * (Math.random() > 0.5 ? 1 : -1)
      })
      const encodedString = signedInt.map(n => encodeNumber(n))
      const decodedNumber = encodedString.map(s => decodeToNumber(s))
  
      /**
       * -0 will be converted to 0 by the encode/decode process, but does not deep equal, according to jasmine
       */
      expect(decodedNumber).toEqual(signedInt.map(v => v === 0 ? 0 : v))
  
      expect(lengthShortened(signedInt, encodedString)).toBe(true)
    })
  
    it('should encode/decode float as expected', () => {
      const floatNum = [
        0.111,
        12.23,
        1723.0,
      ]
  
      const encodedString = floatNum.map(f => encodeNumber(f, { float: true }))
      const decodedNumber = encodedString.map(s => decodeToNumber(s, { float: true }))
      expect(decodedNumber.map(n => n.toFixed(FLOAT_PRECISION))).toEqual(floatNum.map(n => n.toFixed(FLOAT_PRECISION)))
    })
  
    it('should encode/decode ANY float as expected', () => {
      const floatNums = Array(1000).fill(null).map(() => {
        const numDig = Math.ceil(Math.random() * 7)
        return (Math.random() > 0.5 ? 1 : -1) * Math.floor(
          Math.random() * Math.pow(10, numDig),
        )
      })
  
      const encodedString = floatNums.map(f => encodeNumber(f, { float: true }))
      const decodedNumber = encodedString.map(s => decodeToNumber(s, { float: true }))
  
      expect(floatNums.map(v => v.toFixed(FLOAT_PRECISION))).toEqual(decodedNumber.map(n => n.toFixed(FLOAT_PRECISION)))
    })
  
    it('poisoned hash should throw', () => {
      const illegialCharacters = './\\?#!@#^%&*()+={}[]\'"\n\t;:'
      for (const char of illegialCharacters.split('')) {
        expect(() => {
          decodeToNumber(char)
        }).toThrow()
      }
    })
  
    it('poisoned hash can be caught', () => {
  
      const testArray = ['abc', './\\', 'Cde']
      const decodedNum = testArray.map(v => {
        try {
          return decodeToNumber(v)
        } catch (e) {
          return null
        }
      }).filter(v => !!v)
      expect(decodedNum.length).toEqual(2)
    })
  })
  
})
