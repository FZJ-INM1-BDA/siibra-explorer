const fs = require('fs')
fs.readFile(
  './ext/***REMOVED***.json', 
  // './ext/***REMOVED***.json', 
  'utf-8', (err, data) => {
  const json = JSON.parse(data)
  const newFile = json.map(item => {
    return {
      name: item.name.replace('DESj', 'item2'),
      // name: item.name.replace('BATg', 'item1'),
      templateSpace: item.templateSpace,
      geometry: item.geometry
    }
  })

  fs.writeFile(
    './raw/exportForOliver/item2.json', 
    // './raw/exportForOliver/item1.json', 
    JSON.stringify(newFile), 'utf-8', err => {
    if (err) throw err
    console.log('done')
  })
})