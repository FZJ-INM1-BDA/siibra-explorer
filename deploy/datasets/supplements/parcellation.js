const fs = require('fs')
const path = require('path')
let waxholm = new Map(),
  allen = new Map()

fs.readFile(path.join(__dirname, 'data', 'allen.json'), 'utf-8', (err, data) => {
  if (err)
    throw err
  const json = JSON.parse(data)
  allen = new Map(json.map(item => [item['Dataset name'], item["Semantic link(s)"]]))
})


fs.readFile(path.join(__dirname, 'data', 'waxholm.json'), 'utf-8', (err, data) => {
  if (err)
    throw err
  const json = JSON.parse(data)
  waxholm = new Map(json.map(item => [item['Dataset name'], item["Semantic link(s)"]]))
})

module.exports = ({ parcellationName, dataset }) => {
  return parcellationName === 'Allen adult mouse brain reference atlas V3 Brain Atlas'
    ? allen.get(dataset.name)
    : parcellationName === 'Whole Brain (v2.0)'
      ? waxholm.get(dataset.name)
      : false
}