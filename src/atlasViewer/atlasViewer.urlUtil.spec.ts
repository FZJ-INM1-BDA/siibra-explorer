// tslint:disable:no-empty

import {} from 'jasmine'
import { defaultRootState } from 'src/services/stateStore.service'
import { cvtSearchParamToState, PARSING_SEARCHPARAM_ERROR } from './atlasViewer.urlUtil'

const bigbrainJson = require('!json-loader!src/res/ext/bigbrain.json')
const colin = require('!json-loader!src/res/ext/colin.json')
const mni152 = require('!json-loader!src/res/ext/MNI152.json')
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

    it('parses niftiLayers correctly', () => {

    })

    it('parses pluginStates correctly', () => {

    })
  })

  describe('cvtStateToSearchParam', () => {

  })
})
