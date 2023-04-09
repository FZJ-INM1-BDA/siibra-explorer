const got = require('got')

const apiPath = '/api/v4'
const saneUrlVer = `0.0.1`
const titlePrefix = `[saneUrl]`

const {
  __DEBUG__,
  GITLAB_ENDPOINT,
  GITLAB_PROJECT_ID,
  GITLAB_TOKEN
} = process.env

class NotFoundError extends Error{}

class NotImplemented extends Error{}

class GitlabSnippetStore {
  constructor(){
    
    if (
      GITLAB_ENDPOINT
      && GITLAB_PROJECT_ID
      && GITLAB_TOKEN
    ) {
      this.url = `${GITLAB_ENDPOINT}${apiPath}/projects/${GITLAB_PROJECT_ID}/snippets`
      this.token = GITLAB_TOKEN
      return
    }
    throw new NotImplemented('Gitlab snippet key value store cannot be configured')
  }

  _promiseRequest(...arg) {
    return got(...arg).text()
  }

  _request({ addPath = '', method = 'GET', headers = {}, opt = {} } = {}) {
    return got(`${this.url}${addPath}?per_page=1000`, {
      method,
      headers: {
        'PRIVATE-TOKEN': this.token,
        ...headers
      },
      ...opt
    }).text()
  }

  async get(id) {
    const list = JSON.parse(await this._request())
    const found = list.find(item => item.title === `${titlePrefix}${id}`)
    if (!found) throw new NotFoundError()
    const payloadObj = found.files.find(f => f.path === 'payload')
    if (!payloadObj) {
      console.error(`id found, but payload not found... this is strange. Check id: ${id}`)
      throw new NotFoundError()
    }
    if (!payloadObj.raw_url) {
      throw new Error(`payloadObj.raw_url not found!`)
    }
    return await this._promiseRequest(payloadObj.raw_url)
  }

  async set(id, value) {
    return await this._request({
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      opt: {
        json: {
          title: `${titlePrefix}${id}`,
          description: `Created programmatically. v${saneUrlVer}`,
          visibility: 'public',
          files: [{
            file_path: 'payload',
            content: value
          }]
        }
      }
    })
  }

  async del(id) {
    return await this._request({
      addPath: `/${id}`,
      method: 'DELETE',
    })
  }

  async dispose(){
    
  }

  async healthCheck(){
    return true
  }
}

exports.GitlabSnippetStore = GitlabSnippetStore
exports.NotFoundError = NotFoundError
