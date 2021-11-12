const { NotFoundError } = require('./store')

class ProxyStore {
  static async StaticGet(store, req, name) {
    const payload = JSON.parse(await store.get(name))
    const { expiry, value, ...rest } = payload
    if (expiry && (Date.now() > expiry)) {
      await store.del(name)
      throw new NotFoundError('Expired')
    }
    // backwards compatibility for depcObjStore .
    // when depcObjStore is fully removed, || rest can also be removed
    return value || rest
  }

  constructor(store){
    this.store = store
  }
  async get(req, name) {
    return await ProxyStore.StaticGet(this.store, req, name)
  }

  async set(req, name, value) {
    const supplementary = req.user
    ? {
        userId: req.user.id,
        expiry: null
      }
    : {
        userId: null,
        expiry: Date.now() + 1000 * 60 * 60 * 72
      }
    
    const fullPayload = {
      value,
      ...supplementary
    }
    return await this.store.set(name, JSON.stringify(fullPayload))
  }
}

const NotExactlyPromiseAny = async arg => {
  const errs = []
  for (const pr of arg) {
    try{
      return await pr
    } catch (e) {
      errs.push(e)
    }
  }
  throw new NotFoundError(errs)
}

module.exports = {
  ProxyStore,
  NotExactlyPromiseAny
}
