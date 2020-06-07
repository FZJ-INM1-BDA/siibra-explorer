// tslint:disable:no-empty

import {} from 'jasmine'
import { defaultRootState } from 'src/services/stateStore.service'
import { cvtSearchParamToState, PARSING_SEARCHPARAM_ERROR, cvtStateToSearchParam } from './atlasViewer.urlUtil'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const colin = require('!json-loader!src/res/ext/colin.json')
const mni152 = require('!json-loader!src/res/ext/MNI152.json')
const mni152Nehubaconfig = require('!json-loader!src/res/ext/MNI152NehubaConfig.json')
const allen = require('!json-loader!src/res/ext/allenMouse.json')
const waxholm = require('!json-loader!src/res/ext/waxholmRatV2_0.json')

const { viewerState, ...rest } = defaultRootState
const fetchedTemplateRootState = {
  ...rest,
  viewerState: {
    ...viewerState,
    fetchedTemplates: [ bigbrainJson, colin, mni152, allen, waxholm ],
  },
}

// TODO finish writing tests
describe('atlasViewer.urlService.service.ts', () => {
  describe('cvtSearchParamToState', () => {
    it('convert empty search param to empty state', () => {
      const searchparam = new URLSearchParams()
      expect(() => cvtSearchParamToState(searchparam, defaultRootState)).toThrow()
    })

    it('successfully converts with only template defined', () => {
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

  describe('cvtStateToSearchParam', () => {

    it('should convert template selected', () => {
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
    it('should convert template selected and parcellation selected', () => {
  
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
      expect(stringified).toBe('templateSelected=Big+Brain+%28Histology%29&parcellationSelected=Cytoarchitectonic+Maps')
    })
  })
})
