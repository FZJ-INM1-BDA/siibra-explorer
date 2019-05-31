exports.manualFilter = (dataset) => dataset 
  && dataset.project
  && dataset.project instanceof Array
  && dataset.project.some(p => p === 'Atlas of deep white matter fibre bundles, version 2018')

const dict = [ [ 'Probabilistic map of the anterior segment of the left arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate_Anterior - Left' ],
[ 'Probabilistic map of the direct segment of the left arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate - Left' ],
[ 'Probabilistic map of the posterior segment of the left arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate_Posterior - Left' ],
[ 'Probabilistic map of the left long cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Long - Left' ],
[ 'Probabilistic map of the left short cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Short - Left' ],
[ 'Probabilistic map of the left temporal cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Temporal - Left' ],
[ 'Probabilistic map of the left corticospinal tract (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/CorticoSpinalTract - Left' ],
[ 'Probabilistic map of the left fornix (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Fornix - Left' ],
[ 'Probabilistic map of the left inferior fronto-occipital fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/InferiorFrontoOccipital - Left' ],
[ 'Probabilistic map of the left inferior longitudinal fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/InferiorLongitudinal - Left' ],
[ 'Probabilistic map of the left uncinate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Uncinate - Left' ],
[ 'Probabilistic map of the anterior segment of the right arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate_Anterior - Right' ],
[ 'Probabilistic map of the posterior segment of the right arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate_Posterior - Right' ],
[ 'Probabilistic map of the posterior segment of the right arcuate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Arcuate - Right' ],
[ 'Probabilistic map of the right long cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Long - Right' ],
[ 'Probabilistic map of the right short cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Short - Right' ],
[ 'Probabilistic map of the right temporal cingulate fibres (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Cingulum_Temporal - Right' ],
[ 'Probabilistic map of the right corticospinal tract (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/CorticoSpinalTract - Right' ],
[ 'Probabilistic map of the right fornix (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Fornix - Right' ],
[ 'Probabilistic map of the right inferior fronto-occipital fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/InferiorFrontoOccipital - Right' ],
[ 'Probabilistic map of the right inferior longitudinal fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/InferiorLongitudinal - Right' ],
[ 'Probabilistic map of the right uncinate fasciculus (atlas of deep white matter fibre bundles, version 2018)',
'Fibre Bundle Atlas - Long Bundle/Uncinate - Right' ] ]

const dsNameToIdMap = new Map(dict)
const getIdFromDataset = (dataset) => {
  const id = dsNameToIdMap.get(dataset.name)
  if (id) return id
  return null
}

exports.manualMap = (dataset) => {
  return {
    preview: !process.env.DISABLE_DWM_PMAP,
    ...dataset,
    parcellationRegion: dataset.parcellationRegion.map(r => {
      return {
        ...r,
        id: getIdFromDataset(dataset)
      }
    })
  }
}