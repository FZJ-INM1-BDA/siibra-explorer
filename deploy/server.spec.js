const { spawn } = require("child_process")
const { expect } = require('chai')
const path = require('path')
const got = require('got')

describe('> server.js', () => {
  const cwdPath = path.join(__dirname)

  describe('> HOST_PATHNAME env var parsed correctly', () => {

    it('> throws if HOST_PATHNAME does not start with a leading hash', done => {
      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          HOST_PATHNAME: 'viewer'
        }
      })
  
      const timedKillSig = setTimeout(() => {
        childProcess.kill(0)
      }, 500)
      
      childProcess.on('exit', (code) => {
        clearTimeout(timedKillSig)
        expect(code).not.to.equal(0)
        done()
      })
    })
  
    it('> throws if HOST_PATHNAME ends with slash', done => {

      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          HOST_PATHNAME: '/viewer/'
        }
      })
  
      const timedKillSig = setTimeout(() => {
        childProcess.kill(0)
      }, 500)
      
      childProcess.on('exit', (code) => {
        clearTimeout(timedKillSig)
        expect(code).not.to.equal(0)
        done()
      })
    })

    it('> does not throw if HOST_PATHNAME leads with slash, but does not end with slash', done => {
  
      const childProcess = spawn('node', ['server.js'],  {
        cwd: cwdPath,
        env: {
          ...process.env,
          HOST_PATHNAME: '/viewer'
        }
      })
  
      const timedKillSig = setTimeout(() => {
        childProcess.kill(2)
      }, 500)
      
      childProcess.on('exit', (code) => {
        clearTimeout(timedKillSig)
        expect(code).to.equal(null)
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
          HOST_PATHNAME: '/viewer'
        }
      })
      setTimeout(done, 1000)
    })
  
    it('> redirects as expected', async () => {
      const { statusCode } = await got(`http://localhost:3000/viewer`, {
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
