const express = require('express')
const datasetsRouter = express.Router()
const { init, getDatasets } = require('./query')

init()

datasetsRouter.get('/templateName/:templateName', (req, res, next) => {
  const { templateName } = req.params
  getDatasets({ templateName })
    .then(ds => {
      res.status(200).send(JSON.stringify(ds))
    })
    .catch(error => {
      next({
        code: 500,
        error
      })
    })
})



datasetsRouter.get('/parcellationName/:parcellationName', (req, res) => {
  const { parcellationName } = req.params
  getDatasets({ parcellationName })
    .then(ds => {
      res.status(200).send(JSON.stringify(ds))
    })
    .catch(error => {
      next({
        code: 500,
        error
      })
    })
})

module.exports = datasetsRouter