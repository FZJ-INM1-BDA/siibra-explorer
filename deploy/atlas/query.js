const fs = require('fs')
const path = require('path')
const { promisify } = require('util')

const readdirAsync = promisify(fs.readdir)
const readFileAsync = promisify(fs.readFile)

let ready = false

const map = new Map()

const getData = async () => {
  
  let filepath
  if (process.env.NODE_ENV === 'production') {
    filepath = path.join(__dirname, '../res')
  } else {
    filepath = path.join(__dirname, '../../src/res/ext')
  }

  const files = await readdirAsync(path.join(filepath, 'atlas'))

  for (const file of files) {

    const data = await readFileAsync(path.join(filepath, 'atlas', file), 'utf-8')
    const json = JSON.parse(data)
    map.set(json['@id'], json)
  }
  ready = true
}

getData()

const getAllAtlases = async () => {
  return Array.from(map.keys())
}

const getAtlasById = async id => {
  return map.get(id)
}

module.exports = {
  getAllAtlases,
  getAtlasById,
  isReady: () => ready
}