const router = require('express').Router()
const query = require('./query')
const path = require('path')
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
  query.getAllTemplates()
    .then(templates => {
      if (templates.indexOf(template) < 0) 
        return next({
          code : 404,
          error: 'template not in the list supported'
        })
      return query.getTemplate(template)
    })
    .then(data => {
      if (data) res.status(200).json(data)
      else throw new Error('data returned falsy')
    })
    .catch(error => next({
      code: 500,
      error,
      trace: 'getTemplate/template'
    }))
})

module.exports = router