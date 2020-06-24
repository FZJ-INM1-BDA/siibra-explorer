const { spawn } = require("child_process")
const { expect, assert } = require('chai')
const path = require('path')
const got = require('got')

const PORT = process.env.PORT || 3000

describe('> server.js', () => {
  const cwdPath = path.join(__dirname)

  describe('> HOST_PATHNAME env var parsed correctly', () => {

    it('> throws if HOST_PATHNAME does not start with a leading hash', done => {
      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          HOST_PATHNAME: 'viewer'
        }
      })
  
      const timedKillSig = setTimeout(() => {
        childProcess.kill()
      }, 500)
      
      childProcess.on('exit', (code) => {
        childProcess.kill()
        clearTimeout(timedKillSig)
        expect(code).to.be.greaterThan(0)
        done()
      })
    })
  
    it('> throws if HOST_PATHNAME ends with slash', done => {

      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          HOST_PATHNAME: '/viewer/'
        }
      })
  
      const timedKillSig = setTimeout(() => {
        childProcess.kill(0)
      }, 500)
      
      childProcess.on('exit', (code) => {
        clearTimeout(timedKillSig)
        expect(code).to.be.greaterThan(0)
        done()
      })
    })

    it('> does not throw if HOST_PATHNAME leads with slash, but does not end with slash', done => {
  
      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        stdio: 'inherit',
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT,
          HOST_PATHNAME: '/viewer'
        }
      })

      const timedKillSig = setTimeout(() => {
        console.log('killing on timeout')
        childProcess.kill()
      }, 500)
      
      childProcess.on('exit', (code, signal) => {
        clearTimeout(timedKillSig)
        expect(signal).to.equal('SIGTERM')
        done()
      })
    })
  })


  describe('> redirection', () => {
    let childProcess
    before(done => {
      const cwdPath = path.join(__dirname)
      childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          NODE_ENV: 'test',
          PORT,
          HOST_PATHNAME: '/viewer'
        }
      })
      setTimeout(done, 1000)
    })
  
    it('> redirects as expected', async () => {
      const { statusCode } = await got(`http://localhost:${PORT}/viewer`, {
        followRedirect: false
      })
      expect(statusCode).to.be.greaterThan(300)
      expect(statusCode).to.be.lessThan(303)
    })
  
    after(() => {
      childProcess.kill()
    })
  })
})
