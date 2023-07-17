const csp = require('helmet-csp')
const bodyParser = require('body-parser')

let WHITE_LIST_SRC, CSP_CONNECT_SRC, SCRIPT_SRC

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
  CSP_CONNECT_SRC = JSON.parse(process.env.CSP_CONNECT_SRC || '[]')
} catch (e) {
  console.warn(`parsing CSP_CONNECT_SRC error ${process.env.CSP_CONNECT_SRC}`, e)
  CSP_CONNECT_SRC = []
}

const defaultAllowedSites = [
  "'self'",
  'stats.humanbrainproject.eu',
  'stats-dev.humanbrainproject.eu'
]

const connectSrc = [
  "'self'",

  // needed by ad hoc generation of URL resources
  "blob:",

  // siibra-api endpoints
  'siibra-api-latest.apps-dev.hbp.eu',
  'siibra-api-rc.apps.hbp.eu',
  'siibra-api-stable.apps.hbp.eu',
  'siibra-api-ns.apps.hbp.eu',
  'siibra-api-stable.apps.jsc.hbp.eu',
  
  // chunk servers
  'neuroglancer.humanbrainproject.org',
  'neuroglancer.humanbrainproject.eu',
  '1um.brainatlas.eu',
  'object.cscs.ch',

  // required for dataset previews

  // spatial transform
  "hbp-spatial-backend.apps.hbp.eu",

  // injected by env var
  ...CSP_CONNECT_SRC
]

module.exports = {
  middelware: (req, res, next) => {

    const permittedCsp = (req.session && req.session.permittedCsp) || {}
    const userConnectSrc = []
    const userScriptSrc = []
    for (const key in permittedCsp) {
      userConnectSrc.push(
        ...(permittedCsp[key]['connect-src'] || []),
        ...(permittedCsp[key]['connectSrc'] || [])
      )
      userScriptSrc.push(
        ...(permittedCsp[key]['script-src'] || []),
        ...(permittedCsp[key]['scriptSrc'] || [])
      )
    }
    csp({
      directives: {
        defaultSrc: [
          ...defaultAllowedSites,
          ...WHITE_LIST_SRC
        ],
        styleSrc: [
          ...defaultAllowedSites,
          'stackpath.bootstrapcdn.com/bootstrap/4.3.1/',
          'use.fontawesome.com/releases/v5.8.1/',
          "'unsafe-inline'", // required for angular [style.xxx] bindings
          ...WHITE_LIST_SRC
        ],
        fontSrc: [
          "'self'",
          'use.fontawesome.com/releases/v5.8.1/',
          ...WHITE_LIST_SRC
        ],
        connectSrc: [
          ...userConnectSrc,
          ...defaultAllowedSites,
          ...connectSrc,
          ...WHITE_LIST_SRC
        ],
        imgSrc: [
          "'self'",
        ],
        scriptSrc:[
          "'self'",
          ...userScriptSrc,
          'unpkg.com/kg-dataset-previewer@1.2.0/', // preview component
          'https://unpkg.com/d3@6.2.0/', // required for preview component
          'https://unpkg.com/mathjax@3.1.2/', // math jax
          'https://unpkg.com/three-surfer@0.0.13/dist/bundle.js', // for threeSurfer (freesurfer support in browser)
          'https://unpkg.com/ng-layer-tune@0.0.18/dist/ng-layer-tune/', // needed for ng layer control
          'https://unpkg.com/hbp-connectivity-component@0.6.6/', // needed for connectivity component
          (req, res) => res.locals.nonce ? `'nonce-${res.locals.nonce}'` : null,
          ...SCRIPT_SRC,
          ...WHITE_LIST_SRC,
          ...defaultAllowedSites
        ],
        frameSrc: [
          "*"
        ],
        reportUri: CSP_REPORT_URI || '/report-violation'
      },
      reportOnly
    })(req, res, next)

  },
  bootstrapReportViolation: app => {
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
