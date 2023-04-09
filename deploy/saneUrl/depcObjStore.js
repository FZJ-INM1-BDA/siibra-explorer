const got = require('got')
const { NotFoundError } = require('./store')

const { OBJ_STORAGE_ROOT_URL } = process.env

class Store {

  get(id) {
    if (!OBJ_STORAGE_ROOT_URL){
      return Promise.reject(
        new NotFoundError()
      )
    }
    return got(`${OBJ_STORAGE_ROOT_URL}/${id}`).text()
  }

  async del(id){
    // noop
  }

  async set(id, val){
    throw new Error(`Object store is deprecated. Please use seafile storage instead`)
  }
}

exports.Store = Store
