const atlas = 'Allen Mouse Common Coordinate Framework v3 2015'
const referenceSpace = 'Allen Mouse Common Coordinate Framework v3'
const wildCard = 'both (Waxholm/ Allen)'

const { getAllenWaxholmTest } = require('./ratMouse.util')

const ATLAS_URL = process.env.ATLAS_URL || 'https://interactive-viewer.apps.hbp.eu/'

getAllenWaxholmTest({ 
  atlas,
  referenceSpace,
  wildCard
})(ATLAS_URL)