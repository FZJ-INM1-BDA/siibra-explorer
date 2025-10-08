import { readFile, writeFile, stat } from "node:fs/promises"
import { basename } from "path"

const sxplrGithubApi = "https://api.github.com/repos/FZJ-INM1-BDA/siibra-explorer/releases"

const ACTIONS = {
  MAJOR: "major",
  MINOR: "minor",
  BUGFIX: "bugfix"
}

/**
 * 
 * @param {string} version 
 * @returns {number[]}
 */
function parseVersion(version){
  const splittedVersion = version.replace(/^v/, '').split('.')
  if (splittedVersion.length !== 3) {
    throw new Error(`Expected version to be in the form of v?[0-9]+\.[0-9]+\.[0-9]+, but got ${version}`)
  }
  const castToNum = splittedVersion.map(v => Number(v))
  if (castToNum.some(v => isNaN(v))) {
    throw new Error(`Expected version to be in the form of v?[0-9]+\.[0-9]+\.[0-9]+, but got ${version}`)
  }
  return castToNum
}

/**
 * 
 * @returns {Promise<string>}
 */
async function getLatestReleases(){
  const resp = await fetch(sxplrGithubApi)
  const result = await resp.json()
  const lastRelease = result[0]
  const lastTag = lastRelease['tag_name']
  return lastTag // n.b. v{major}.{minor}.{bugfix} <-- has 'v' prepended
}

/**
 * 
 * @param {string} version 
 */
async function updatePackageJson(version){
  const data = await readFile("package.json", "utf-8")
  const currPackageJson = JSON.parse(data)
  currPackageJson["version"] = version
  await writeFile("package.json", JSON.stringify(currPackageJson, null, 2), "utf-8")
}

/**
 * 
 * @param {string} version 
 */
async function ensureReleaseNotes(version) {
  const placeholder = `# v${version}\n\n`
  const pathToReleaseNotes = `docs/releases/v${version}.md`
  try {
    const fd = await stat(pathToReleaseNotes)
  } catch (e) {
    await writeFile(pathToReleaseNotes, placeholder, "utf-8")
  }
}

/**
 * 
 * @param {string} version 
 */
async function ensureMkDocYaml(version){
  const pathToMkYaml = `mkdocs.yml`
  const lineTobeInserted = `    - v${version}: 'releases/v${version}.md'`
  const mkdocsYamlContent = await readFile(pathToMkYaml, "utf-8")
  if (mkdocsYamlContent.includes(lineTobeInserted)) {
    return
  }
  const updatedYamlContent = mkdocsYamlContent.replace("  - Release notes:", s => `${s}\n${lineTobeInserted}`)
  await writeFile(pathToMkYaml, updatedYamlContent, "utf-8")
}


/**
 * 
 * @param {string} version 
 */
async function updateCodemeta(version){
  const pathToCodemeta = 'codemeta.json'
  const pathToReleaseNotes = `docs/releases/v${version}.md`
  const codemetaContent = JSON.parse(await readFile(pathToCodemeta, "utf-8"))
  codemetaContent["version"] = version
  const releaseNotes = await readFile(pathToReleaseNotes, "utf-8")
  codemetaContent["schema:releaseNotes"] = releaseNotes

  const date = new Date()
  const YYYY = date.getFullYear().toString()
  // getMonth returns index 0 month...
  // see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/getMonth
  const MM = (date.getMonth() + 1).toString().padStart(2, "0")
  const DD = date.getDate().toString().padStart(2, "0")

  codemetaContent["dateModified"] = `${YYYY}-${MM}-${DD}`
  await writeFile(pathToCodemeta, JSON.stringify(codemetaContent, null, 4), "utf-8")
}

async function main() {
  const filename = basename(import.meta.url)
  const args = process.argv.slice(2)
  const target = args[0] || ACTIONS.BUGFIX

  const helperText = `Usage: node ${filename} {${ACTIONS.MAJOR}|${ACTIONS.MINOR}|${ACTIONS.BUGFIX}|x.y.z} (default: bugfix)`

  if (target === "help" || target === "--help") {
    console.log(helperText)
    return
  }

  let targetVersion = null
  if ([ACTIONS.MAJOR, ACTIONS.MINOR, ACTIONS.BUGFIX].includes(target)) {
    
    const latest = await getLatestReleases()
    const latestVersion = parseVersion(latest)
    targetVersion = latestVersion
    let vIdx = -1

    if (target === ACTIONS.MAJOR) vIdx = 0
    if (target === ACTIONS.MINOR) vIdx = 1
    if (target === ACTIONS.BUGFIX) vIdx = 2
    if (vIdx === -1) {
      throw new Error(`target is expected to be one of ${ACTIONS.MAJOR}/${ACTIONS.MINOR}/${ACTIONS.BUGFIX}`)
    }
    latestVersion[vIdx] += 1
    while (vIdx < 2) {
      vIdx += 1
      latestVersion[vIdx] = 0
    }
    targetVersion = latestVersion.join(".")
  } else if (target !== ACTIONS.LINT) {
    targetVersion = parseVersion(target)
  }

  await updatePackageJson(targetVersion)
  await ensureReleaseNotes(targetVersion)
  await ensureMkDocYaml(targetVersion)
  await updateCodemeta(targetVersion)
  
  console.log(`Done ${targetVersion}`)
}

main()