const fs = require('fs')


const dict = {
  'hbp-00015': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=action%20potential#Project/9bf31c7ff062936a96d3c8bd1f8f2ff3',
  'hbp-00014': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=action%20potential#Project/aab3238922bcc25a6f606eb525ffdc56',
  'hbp-00013': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=action%20potential#Project/c51ce410c124a10e0db5e4b97fc2af39',
  'hbp-00012': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=action%20potential#Project/c20ad4d76fe97759aa27a0c99bff6710',
  'hbp-00011': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=action%20potential#Project/6512bd43d9caa6e02c990b0a82652dca',
  'hbp-00005': 'https://www.humanbrainproject.eu/en/explore-the-brain/search/?q=stdp#Project/e4da3b7fbbce2345d7772b0674a318d5'
}

const dict2 = {
  '140213' : 'Subject/9703f44d9e8e3e89b04fe32df38d3a50',
  '140220' : 'Subject/62a12ea44022cc61bc50622c25d9ba90',
  '140304' : 'Subject/b7a9bfa817b00f0b8602eef0961dd9c1',
  '140514' : 'Subject/6d212b1a18a6f09098123aeff7ee540e',
  '140505' : 'Subject/173dc7e71e243a7a6ad5718872950c3e',
  '140519' : 'Subject/6dc041463d5e021652824319d0273289',
}


const planeFragment = 'GCaMP6'

fs.readdir('./raw/allenFromCamila',(err,files) => {
  if(err) throw err
  const filteredFiles = files.filter(file => !(/md$/.test(file)))
  const json = filteredFiles.map(file => {
    const data = fs.readFileSync(`./raw/allenFromCamila/${file}`, 'utf-8')

    const json = JSON.parse(data)
    const regex = /hbp\-[0-9]{5}/.exec(file)
    const name = json.name
      ? json.name
      : json.Name
    let kgID
    const obj = {
      type : 'Allen Dataset',
      name : name,
      regionName : [],
      targetParcellation : 'Allen Mouse Brain Atlas',
      files : [{
        filename : name,
        name : name,
        mimetype : 'raw',
      }]
    }
    if(regex && dict[regex[0]]){
      kgID = /Project\/.*?$/.exec(dict[regex[0]])[0]
      obj.regionName = [{
        regionName : json['Primary region(s)'],
        relationship : 'equals'
      }]
    }else{
      const regex2 = /[0-9]{6}/.exec(file)
      if(regex2 && dict2[regex2[0]]){
        kgID = dict2[regex2[0]]
        obj.regionName = obj.regionName.concat([{
          regionName : 'Prelimbic area',
          relationship : 'equals'
        },{
          regionName : 'Primary motor area',
          relationship : 'equals'
        },{
          regionName : 'Primary somatosensory area',
          relationship : 'equals'
        },{
          regionName : 'Anteromedial visual area',
          relationship : 'equals'
        }])
      }else if (new RegExp(planeFragment).test(file)){
        kgID = null
      }
    }
    obj.kgID = kgID
    return obj
  })
  fs.writeFile('./raw/allenTestAggregated.json', JSON.stringify(json), 'utf-8', (err) => {
    if(err) throw err
    console.log('finished writing')
  })
})