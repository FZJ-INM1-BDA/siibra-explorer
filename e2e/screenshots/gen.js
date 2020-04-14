const { spawn } = require("child_process")
const path = require('path')
const glob = require('glob')
describe('> generating screenshot', () => {
  let childProcess
  beforeAll(done => {
    const cwdPath = path.join(__dirname, '../../deploy/')
    childProcess = spawn('node', ['server.js'],  {
      cwd: cwdPath
    })
    setTimeout(done, 1000)
  })

  require('../src/selecting/share.e2e-screenshot')
  glob('../src/**/*.e2e-screenshot.js', (err, matches) => {
    if (err) throw err
    for (const match of matches) {
      require(match)
    }
  })

  afterAll(() => {
    childProcess.kill()
  })
})
