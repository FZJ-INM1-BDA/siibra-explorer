const fs = require('fs')
const path = require('path')
const julichBrainNameToNexusId = require('./supplements/data/julich_brain_name_to_nexusid')


const IBC_DATA_DIR = path.join(__dirname, './supplements/data/ibc/')
const IBC_SCHEMA = '//ibc/ibc_schema'

const getIbcDatasetByFileName = (file) => {
  const str = fs.readFileSync(path.join(IBC_DATA_DIR, file), "utf8");

  const name = str.substring(2, str.indexOf('The Individual Brain Charting dataset is'))
  const kgUrl = str.substring(str.indexOf('Knowledge Graph: https://'), str.indexOf('Following are the'))
  const kgReference = [kgUrl.substring(kgUrl.indexOf('https'), kgUrl.length)]
  const description = str.substring(str.indexOf('The Individual Brain Charting')).replace(/:-:/g, '---')

  const region = julichBrainNameToNexusId.find(r => r[0] && name.includes(r[0]))
  const regionFullId = (region && region[1] && region[1].kg) ? `https://nexus.humanbrainproject.org/v0/data/${region[1].kg.kgSchema}/${region[1].kg.kgId}` : null

  return {
    name,
    kgReference,
    description,
    methods: ['functional magnetic resonance imaging (fMRI)'],
    species: ['Homo sapiens'],
    fullId: `https://ibc/ibc_schema/${file}`,
    kgId: file,
    kgSchema: '//ibc/ibc_schema',
    referenceSpaces: [
      {
        "name": null,
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/dafcffc5-4826-4bf1-8ff6-46b8a31ff8e2"
      },
      {
        "name": "MNI Colin 27",
        "fullId": "https://nexus.humanbrainproject.org/v0/data/minds/core/referencespace/v1.0.0/7f39f7be-445b-47c0-9791-e971c0b6d992"
      }
    ],
    parcellationAtlas: [
      {
        name: 'Jülich Cytoarchitechtonic Brain Atlas (human)',
        fullId:
          'https://nexus.humanbrainproject.org/v0/data/minds/core/parcellationatlas/v1.0.0/94c1125b-b87e-45e4-901c-00daee7f2579',
      }],
    parcellationRegion: [
      {
        species: [],
        name: region[0],
        alias: null,
        fullId: regionFullId
      }
    ],
  }
}

const ibcData = []

const ibcDataFiles = fs.readdirSync(IBC_DATA_DIR)
ibcDataFiles.forEach((file) => {
  ibcData.push(getIbcDatasetByFileName(file))
})

const getIBCData = () => {
  return ibcData
}


module.exports = {
  getIBCData,
  getIbcDatasetByFileName,
  IBC_SCHEMA: IBC_SCHEMA
}
