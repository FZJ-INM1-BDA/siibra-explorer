const request = require('request')
const { NotFoundError } = require('./store')

const { OBJ_STORAGE_ROOT_URL } = process.env

class Store {

  get(id) {
    if (!OBJ_STORAGE_ROOT_URL){
      return Promise.reject(
        new NotFoundError()
      )
    }
    return new Promise((rs, rj) => {
      request.get(`${OBJ_STORAGE_ROOT_URL}/${id}`, (err, resp, body) => {
        if (err) return rj(err)
        if (resp.statusCode === 404) return rj(new NotFoundError())
        if (resp.statusCode >= 400) return rj(resp)
        return rs(body)
      })
    })
  }

  async del(id){
    // noop
  }

  async set(id, val){
    throw new Error(`Object store is deprecated. Please use seafile storage instead`)
  }
}

exports.Store = Store
