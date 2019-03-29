const express = require('express')
const path = require('path')
const fs = require('fs')

const nehubaConfigRouter = express.Router()

nehubaConfigRouter.get('/:configId', (req, res, next) => {
  const { configId } = req.params
  const configFilePath = path.join(__dirname, '..', 'res', `${configId}.json`)
  fs.readFile(configFilePath, 'utf-8', (error, data) => {
    if (error) 
      return next({
        code: 500,
        error,
        trace: 'fetching config'
      })
    res.status(200).send(data)
  })
})

module.exports = nehubaConfigRouter