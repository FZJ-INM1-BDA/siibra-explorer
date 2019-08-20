const csp = require('helmet-csp')
const bodyParser = require('body-parser')

let ALLOWED_DEFAULT_SRC, DATA_SRC

try {
  ALLOWED_DEFAULT_SRC = JSON.parse(process.env.ALLOWED_DEFAULT_SRC || '[]')
} catch (e) {
  console.warn(`parsing ALLOWED_DEFAULT_SRC error ${process.env.ALLOWED_DEFAULT_SRC}`, e)
  ALLOWED_DEFAULT_SRC = []
}

try {
  DATA_SRC = JSON.parse(process.env.DATA_SRC || '[]')
} catch (e) {
  console.warn(`parsing DATA_SRC error ${process.env.DATA_SRC}`, e)
  DATA_SRC = []
}

const defaultAllowedSites = [
  "'self'",
  '*.apps.hbp.eu',
  '*.apps-dev.hbp.eu',
  ...ALLOWED_DEFAULT_SRC
]

const dataSource = [
  "'self'",
  '*.humanbrainproject.org',
  '*.humanbrainproject.eu',
  '*.fz-juelich.de',
  ...DATA_SRC
]

module.exports = (app) => {
  app.use(csp({
    directives: {
      defaultSrc: [
        ...defaultAllowedSites
      ],
      styleSrc: [
        ...defaultAllowedSites,
        '*.bootstrapcdn.com',
        '*.fontawesome.com',
        "'unsafe-inline'" // required for angular [style.xxx] bindings
      ],
      fontSrc: [ '*.fontawesome.com' ],
      connectSrc: [
        ...defaultAllowedSites,
        ...dataSource
      ],
      reportUri: '/report-violation'
    },
    reportOnly: true
  }))

  app.post('/report-violation', bodyParser.json({
    type: ['json', 'application/csp-report']
  }), (req, res) => {
    if (req.body) {
      console.warn(`CSP Violation: `, req.body)
    } else {
      console.warn(`CSP Violation: no data received!`)
    }
    res.status(204).end()
  })
}