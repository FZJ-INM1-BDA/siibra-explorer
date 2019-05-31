const router = require('express').Router()
const { getSpatialDatasets } = require('./query')

const badRequestString = `spatialSearch endpoint uses param as follows:

GET /templateName/<templateName>/<queryGeometry>/<queryArg>

for example;

GET /templateName/Colin/bbox/0_0_0__1_1_1`

router.get('/templateName/:templateName/:queryGeometry/:queryArg', (req, res, next) => {
  const { templateName, queryGeometry, queryArg } = req.params
  let errorString = ``
  if (!templateName)
    errorString += `templateName is required\n`
  if (!queryGeometry)
    errorString += `queryGeometry is required\n`
  if (!queryArg)
    errorString += `queryArg is required\n`
  if (errorString !== ``)
    return next({
      code: 400,
      error: errorString,
      trace: 'dataset#spatialRouter'
    })
  
  getSpatialDatasets({ templateName, queryGeometry, queryArg })
    .then(arr => res.status(200).json(arr))
    .catch(error => {
      next({
        code: 500,
        error,
        trace: 'dataset#spatialRouter#getSpatialDatasets'
      })
    })
})

router.use((req, res, next) => {
  next({
    code: 400,
    error: badRequestString,
    trace: 'dataset#spatialRouter#notFound'
  })
})

module.exports = router