const fs = require('fs')
const fetch = require('node-fetch')

const querySingle = (obj) => new Promise((resolve, reject) => {
  if(obj.labelIndex){
    fetch(`https://kg.humanbrainproject.org/api/smartproxy/kg/_search`,{
      "body": JSON.stringify({
        query : {
          query_string : {
            query : obj.name
          }
        },
        post_filter : {
          bool : {
            must : [{
              term : {
                _type : 'Dataset'
              }
            }]
          }
        }
      }),
      "method":"POST"
    })
      .then(res => res.json())
      .then(json => {
        if(json && json.hits && json.hits.hits && json.hits.hits.length > 0){
          const match = json.hits.hits.find(hit => {
            console.log(obj.name, hit._source.title.value)
            return new RegExp(obj.name.replace(/\(.*?\)/g, '')).test(hit._source.title.value)
          })
          if(match){
            resolve(
              Object.assign({}, obj, {kgID : `${match._type}/${match._id}`})
            )
          }else{
            
            console.log('XXX ',obj.name)
            reject(' could not find a match')
          }
        }else{
          // console.log(JSON.stringify(json,null,2))
          console.log(obj.name)
          reject('json.hits does not exist or is length 0')
        }
      })
  }else{
    Promise.all(obj.children.map(item => querySingle(item)))
      .then(children => resolve(
        Object.assign({}, obj, {children})
      ))
      .catch(err => reject(err))
  }
})

fs.readFile('./raw/colin.json','utf-8', (err, data) => {
  if(err) throw err
  const json = JSON.parse(data)
  querySingle(json.parcellations[0].regions[0])
    .then(region => {
      json.parcellations[0].regions[0] = region
      fs.writeFile('./raw/colinNew.json', JSON.stringify(json), 'utf-8', (err) => {
        if(err) throw err
        console.log('done')
      })
    })
})

// fetch("https://kg.humanbrainproject.org/api/smartproxy/kg/_search", {
//   "credentials":"include",
//   "headers":{},
//   "referrer":"https://kg.humanbrainproject.org/webapp/?q=area%2044%20%28IFG%29",
//   "referrerPolicy":"no-referrer-when-downgrade",
//   "body":"{\"query\":{\"query_string\":{\"query\":\"Area hIP1 (IPS)\"}}}",
//   "method":"POST",
//   "mode":"cors"})
//   .then(res => res.json())
//   .then(json => {
//     fs.writeFile('./raw/hip1.json', JSON.stringify(json), 'utf-8', (err) => {
//       if(err) throw err
//       console.log('writing finished')
//     })
//   })
//   .catch(console.error)