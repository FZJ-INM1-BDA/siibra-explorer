const router = require('express').Router()
const query = require('./query')
const path = require('path')
const { detEncoding } = require('../compression')

/**
 * root path fetches all templates
 */
router.get('/', (req, res, next) => {
  const baseUrl = req.baseUrl
  query.getAllTemplates()
    .then(templates => {
      const templatesRes = templates.map(v => path.join(baseUrl.slice(1), v))
      res.status(200).send(JSON.stringify(templatesRes))
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

      res.set('Content-Encoding', acceptedEncoding)
      query.getTemplate({ template, acceptedEncoding, returnAsStream:true }).pipe(res)
    })
    .catch(error => next({
      code: 500,
      error,
      trace: 'getTemplate/template'
    }))
})

module.exports = router