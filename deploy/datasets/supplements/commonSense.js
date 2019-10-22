
const humanTemplateSet = new Set([
  'Big Brain (Histology)',
  'MNI Colin 27',
  'MNI 152 ICBM 2009c Nonlinear Asymmetric'
])

const humanParcellationSet = new Set([
  'Grey/White matter',
  'Cytoarchitectonic Maps',
  'BigBrain Cortical Layers Segmentation',
  'JuBrain Cytoarchitectonic Atlas',
  'Fibre Bundle Atlas - Short Bundle',
  'Fibre Bundle Atlas - Long Bundle',
  'Cytoarchitectonic Maps'
])

const ratTemplateSet = new Set([
  'Waxholm Space rat brain MRI/DTI'
])

const ratParcellationSet = new Set([
  'Waxholm Space rat brain atlas v1',
  'Waxholm Space rat brain atlas v2',
  'Waxholm Space rat brain atlas v3'
])

const mouseTemplateSet = new Set([
  'Allen adult mouse brain reference atlas V3'
])

const mouseParcellationSet = new Set([
  'Allen Mouse Common Coordinate Framework v3 2017',
  'Allen Mouse Common Coordinate Framework v3 2015'
])

const dsIsHuman = ({ ds }) => ds && ds.species.some(species => /homo\ sapiens/i.test(species))
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

exports.getCommonSenseDsFilter = ({ templateName, parcellationName }) => {
  const trueFilter = queryIsHuman({ templateName, parcellationName })
    ? dsIsHuman
    : queryIsMouse({ templateName, parcellationName })
      ? dsIsMouse
      : queryIsRat({ templateName, parcellationName })
        ? dsIsRat
        : null

  return ds => trueFilter && trueFilter({ ds })
}
