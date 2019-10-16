const csp = require('helmet-csp')
const bodyParser = require('body-parser')

let WHITE_LIST_SRC, DATA_SRC, SCRIPT_SRC

const reportOnly = process.env.NODE_ENV !== 'production'

try {
  WHITE_LIST_SRC = JSON.parse(process.env.WHITE_LIST_SRC || '[]')
} catch (e) {
  console.warn(`parsing WHITE_LIST_SRC error ${process.env.WHITE_LIST_SRC}`, e)
  WHITE_LIST_SRC = []
}

try {
  SCRIPT_SRC = JSON.parse(process.env.SCRIPT_SRC || '[]')
} catch (e) {
  console.warn(`parsing SCRIPT_SRC error ${process.env.SCRIPT_SRC}`, e)
  SCRIPT_SRC = []
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
  '*.apps-dev.hbp.eu'
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
        ...defaultAllowedSites,
        ...WHITE_LIST_SRC
      ],
      styleSrc: [
        ...defaultAllowedSites,
        '*.bootstrapcdn.com',
        '*.fontawesome.com',
        "'unsafe-inline'", // required for angular [style.xxx] bindings
        ...WHITE_LIST_SRC
      ],
      fontSrc: [
        '*.fontawesome.com',
        ...WHITE_LIST_SRC
      ],
      connectSrc: [
        ...defaultAllowedSites,
        ...dataSource,
        ...WHITE_LIST_SRC
      ],
      scriptSrc:[
        "'self'",
        '*.apps.hbp.eu',
        '*.apps-dev.hbp.eu',
        '*.jquery.com',
        '*.cloudflare.com',
        'unpkg.com',
        '*.unpkg.com',
        '*.jsdelivr.net',
        ...SCRIPT_SRC,
        ...WHITE_LIST_SRC
      ],
      reportUri: '/report-violation'
    },
    reportOnly
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