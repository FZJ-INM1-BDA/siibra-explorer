const ts = require('typescript')


function processIndexAccessor(mem) {
  if (ts.SyntaxKind[mem.kind] !== "IndexedAccessType") {
    throw new Error(`Index accessor needs to have index accessor type as mem.kind`)
  }
  return `${getTypeText(mem.objectType)}[${getTypeText(mem.indexType)}]`
}

function getTypeText(node){
  switch(ts.SyntaxKind[node.kind]) {
    case "TypeReference": {
      return node.typeName.text
    }
    case "ArrayType": {
      if (!node.elementType.typeName) return getTypeText(node.elementType)
      return `${node.elementType.typeName.text}[]`
    }
    case "TypeLiteral": {
      let returnVal = '{'
      returnVal += node.members.map(mem => `"${mem.name.text}": ${getTypeText(mem.type)}`).join(', ')
      returnVal += "}"
      return returnVal
    }
    case "LiteralType": {
      if (ts.SyntaxKind[node.literal.kind] === "NullKeyword"){
        return `null`
      }
      if (ts.SyntaxKind[node.literal.kind] === "StringLiteral"){
        return `'${node.literal.text}'`
      }
      throw new Error(`LiteralType not caught`)
    }
    case "BooleanKeyword": {
      return `boolean`
    }
    case "StringKeyword": {
      return `string`
    }
    case "IntersectionType": {
      return node.types.map(getTypeText).join(' & ')
    }
    case "UnionType": {
      return node.types.map(getTypeText).join(' | ')
    }
    case 'PropertySignature': {
      return processPropertySignature(node)
    }
    case 'IndexedAccessType': {
      return processIndexAccessor(node)
    }
    default: {
      debugger
      throw new Error(`No parser for type ${ts.SyntaxKind[node.kind]}`)
    }
  }
}

function processPropertySignature(node) {
  const output = {}
  debugger
}

function processNodeMember(mem, typeAliasDeclarationMap = new Map()) {
  if (ts.SyntaxKind[mem.kind] === "IndexedAccessType") {
    return processIndexAccessor(mem)
  }
  if (ts.SyntaxKind[mem.kind] === "TypeReference") {
    return mem.typeName.text
  }
  if (ts.SyntaxKind[mem.kind] !== "PropertySignature") {
    throw new Error(`mem.kind should be of PropertySignature, but is instead ${ts.SyntaxKind[mem.kind]}`)
  }
  const typeText = getTypeText(mem.type)
  if (typeAliasDeclarationMap.has(typeText)) {
    return getTypeText(typeAliasDeclarationMap.get(typeText).type)
  }
  return typeText
}

function processTypeAliasDeclaration(node) {
  const output = {}
  const kind = ts.SyntaxKind[node.kind]
  if (kind !== 'TypeAliasDeclaration') throw new Error(`processTypeAliasDeclaration should be of TypeAliasDeclaration`)
  for (const mem of node.type.members) {
    output[mem.name.text] = processNodeMember(mem)
  }
  return output
}

function processRequestTypeAlias(node, typeAliasDeclarationMap = new Map()) {
  const kind = ts.SyntaxKind[node.kind]
  if (kind !== 'TypeAliasDeclaration') throw new Error(`processTypeAliasDeclaration should be of TypeAliasDeclaration`)
  if (!node.type.members.every(mem => ts.SyntaxKind[mem.type.kind] === "TypeLiteral")) {
    throw new Error(`for request type alias, expected every type.members to be of type TypeLiteral`)
  }

  const output = {}
  for (const mem of node.type.members) {
    
    const requestNode = mem.type.members.find(typeMem => typeMem.name.text === "request")
    const responseNode = mem.type.members.find(typeMem => typeMem.name.text === "response")
    if (!requestNode || !responseNode) {
      let errorText = `for request type alias, every member must have both response and request defined, but ${node.name.text}.${mem.name.text} does not have `
      if (!requestNode) {
        errorText += " request "
      }
      if (!responseNode) {
        errorText += " response "
      }
      errorText += "defined."
      throw new Error(errorText)
    }
    if (!requestNode) {
      throwFlag = true
      errorText += ` request `
    }
    output[mem.name.text] = {
      request: processNodeMember(requestNode, typeAliasDeclarationMap),
      response: processNodeMember(responseNode, typeAliasDeclarationMap)
    }
  }
  return output
}

module.exports = {
  processTypeAliasDeclaration,
  processRequestTypeAlias,
}