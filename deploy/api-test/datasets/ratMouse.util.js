const { setupAuth, getInfo, getGetRowsFn } = require('./util')

const { GoogleSpreadsheet } = require('google-spreadsheet')
const WAXHOLM_RAT_GOOGLE_SHEET_ID = process.env.WAXHOLM_RAT_GOOGLE_SHEET_ID
if (!WAXHOLM_RAT_GOOGLE_SHEET_ID) throw new Error(`env var WAXHOLM_RAT_GOOGLE_SHEET_ID is undefined`)

const doc = new GoogleSpreadsheet(WAXHOLM_RAT_GOOGLE_SHEET_ID)

// TODO for backward compatiblity with what must be node v 0.0.1
// OKD jenkins nodejs slave runs on nodejs that does not support generator function
// swap request for got as soon as this is rectified
// const got = require('got')
const request = require('request')
const { expect } = require('chai')
const { URL } = require('url')

const getWaxholmAllenDatasetsPr = new Promise( async (rs, rj) => {
  await setupAuth(doc)
  const worksheet = doc.sheetsByIndex.find(({ title }) => title === 'Dataset level')
  if (!worksheet) rj(`worksheet 'Dataset level' not found!`)

  const rows = await worksheet.getRows({ offset: 1 })
  const filteredrows = rows.filter(r => r['Public or curated?'] === 'public')

  rs(filteredrows)
})

const getWaxholmAllenDatasets = () => getWaxholmAllenDatasetsPr

const getAllenWaxholmTest = ({ 
  atlas,
  referenceSpace,
  wildCard
 }) => ATLAS_URL => describe(referenceSpace, () => {
   let spreadsheetExpectedDatasets = []
   before(async () => {
     spreadsheetExpectedDatasets = (await getWaxholmAllenDatasets())
       .filter(r => r['Reference Atlas'] === atlas || r['Reference Atlas'] === wildCard)
       .map(r => r['Dataset name'])
   })
   describe(atlas, () => {
     describe(`testing ${ATLAS_URL}`, () => {
 
       let fetchedDatasets = []
       before(async () => {
         const getUrl = new URL(`${ATLAS_URL.replace(/\/$/, '')}/datasets/templateNameParcellationName/${encodeURIComponent(referenceSpace)}/${encodeURIComponent(atlas)}`)
        //  const resp = await got(getUrl)
         const resp = await (new Promise((rs, rj) => {
           request(getUrl, {},  (err, resp, body) => {
             if (err) rj(err)
             rs(resp)
           })
         }))
         expect(resp.statusCode).to.equal(200)
         fetchedDatasets = JSON.parse(resp.body).map(({ name }) => name)
       })
 
       it(`number of fetched === number of expected`, () => {
         expect(fetchedDatasets.length).to.eq(spreadsheetExpectedDatasets.length)
       })
 
       it('expect fetched === expected. + = expected, but not fetched; - = fetched, but not expected', () => {
         expect(
           fetchedDatasets.sort()
         ).to.have.members(
           spreadsheetExpectedDatasets.sort()
         )
       })
     })
   })
 })

module.exports = {
  getWaxholmAllenDatasets,
  getAllenWaxholmTest
}
