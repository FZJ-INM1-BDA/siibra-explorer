const mocha = require('mocha')
const chai = require('chai')
const assert = chai.assert
const expect = chai.expect

const { getAllTemplates, getTemplate } = require('../templates/query')

const { init, getDatasetsFromTemplateId, getDatasetsFromParcellationId } = require('./query')

describe('dataset/query.js', () => {
  let templateJsons

  before(() => new Promise((resolve, reject) => {
    Promise.all([
      getAllTemplates(),
      init()
    ])
      .then(([templates]) => Promise.all(templates.map(getTemplate)))
      .then(jsons => {
        templateJsons = jsons
        resolve()
      })
      .catch(reject)
  }))

  describe('#getDatasetsFromTemplateId', () => {
    it('each id should return some datasetes', (done) => {

      const filteredTemplates = templateJsons
        .filter(t => t.mindsId && t.mindsId.kgId)

      Promise.all(
        filteredTemplates
          .map(filteredTemplate => 
            getDatasetsFromTemplateId({ templateId: filteredTemplate.mindsId.kgId })
              .then(datasets => {
                return {
                  datasets,
                  template: filteredTemplate
                }
              })
          )
      )
        .then(arrOfArr => {
          for (const { datasets, template } of arrOfArr){
            if (datasets.length === 0) {
              console.warn(`querying ${template.name} (${template.mindsId.kgId}) results in 0 results`)
            }
          }
          done()
        })
        .catch(done)
      
    })
  })

  describe('#getDatasetsFromParcellationId', () => {
    it('each id should return some datasets', (done) => {
      const parcellations = templateJsons
        .reduce((acc, curr) => acc.concat(curr.parcellations), [])
        .filter(p => p.mindsId && p.mindsId.kgId)

      Promise.all(
        parcellations
          .map(parcellation => 
            getDatasetsFromParcellationId({ parcellationId: parcellation.mindsId.kgId })
              .then(datasets => {
                return {
                  datasets,
                  parcellation
                }
              })
          )
      )
        .then(arrOfArr => {

          for (const { datasets, parcellation } of arrOfArr){
            if (datasets.length === 0) {
              console.warn(`querying ${parcellation.name} (${parcellation.mindsId.kgId}) results in 0 results`)
            }
          }
          done()
        })
        .catch(done)
    })
  })
})