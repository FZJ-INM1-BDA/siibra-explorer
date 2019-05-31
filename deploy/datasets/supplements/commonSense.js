
const humanTemplateSet = new Set([
  'Big Brain (Histology)',
  'MNI Colin 27',
  'MNI 152 ICBM 2009c Nonlinear Asymmetric'
])

const humanParcellationSet = new Set([
  'Grey/White matter',
  'Area V1',
  'Area V2',
  'JuBrain Cytoarchitectonic Atlas',
  'Fibre Bundle Atlas - Short Bundle',
  'Fibre Bundle Atlas - Long Bundle'
])

const ratTemplateSet = new Set([
  'Waxholm Space rat brain atlas v.2.0'
])

const ratParcellationSet = new Set([
  'Waxholm Space rat brain atlas v.2.0'
])

const mouseTemplateSet = new Set([
  'Allen adult mouse brain reference atlas V3'
])

const mouseParcellationSet = new Set([
  'Allen adult mouse brain reference atlas V3 Brain Atlas'
])

const dsIsHuman = ({ds}) => ds && ds.species.some(species => /homo\ sapiens/i.test(species))
const dsIsRat = ({ ds }) => ds && ds.species.some(species => /rattus\ norvegicus/i.test(species))
const dsIsMouse = ({ ds }) => ds && ds.species.some(species => /mus\ musculus/i.test(species))

const queryIsMouse = ({ templateName, parcellationName }) => 
  (templateName && mouseTemplateSet.has(templateName))
  || (parcellationName && mouseParcellationSet.has(parcellationName))

const queryIsRat = ({ templateName, parcellationName }) => 
  (templateName && ratTemplateSet.has(templateName))
  || (parcellationName && ratParcellationSet.has(parcellationName))

const queryIsHuman = ({ templateName, parcellationName }) =>
  (templateName && humanTemplateSet.has(templateName))
  || (parcellationName && humanParcellationSet.has(parcellationName))

exports.commonSenseDsFilter = ({ ds , templateName, parcellationName}) => 
  (queryIsHuman({ templateName, parcellationName }) && !dsIsRat({ ds }) && !dsIsMouse({ ds }))
  || (queryIsMouse({ templateName, parcellationName }) && !dsIsRat({ ds }) && !dsIsHuman({ ds }))
  || (queryIsRat({ templateName, parcellationName }) && !dsIsMouse({ ds }) && !dsIsHuman({ ds }))
