const { spawn } = require("child_process")
const path = require('path')
const glob = require('glob')
describe('> generating screenshot', () => {
  let childProcess
  const matchCwdPath = path.join(__dirname, '../src')
  const matches = glob.sync('**/*.e2e-screenshot.js', { cwd: matchCwdPath })
  const cwdPath = path.join(__dirname, '../../deploy/')
  
  beforeAll(done => {
    throw "Need to reimplement. backend is rewritten from node to python"
    childProcess = spawn('node', ['server.js'],  {
      cwd: cwdPath,
      env: {
        ...process.env,
        BUILD_TEXT: ''
      }
    })
    setTimeout(done, 1000)
  })

  for (const match of matches) {
    const requirePath = path.join(matchCwdPath, match)
    require(requirePath)
  }
  afterAll(() => {
    childProcess.kill()
  })
})
