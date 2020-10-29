const csp = require('helmet-csp')
const bodyParser = require('body-parser')
const crypto = require('crypto')

let WHITE_LIST_SRC, DATA_SRC, SCRIPT_SRC

// TODO bandaid solution
// OKD/nginx reverse proxy seems to strip csp header
// without it, testSafari.js will trigger no unsafe eval csp
const reportOnly = true || process.env.NODE_ENV !== 'production'

const CSP_REPORT_URI = process.env.CSP_REPORT_URI

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
  '*.apps-dev.hbp.eu',
  'stats.humanbrainproject.eu',
  'stats-dev.humanbrainproject.eu'
]

const dataSource = [
  "'self'",
  '*.humanbrainproject.org',
  '*.humanbrainproject.eu',
  '*.fz-juelich.de',
  '*.kfa-juelich.de',
  'object.cscs.ch',
  ...DATA_SRC
]

module.exports = (app) => {
  app.use((req, res, next) => {
    if (req.path === '/') res.locals.nonce = crypto.randomBytes(16).toString('hex')
    next()
  })

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
        "'self'",
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
        (req, res) => res.locals.nonce ? `'nonce-${res.locals.nonce}'` : null,
        ...SCRIPT_SRC,
        ...WHITE_LIST_SRC,
        ...defaultAllowedSites
      ],
      reportUri: CSP_REPORT_URI || '/report-violation'
    },
    reportOnly
  }))

  if (!CSP_REPORT_URI) {
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
}