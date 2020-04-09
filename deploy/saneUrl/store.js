const { SamlOpenstackWrapper } = require('soswrap')
const request = require('request')

const {
  OBJ_STORAGE_AUTH_URL,
  OBJ_STORAGE_IDP_NAME,
  OBJ_STORAGE_IDP_PROTO,
  OBJ_STORAGE_IDP_URL,
  OBJ_STORAGE_USERNAME,
  OBJ_STORAGE_PASSWORD,
  OBJ_STORAGE_PROJECT_ID,
  OBJ_STORAGE_ROOT_URL,
} = process.env

class NotFoundError extends Error{}

class Store {
  constructor({
    authUrl,
    idPName,
    idPProto,
    idPUrl,
    username,
    password,

    objStorateRootUrl,
  } = {}){

    this.wrapper = new SamlOpenstackWrapper({
      authUrl:   authUrl  || OBJ_STORAGE_AUTH_URL,
      idPName:   idPName  || OBJ_STORAGE_IDP_NAME,
      idPProto:  idPProto || OBJ_STORAGE_IDP_PROTO,
      idPUrl:    idPUrl   || OBJ_STORAGE_IDP_URL,
    })

    this.objStorateRootUrl = objStorateRootUrl || OBJ_STORAGE_ROOT_URL

    this.wrapper.username = username || OBJ_STORAGE_USERNAME
    this.wrapper.password = password || OBJ_STORAGE_PASSWORD

    this.getToken()
  }

  async getToken() {
    this.token = await this.wrapper.getScopedToken({ projectId: OBJ_STORAGE_PROJECT_ID })
    return this.token
  }

  get(id) {
    return new Promise((rs, rj) => {
      request.get(`${this.objStorateRootUrl}/${id}`, {
        headers: {
          'X-Auth-Token': this.token
        }
      }, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode === 404) return rj(new NotFoundError())
        if (resp.statusCode >= 400) return rj(resp)
        return rs(body)
      })
    })
  }

  _set(id, value) {
    return new Promise((rs, rj) => {
      request.put(`${this.objStorateRootUrl}/${id}`, {
        headers: {
          'X-Auth-Token': this.token
        },
        body: value
      }, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode >= 400) return rj(resp)
        return rs(body)
      })
    })
  }

  async set(id, value) {
    try {
      const result = await this._set(id, value)
      return result
    } catch (e) {
      await this.getToken()
      const result = await this._set(id, value)
      return result
    }
  }

  async healthCheck(){

  }
}


exports.Store = Store
exports.NotFoundError = NotFoundError
