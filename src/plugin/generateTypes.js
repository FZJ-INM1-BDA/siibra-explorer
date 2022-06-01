const ts = require('typescript')
const fs = require('fs')
const path = require('path')
const { promisify } = require('util')
const asyncReadFile = promisify(fs.readFile)
const asyncWriteFile = promisify(fs.writeFile)
const { processTypeAliasDeclaration, processRequestTypeAlias } = require('./tsUtil')


const typeAliasDeclarationMap = new Map()
const pathToApiService = path.join(__dirname, '../api/service.ts')
const NAMESPACE = `sxplr`
const filenames = {
  handshake: path.join(__dirname, './handshake.md'),
  broadcast: path.join(__dirname, './broadcast.md'),
  request: path.join(__dirname, './request.md'),
}

const puplateBroadCast = async broadcastNode => {
  
  if (!broadcastNode) throw new Error(`broadcastNode must be passed!`)

  const src = await asyncReadFile(filenames.broadcast, 'utf-8')
  const output = processTypeAliasDeclaration(broadcastNode)

  let outputText = ``
  for (const key in output) {
    outputText += `

### \`${NAMESPACE}.on.${key}\`

- payload

  \`\`\`ts
  ${output[key]}
  \`\`\`

`
  }
  const newData = src.replace(/## API(.|\n)+/, s => `## API${outputText}\n`)

  await asyncWriteFile(filenames.broadcast, newData, 'utf-8')
}

const populateConversations = async (filename, node) => {
  const src = await asyncReadFile(filename, 'utf-8')
  const output = processRequestTypeAlias(node, typeAliasDeclarationMap)
      
  let outputText = ``
  for (const key in output) {
    outputText += `
### \`${NAMESPACE}.${key}\`

- request

  \`\`\`ts
  ${output[key]['request']}
  \`\`\`

- response

  \`\`\`ts
  ${output[key]['response']}
  \`\`\`

`
  }
  const newData = src.replace(/## API(.|\n)+/, s => `## API${outputText}`)
  await asyncWriteFile(filename, newData, 'utf-8')
}

const main = async () => {
  const src = await asyncReadFile(pathToApiService, 'utf-8')
  const node = ts.createSourceFile(
    './x.ts',
    src,
    ts.ScriptTarget.Latest
  )
  node.forEachChild(n => {
    if (ts.SyntaxKind[n.kind] === "TypeAliasDeclaration") {
      typeAliasDeclarationMap.set(n.name?.text, n)
    }
    if (n.name?.text === "BroadCastingApiEvents") {
      puplateBroadCast(n)
    }
    if (n.name?.text === "HeartbeatEvents") {
      populateConversations(filenames.handshake, n)
    }
    if (n.name?.text === "ApiBoothEvents") {
      populateConversations(filenames.request, n)
    }
  })
  
}

main()
