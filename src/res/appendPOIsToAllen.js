const fs = require('fs')

const readFile = (path) => new Promise((rs,rj) => {
  fs.readFile(path, 'utf-8', (err, data) => {
    if(err){
      rj(err)
    }else{
      try{
        const json = JSON.parse(data)
        rs(json)
      }catch(e){
        rj(e)
      }
    }
  })
})

const findInNewRoot = (id, json) => {
  return json.id === id
    ? json
    : json.children
      ? json.find(child => findInNewRoot(child))
      : null
}

Promise.all(['./raw/ABACenters.json','./raw/allenMouse.json'].map(readFile))
  .then(jsons => {
    const newJson = jsons[0]
    const oldJson = jsons[1]
    const newABRoot = newJson.msg[0]
    const oldArr = oldJson.parcellations[0].regions

    const mapNew = new Map()

    const traverseNewJson = (json) => {
      const {children, ...rest} = json
      mapNew.set(json.id, rest)

      if(children && children.constructor === Array && children.length > 0){
        children.forEach(traverseNewJson)
      }
    }

    traverseNewJson(newABRoot)

    /* TODO 1/2 voxel shift? */
    const allenMouseXYZTransform = [-5737500,-6637500,-4037500]
    const transformPOI = (yzx) => {
      const xyz = [yzx[2],yzx[0],yzx[1]]
      const xyzNm = xyz.map(v => v*1e3)
      const xyzTransformed = [0,1,2].map(idx => (allenMouseXYZTransform[idx] + xyzNm[idx]) * -1)
      return xyzTransformed
    }

    const noCentersNames = []

    const parseOldJson = (json) => {
      if(!json.ontologyMetadata){
        console.log('ontology metadata field is missing',json.name)
        return json
      }

      if(typeof json.ontologyMetadata.id === 'undefined'){
        console.log('atlas id field is missing',json.name)
        return json
      }

      const newObj = mapNew.get(json.ontologyMetadata.id)
      if(!newObj){
        console.log('could not find the id in the map',json.name)
        return json
      }

      mapNew.delete(json.ontologyMetadata.id)

      if(!newObj.centers){
        noCentersNames.push(newObj.name)
        return Object.assign({}, json, {
          children : json.children.map(parseOldJson)
        })
      }

      return Object.assign({}, json, {
        POIs : newObj.centers.map(transformPOI),
        ontologyMetadata: Object.assign({}, json.ontologyMetadata, {centers :newObj.centers }),
        children : json.children.map(parseOldJson)
      })
    }
    const newArr = oldArr.map(json => Object.assign({}, parseOldJson(json)))

    const newJson2 = Object.assign({}, oldJson)
    newJson2.parcellations[0].regions = newArr
    fs.writeFile('./raw/allenMouseNew.json', JSON.stringify(newJson2), 'utf-8', (err) => {
      if(err) throw err
      else console.log('writing finished')
    })

    fs.writeFile('./raw/allenMouseNewNoCenters.txt', noCentersNames.join('\n'), 'utf-8', (err) => {
      if(err) throw err
      else console.log('writing error finished')
    })

    fs.writeFile('./raw/allenMouseNewUnused.txt', Array.from(mapNew.values()).map(v => v.name).join('\n'), 'utf-8', (err) => {
      if(err) throw err
      else console.log('writing unused finished')
    })
    

  })
  .catch(console.err)
