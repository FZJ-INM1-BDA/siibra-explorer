import { IAV_IDS, IAV_VOXEL_SIZES_NM } from './index'

const waxholmTemplates = require('!json-loader!src/res/ext/waxholmRatV2_0.json')
const allenTemplates = require('!json-loader!src/res/ext/allenMouse.json')
const colinTemplates = require('!json-loader!src/res/ext/colin.json')
const mniTemplates = require('!json-loader!src/res/ext/MNI152.json')
const bbTemplates = require('!json-loader!src/res/ext/bigbrain.json')


const ratNehubaConfig = require('!json-loader!src/res/ext/waxholmRatV2_0NehubaConfig.json')
const mouseNehubaConfig = require('!json-loader!src/res/ext/allenMouseNehubaConfig.json')
const colinNehubaConfig = require('!json-loader!src/res/ext/colinNehubaConfig.json')
const icbmNehubaConfig = require('!json-loader!src/res/ext/MNI152NehubaConfig.json')
const bbNehubaConfig = require('!json-loader!src/res/ext/bigbrainNehubaConfig.json')

const tmplArr = [
  waxholmTemplates,
  allenTemplates,
  colinTemplates,
  mniTemplates,
  bbTemplates,
]

const configArr = [
  ratNehubaConfig,
  mouseNehubaConfig,
  colinNehubaConfig,
  icbmNehubaConfig,
  bbNehubaConfig,
].map(cfg => {

  return {
    layerNames: Object.keys(
      cfg['dataset']['initialNgState']['layers']
    ),
    voxelSize: cfg['dataset']['initialNgState']['navigation']['pose']['position']['voxelSize']
  }
})

describe('> messaging/nmvSwc', () => {
  for (const tmplKey in IAV_IDS) {
    describe(`> ${tmplKey}`, () => {
      let tmpl, config
      beforeAll(() => {
        tmpl = tmplArr.find(t => t['@id'] === IAV_IDS[tmplKey])
        config = tmpl && configArr.find(cfg => 
          cfg.layerNames.includes(tmpl['ngId'])
        )
      })

      it('> should be able to find tmpl by id', () => {
        expect(tmpl).toBeTruthy()
      })

      it('> should be able to find the config', () => {
        expect(config).toBeTruthy()
      })

      it('> voxelSize should match the hardcoded value', () => {
        expect(
          config.voxelSize
        ).toEqual(IAV_VOXEL_SIZES_NM[tmplKey])
      })
    })
  }
})
