import ts from 'typescript'
import path, { dirname } from 'path'
import { fileURLToPath } from "url"
import { readFile, writeFile } from "node:fs/promises"
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

const main = async () => {
  const pathToApiService = path.join(__dirname, '../api/service.ts')
  const src = await readFile(pathToApiService, 'utf-8')
  const node = ts.createSourceFile(
    './x.ts',
    src,
    ts.ScriptTarget.Latest
  )
  node.forEachChild(n => {
    if (n.name?.text === "BroadCastingApiEvents") {
      populateBroadCast(n, node)
    }
    if (n.name?.text === "HeartbeatEvents") {
      populateHeartbeatEvents(n, node)
    }
    if (n.name?.text === "ApiBoothEvents") {
      populateBoothEvents(n, node)
    }
  })
    
}

main()
