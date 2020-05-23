
const crypto = require('crypto')
const { stub, spy } = require('sinon')

class OIDCStub{

  setupOIDCStub({ rejects, client: _client } = {}) {
    
    // delete require cache, so it can be imported again
    // in case env are rewritten

    delete require.cache[require.resolve('./oidc')]
    const OIDC = require('./oidc')

    this.jwtDecodeReturn = { exp: Math.floor( (Date.now() / 1e3) * 60 * 60 ) }
    this.configureAuthStub = stub(OIDC, 'configureAuth')
    this.jwtDecodeStub = stub(OIDC, 'jwtDecode').returns(this.jwtDecodeStub)
    this.refresh = (...arg) => {
      const {
        access_token,
        refresh_token,
        id_token,
      } = this
      return {
        access_token,
        refresh_token,
        id_token
      }
    }

    this.access_token = crypto.randomBytes(16).toString('hex')
    this.refresh_token = crypto.randomBytes(16).toString('hex')
    this.id_token = crypto.randomBytes(16).toString('hex')

    const { refresh } = this
    const client = _client || { refresh }
    
    if (rejects) {
      this.configureAuthStub.rejects()
    } else {
      this.configureAuthStub.resolves({ client })
    }
    
    this.refreshSpy = client && client.refresh && spy(client, 'refresh')

    const { access_token, id_token, refreshSpy, refresh_token, configureAuthStub, cleanup, jwtDecodeReturn, jwtDecodeStub } = this
    return {
      access_token,
      refresh_token,
      id_token,
      configureAuthStub,
      refreshSpy,
      jwtDecodeReturn,
      jwtDecodeStub,
      cleanup: cleanup.bind(this)
    }
  }

  cleanup(){
    const { configureAuthStub, refreshSpy } = this
    configureAuthStub && configureAuthStub.resetHistory()
    refreshSpy && refreshSpy.resetHistory()
  }
}

exports.OIDCStub = OIDCStub
