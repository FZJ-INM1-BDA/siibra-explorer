const express = require('express')
const fs = require('fs')
const path = require('path')
const datasetsRouter = express.Router()

const cachedFilePath = path.join(__dirname, '..', 'res', 'cachedKgDS.20190225.json')
let cachedData = null
let cachedSpaces = null

fs.readFile(cachedFilePath, 'utf-8', (err, data) => {
  if (err)
    throw err
  const json = JSON.parse(data)
  cachedData = json.results.filter(ds => ds.embargoStatus.some(s => s === 'Free'))

  const allPNames = cachedData.filter(v => v.parcellationRegion.length > 0).map(v => v.parcellationRegion[0].name)
  const noPNameNoRefSpace = cachedData.filter(v => v.parcellationRegion.length === 0 && v.referenceSpaces.length === 0)
})

datasetsRouter.get('/templateName/:templateName', (req, res) => {
  const { templateName } = req.params
  /**
   * temporary use cached data. in future, live fetch data and/or apply caching
   */
  const filteredData = cachedData.filter(ds => {
    return templateName === 'undefined'
      ? ds.referenceSpaces.length === 0
      : ds.referenceSpaces.some(rs => rs.name === templateName)
  })
  res.status(200).send(JSON.stringify(filteredData))
})


const readConfigFile = (filename) => new Promise((resolve, reject) => {
  const filepath = path.join(__dirname, '..', 'res', filename)
  fs.readFile(filepath, 'utf-8', (err, data) => {
    if(err) reject(err)
    resolve(data)
  })
})

const flattenArray = (array) => {
  return array.filter(item => item.children.length === 0).concat(
    ...array.filter(item => item.children.length > 0).map(item => flattenArray(item.children))
  )
}

let juBrain = null
let shortBundle = null
let longBundle = null

readConfigFile('colin.json')
  .then(data => JSON.parse(data))
  .then(json => {
    juBrain = flattenArray(json.parcellations[0].regions)
  })
  .catch(console.error)

readConfigFile('MNI152.json')
  .then(data => JSON.parse(data))
  .then(json => {
    longBundle = flattenArray(json.parcellations[0].regions)
    shortBundle = flattenArray(json.parcellations[1].regions)
  })
  .catch(console.error)

datasetsRouter.get('/parcellationName/:parcellationName', (req, res) => {
  const { parcellationName } = req.params
  let returnArr
  switch (parcellationName) {
    case 'JuBrain Cytoarchitectonic Atlas':
      returnArr = juBrain
        ? cachedData
          .filter(ds => !/infant/i.test(ds.name))
          .filter(ds =>  
            ds.parcellationRegion.length > 0 &&
            ds.parcellationRegion.some(pr => {
              const regex = new RegExp(pr.name)
              return juBrain.some(juBR => regex.test(juBR.name))
            }))
        : []
      break;
    case 'Fibre Bundle Atlas - Long Bundle':
      returnArr = longBundle
        ? cachedData
            .filter(ds =>  
              ds.parcellationRegion.length > 0 &&
              ds.parcellationRegion.some(pr => {
                const regex = new RegExp(pr.name)
                return longBundle.some(lbr => regex.test(lbr.name))
              }))
        : []
      break;
    case 'Fibre Bundle Atlas - Short Bundle':
      returnArr = shortBundle
      ? cachedData
          .filter(ds =>  
            ds.parcellationRegion.length > 0 &&
            ds.parcellationRegion.some(pr => {
              const regex = new RegExp(pr.name)
              return shortBundle.some(sbr => regex.test(sbr.name))
            }))
      : []
      break;
    default:
      returnArr = []
  }
  res.status(200).send(JSON.stringify(returnArr))
})

module.exports = datasetsRouter