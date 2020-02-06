const fs = require('fs')
const path = require('path')

const bigbrain = fs.readFileSync(path.join(__dirname, './ext/bigbrain.json'), 'utf-8')
const colin = fs.readFileSync(path.join(__dirname, './ext/mni152.json'), 'utf-8')

const bigbrainJson = JSON.parse(bigbrain)
