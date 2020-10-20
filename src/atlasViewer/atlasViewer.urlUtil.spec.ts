// tslint:disable:no-empty

import {} from 'jasmine'
import { defaultRootState } from 'src/services/stateStore.service'
import { cvtSearchParamToState, cvtStateToSearchParam } from './atlasViewer.urlUtil'

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
describe('atlasViewer.urlService.service.ts', () => {
  describe('cvtSearchParamToState', () => {

    /**
     * for 2.3.0 onwards
     * multi region selection has been temporarily disabled.
     * search param parse needs to return emtpy array when encountered
     */
    it('> filters out multi region selection an returns an empty array', () => {
      const searchString = `?templateSelected=Waxholm+Space+rat+brain+MRI%2FDTI&parcellationSelected=Waxholm+Space+rat+brain+atlas+v2&cRegionsSelected=%7B%22v2%22%3A%2213.a.b.19.6.c.q.x.1.1L.Y.1K.r.s.y.z._.1G.-.Z.18.v.f.g.1J.1C.k.14.15.7.1E.1F.10.11.12.1D.1S.A.1V.1W.1X.1Y.1Z.1a.1i.1j.1k.1m.1n.1o.1p.U.V.W.3.1I.e.d.1T.1H.m.h.n.1U.o.t.2.17.p.w.4.5.1A.1B.u.l.j.16%22%7D&cNavigation=0.0.0.-W000..2-8Bnd.2_tvb9._yymE._tYzz..1Sjt..9Hnn%7E.Lqll%7E.Vcf..9fo`
      const searchparam = new URLSearchParams(searchString)
      const regionObj = JSON.parse(searchparam.get('cRegionsSelected'))
      const totalRegions = []
      for (const key in regionObj) {
        for (const el of regionObj[key].split('.')) {
          totalRegions.push(el)
        }
      }
      expect(totalRegions.length).toBeGreaterThan(1)

      const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
      expect(newState?.viewerState?.regionsSelected).toEqual([])
    })
    
    /**
     * leaves single region selection intact
     */
    it('> leaves single region selection intact', () => {
      const searchString = '?templateSelected=Waxholm+Space+rat+brain+MRI%2FDTI&parcellationSelected=Waxholm+Space+rat+brain+atlas+v2&cRegionsSelected=%7B"v2"%3A"1S"%7D&cNavigation=0.0.0.-W000..2-8Bnd.2_tvb9._yymE._tYzz..1Sjt..9Hnn~.Lqll~.Vcf..9fo'
      const searchparam = new URLSearchParams(searchString)
      const regionObj = JSON.parse(searchparam.get('cRegionsSelected'))
      const totalRegions = []
      for (const key in regionObj) {
        for (const el of regionObj[key].split('.')) {
          totalRegions.push(el)
        }
      }
      expect(totalRegions.length).toEqual(1)

      const newState = cvtSearchParamToState(searchparam, fetchedTemplateRootState)
      expect(newState?.viewerState?.regionsSelected?.length).toEqual(1)
    })

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
