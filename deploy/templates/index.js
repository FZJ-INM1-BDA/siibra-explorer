const router = require('express').Router()
const query = require('./query')
const path = require('path')
const { detEncoding } = require('nomiseco')
const url = require('url')
const { getHandleErrorFn } = require('../util/streamHandleError')

/**
 * root path fetches all templates
 */
router.get('/', (req, res, next) => {
  query.getAllTemplates()
    .then(templates => {
      
      const templatesRes = templates.map(v => {
        return url.resolve(`${res.locals.routePathname}/`, v)
      })
      res.status(200).json(templatesRes)
    })
    .catch(error => next({
      code: 500,
      error,
      trace: 'getTemplate'
    }))
})

router.get('/:template', (req, res, next) => {
  const { template } = req.params

  const header = req.get('Accept-Encoding')
  const acceptedEncoding = detEncoding(header)

  query.getAllTemplates()
    .then(templates => {
      if (templates.indexOf(template) < 0) 
        return next({
          code : 404,
          error: 'template not in the list supported'
        })

      if (acceptedEncoding) res.set('Content-Encoding', acceptedEncoding)
      query.getTemplate({ template, acceptedEncoding, returnAsStream:true }).pipe(res).on('error', getHandleErrorFn(req, res))
    })
    .catch(error => next({
      code: 500,
      error,
      trace: 'getTemplate/template'
    }))
})

module.exports = router