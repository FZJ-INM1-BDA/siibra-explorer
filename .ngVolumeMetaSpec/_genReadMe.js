const fs = require("fs")
const { promisify } = require("util")
const asyncRead = promisify(fs.readFile)
const asyncWrite = promisify(fs.writeFile)
const path = require("path")

/**
 * @typedef {Object} JsonSchemaObj
 * @property {string} title
 * @property {'boolean'|'object'|'string'|'number'|'array'} type
 * @property {string|number} const
 * @property {string} $ref
 * @property {JsonSchemaObj[]} oneOf
 * @property {string} description
 * @property {string[]} required
 * @property {JsonSchemaObj} items
 * @property {Object.<string, JsonSchemaObj>} definitions
 * @property {Object.<string, JsonSchemaObj>} properties
 *
 */

/**
 * @param {JsonSchemaObj} rootObj
 */
function parseRootObj(rootObj) {
  const { definitions } = rootObj
  
  /**
   * @type {Object.<string, JsonSchemaObj>}
   */
  const definitionsToBeAppended = {
    ...definitions
  }
  
  let md = ``

  /**
   * @param {JsonSchemaObj} obj
   * @return {string}
   */
  function getType(obj){
    const { const: _const, type, oneOf, $ref } = obj
    if (_const) {
      return `\`${JSON.stringify(obj['const'])}\``
    }
    if (type === "array") {
      return `(${getType(obj.items)})[]`
    }
    if (type === "object") {
      const { key } = resolveRef(obj)
      return `[${obj.title}](#${key})`
    }
    if (type) {
      return type
    }
    if (oneOf) {
      return oneOf.map(getType).join(" \\|\\| ")
    }
    if ($ref) {
      const { key, obj: _obj } = resolveRef(obj)
      return `[${_obj.title}](#${key})`
    }
  }


  /**
   * 
   * @param {JsonSchemaObj} obj 
   */
  function resolveRef(obj){
    for (const key in definitionsToBeAppended) {
      if (definitionsToBeAppended[key] === obj) {
        return {
          key: `definitions-${key}`,
          obj
        }
      }
    }
    const { $ref } = obj
    
    if (!$ref.startsWith("#/definitions/")) {
      throw new Error(`ref must start with definitions (for now)`)
    }
    const key = $ref.replace("#/definitions/", "")
    if (!(key in definitionsToBeAppended)) {
      throw new Error(`key ${key} not in definitions`)
    }
    return { key: `definitions-${key}`, obj: definitionsToBeAppended[key]}
  }

  /**
   * 
   * @param {JsonSchemaObj} obj 
   */
  function parseObj(obj){
    let _md = ``

    const {
      title = "untitled schema",
      description,
      type,
      properties,
      oneOf,
      $ref,
      const: _const,
      required=[]
    } = obj


    _md += `\n\n# ${title}`

    if (description) {
      _md += `\n\n${description}`
    }

    if ($ref) {
      const { obj, key } = resolveRef($ref)
      _md += `see [${obj.title}](#${key})`
      return
    }

    if (type) {
      _md += `\n\ntype: \`${type}\`\n`
    }

    if (properties) {
      _md += `\n\n| property | type | required |`
      _md += `\n| --- | --- | --- |`
      for (const prop in properties) {
        if (properties[prop].type === "object") {
          definitionsToBeAppended[prop] = properties[prop]
        }
        _md += `\n| ${prop} | ${getType(properties[prop])} | ${required.includes(prop) || ''} |`
      }
    }
    if (oneOf) {
      _md += "\n\nOne of:"
      for (const item of oneOf){
        /**
         * TODO fix this properly
         */
        if (!item.const) {
          throw new Error(`must be const`)
        }
      }
      _md += "\n\n"
      _md += oneOf.map(v => `\`${v.const}\``).join(" , ")
    }
    return _md
  }

  md += parseObj(rootObj)

  /**
   * do first pass, to populate 
   */
  let lenDef
  let newLenDef
  do {
    lenDef = Object.keys(definitionsToBeAppended).length
    for (const key in definitionsToBeAppended) {
      const obj = definitionsToBeAppended[key]
      parseObj(obj)
    }
    newLenDef = Object.keys(definitionsToBeAppended).length
  } while (lenDef !== newLenDef)

  for (const key in definitionsToBeAppended) {
    const obj = definitionsToBeAppended[key]
    const { key:_key } = resolveRef(definitionsToBeAppended[key])

    md += `\n\n<a name="${_key}"></a>`
    md += parseObj(obj)
  }

  return md
}


const main = async () => {
  const pathToSchema = path.resolve(__dirname, "meta.schema.v1.json")
  
  const file = await asyncRead(pathToSchema, "utf-8")
  const result = JSON.parse(file)
  const md = parseRootObj(result)

  const pathToReadme = path.resolve(__dirname, "README.md")
  const txt = await asyncRead(pathToReadme, "utf-8")
  
  const newTxt = txt.replace(/Content below is autogenerated from schema.+/s, s => `Content below is autogenerated from schema\n---\n${md}`)
  await asyncWrite(pathToReadme, newTxt, "utf-8")
}

main()