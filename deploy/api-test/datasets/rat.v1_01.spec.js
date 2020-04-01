const atlas = 'Waxholm Space rat brain atlas v1.01'
const referenceSpace = 'Waxholm Space rat brain MRI/DTI'
const wildCard = 'both (Waxholm/ Allen)'

const { getAllenWaxholmTest } = require('./ratMouse.util')

const ATLAS_URL = process.env.ATLAS_URL || 'https://interactive-viewer.apps.hbp.eu/'

getAllenWaxholmTest({ 
  atlas,
  referenceSpace,
  wildCard
})(ATLAS_URL)