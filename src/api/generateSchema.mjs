import ts from 'typescript'
import path, { dirname } from 'path'
import { fileURLToPath } from "url"
import { readFile, writeFile, readdir, stat, copyFile, mkdir } from "node:fs/promises"
import { clearDirectory, resolveAllDefs, populateReadme } from "./tsUtil.mjs"
import { processNode } from "./tsUtil/index.mjs"

/**
 * @typedef {import('./tsUtil/index.mjs').JSchema} JSchema
 * @typedef {import("./tsUtil.mjs").TSNodeObjTypeAliasDec} TSNodeObjTypeAliasDec
 */


const __dirname = dirname(fileURLToPath(import.meta.url))

const NAMESPACE = `sxplr`
const dirnames = {
  handshake: path.join(__dirname, './handshake'),
  broadcast: path.join(__dirname, './broadcast'),
  request: path.join(__dirname, './request'),
}

/**
 * 
 * @param {TSNodeObjTypeAliasDec} broadcastNode 
 * @param {ts.SourceFile} node
 */
async function populateBroadCast(broadcastNode, node){
  
  await clearDirectory(dirnames.broadcast)
  
  /**
   * @type {JSchema}
   */
  let output = {}
  for (const member of broadcastNode.type.members){
    output = await processNode(output, member, {})
  }
  for (const prop in output.properties) {
    /**
     * @type {JSchema}
     */
    let newSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        jsonrpc: {
          const: "2.0"
        },
        method: {
          const: `${NAMESPACE}.on.${prop}`
        },
        params: output.properties[prop]
      }
    }
    const filename = `${NAMESPACE}.on.${prop}__fromSxplr__request.json`
    newSchema = await resolveAllDefs(newSchema, node)
    await writeFile(path.join(dirnames.broadcast, filename), JSON.stringify(newSchema, null, 2), 'utf-8')
  }
  await populateReadme(dirnames.broadcast)
}

/**
 * @typedef {Object.<string, { request: JSchema, response: JSchema }>} ConvoType
 */

/**
 * 
 * @param {ts.Node} convoNode
 * @param {ts.SourceFile} node
 * @returns {Promise<ConvoType>}
 */
async function populateConversations(convoNode, node){
  if (convoNode.kind !== ts.SyntaxKind.TypeAliasDeclaration) {
    throw new Error(`Expecting all conversations to be type alias delcaration, but is ${convoNode.kind}, ${ts.SyntaxKind[convoNode.kind]}`)
  }
  
  /**
   * @type {JSchema}
   */
  let output = {}
  for (const member of convoNode.type.members){
    output = await processNode(output, member, {})
  }

  /**
   * @type {ConvoType}
   */
  const returnObj = {}
  for (const eventName in output.properties) {
    returnObj[eventName] = output.properties[eventName].properties
  }
  return returnObj
}

/**
 * 
 * @param {ts.Node} convoNode
 * @param {ts.SourceFile} node
 */
async function populateHeartbeatEvents(convoNode, node){
  await clearDirectory(dirnames.handshake)
  const output = await populateConversations(convoNode, node)
  for (const eventName in output){
    const { response } = output[eventName]

    /**
     * request
     */
    const reqFilename = `${NAMESPACE}.${eventName}__fromSxplr__request.json`
    /**
     * @type {JSchema}
     */
    let reqSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        id: {
          type: "string"
        },
        jsonrpc: {
          const: "2.0"
        },
        method: {
          const: `${NAMESPACE}.${eventName}`
        }
      }
    }
    reqSchema = await resolveAllDefs(reqSchema, node)
    await writeFile(path.join(dirnames.handshake, reqFilename), JSON.stringify(reqSchema, null, 2), "utf-8")

    /**
     * resp
     */
    if (!!response) {
      
      /**
       * request
       */
      const respFilename = `${NAMESPACE}.${eventName}__fromSxplr__response.json`
      /**
       * @type {JSchema}
       */
      let respSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          jsonrpc: {
            const: "2.0"
          },
          id: {
            type: "string"
          },
          result: response
        }
      }
      respSchema = await resolveAllDefs(respSchema, node)
      await writeFile(path.join(dirnames.handshake, respFilename), JSON.stringify(respSchema, null, 2), "utf-8")
    }
  }
  await populateReadme(dirnames.handshake)
}

/**
 * 
 * @param {ts.Node} convoNode 
 * @param {ts.SourceFile} node 
 */
async function populateBoothEvents(convoNode, node){
  await clearDirectory(dirnames.request)
  const output = await populateConversations(convoNode, node)
  for (const eventName in output){
    const { request, response } = output[eventName]
    /**
     * request
     */
    const reqFilename = `${NAMESPACE}.${eventName}__toSxplr__request.json`
    /**
     * @type {JSchema}
     */
    let reqSchema = {
      "$schema": "http://json-schema.org/draft-07/schema#",
      type: "object",
      properties: {
        id: {
          type: "string"
        },
        jsonrpc: {
          const: "2.0"
        },
        method: {
          const: `${NAMESPACE}.${eventName}`
        },
        params: request
      }
    }
    reqSchema = await resolveAllDefs(reqSchema, node)
    await writeFile(path.join(dirnames.request, reqFilename), JSON.stringify(reqSchema, null, 2), "utf-8")

    /**
     * resp
     */
    if (!!response) {
      
      /**
       * request
       */
      const respFilename = `${NAMESPACE}.${eventName}__toSxplr__response.json`
      /**
       * @type {JSchema}
       */
      let respSchema = {
        "$schema": "http://json-schema.org/draft-07/schema#",
        type: "object",
        properties: {
          jsonrpc: {
            const: "2.0"
          },
          id: {
            type: "string"
          },
          result: response
        }
      }
      respSchema = await resolveAllDefs(respSchema, node)
      await writeFile(path.join(dirnames.request, respFilename), JSON.stringify(respSchema, null, 2), "utf-8")
    }
  }
  
  await populateReadme(dirnames.request)
}


/**
 * 
 * @param {string} root 
 * @returns {Promise<string[]>}
 */
async function allMdJsonFiles(root){
  const files = await readdir(root)
  const returnVal = []
  for (const file of files){
    const filepath = path.join(root, file)
    const filestat = await stat(filepath)
    if (filestat.isFile() && (file.endsWith(".json") || file.endsWith(".md"))) {
      returnVal.push(filepath)
    }
    if (filestat.isDirectory()) {
      returnVal.push(
        ...(await allMdJsonFiles(filepath))
      )
    }
  }
  return returnVal
}

const main = async () => {
  const pathToApiService = path.join(__dirname, '../api/service.ts')
  const src = await readFile(pathToApiService, 'utf-8')
  const node = ts.createSourceFile(
    './x.ts',
    src,
    ts.ScriptTarget.Latest
  )
  
  const broadcast = node.forEachChild(n => {
    if (n.name?.text === "BroadCastingApiEvents") {
      return n
    }
  })
  await populateBroadCast(broadcast, node)
  
  const heartbeat = node.forEachChild(n => {
    if (n.name?.text === "HeartbeatEvents") {
      return n
    }
  })
  await populateHeartbeatEvents(heartbeat, node)

  const booth = node.forEachChild(n => {
    if (n.name?.text === "ApiBoothEvents") {
      return n
    }
  })
  await populateBoothEvents(booth, node)


  // copy to doc directory
  
  const root = path.join(__dirname, "..", "..")
  const apiJsonMd = await allMdJsonFiles(path.join(root, "src/api"))
  const relativeFilePaths = apiJsonMd.map(filename => 
    path.relative(
      path.join(root, "src"),
      filename
    )
  )
  for (const filename of apiJsonMd){
    const relative = path.relative(
      path.join(root, "src"),
      filename
    )
    const dstpath = path.join(root, "docs/advanced", relative)
    const dstdir = path.dirname(dstpath)
    await mkdir(dstdir, {
      recursive: true,
    })
    await copyFile(filename, dstpath)
    if (filename.endsWith(".md")) {
      const md = await readFile(dstpath)
      await writeFile(dstpath, `<!-- DO NOT MODIFY DIRECTLY. CREATED PROGRAMMATICALLY WITH src/api/generateSchema.mjs -->\n${md}`)
    }
  }
}

main()
