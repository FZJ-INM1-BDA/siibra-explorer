const { Seafile } = require('hbp-seafile')
const { Readable } = require('stream')

const IAV_DIR_NAME = `interactive-atlas-viewer`
const IAV_DIRECTORY = `/${IAV_DIR_NAME}/`
const IAV_FILENAME = 'data.json'

const getNewSeafilehandle = async ({ accessToken }) => {
  const seafileHandle = new Seafile({ accessToken })
  await seafileHandle.init()
  return seafileHandle
}

const saveUserData = async (user, data) => {
  const { access_token } = user && user.tokenset || {}
  if (!access_token) throw new Error(`user or user.tokenset not set can only save logged in user data`)

  let handle = await getNewSeafilehandle({ accessToken: access_token })

  const s = await handle.ls()
  const found = s.find(({ type, name }) => type === 'dir' && name === IAV_DIR_NAME)

  // if dir exists, check permission. throw if no writable or readable permission
  if (found && !/w/.test(found.permission) && !/r/.test(found.permission)){
    throw new Error(`Writing to file not permitted. Current permission: ${found.permission}`)
  }

  // create new dir if does not exist. Should have rw permission
  if (!found) {
    await handle.mkdir({ dir: IAV_DIR_NAME })
  }

  const fileLs = await handle.ls({ dir: IAV_DIRECTORY })
  const fileFound = fileLs.find(({ type, name }) => type === 'file' && name === IAV_FILENAME )

  const rStream = new Readable()
  rStream.path = IAV_FILENAME
  rStream.push(JSON.stringify(data))
  rStream.push(null)

  if(!fileFound) {
    console.log('>>> file not found, upload')
    return handle.uploadFile({ readStream: rStream, filename: `${IAV_FILENAME}` }, { dir: IAV_DIRECTORY })
  }

  if (fileFound && !/w/.test(fileFound.permission)) {
    return new Error('file permission cannot be written')
  }

  console.log('>>> file found, udpate')
  return handle.updateFile({ dir: IAV_DIRECTORY, replaceFilepath: `${IAV_DIRECTORY}${IAV_FILENAME}` }, { readStream: rStream, filename: IAV_FILENAME })
}

const readUserData = async (user) => {
  const { access_token } = user && user.tokenset || {}
  if (!access_token) throw new Error(`user or user.tokenset not set can only save logged in user data`)

  let handle = await getNewSeafilehandle({ accessToken: access_token })
  try {
    const r = await handle.readFile({ dir: `${IAV_DIRECTORY}${IAV_FILENAME}` })
    return JSON.parse(r)
  }catch(e){
    return {}
  }
}

module.exports = {
  saveUserData,
  readUserData
}
