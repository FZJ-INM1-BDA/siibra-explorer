const express = require('express')
const path = require('path')
const fs = require('fs')
const { getTemplateNehubaConfig } = require('./query')

const nehubaConfigRouter = express.Router()

nehubaConfigRouter.get('/:configId', (req, res, next) => {
  const { configId } = req.params
  console.log('nehubaconfigrouter')
  getTemplateNehubaConfig(configId)
    .then(data => res.status(200).send(data))
    .catch(error => next({
      code: 500,
      error,
      trace: 'nehubaConfigRouter#getTemplateNehubaConfig'
    }))
})

module.exports = nehubaConfigRouter