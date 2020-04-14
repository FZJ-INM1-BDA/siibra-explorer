const { spawn } = require("child_process")
const path = require('path')
const glob = require('glob')
describe('> generating screenshot', () => {
  let childProcess
  const matches = glob.sync('**/*.e2e-screenshot.js', { cwd: path.join(__dirname, '../src') })
  const cwdPath = path.join(__dirname, '../../deploy/')
  
  beforeAll(done => {
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
    const requirePath = path.join(cwdPath, match)
    require(requirePath)
  }
  afterAll(() => {
    childProcess.kill()
  })
})
