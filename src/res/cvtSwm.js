const fs = require('fs')

const arrayExpander = (arr)=>arr.reduce((acc,curr)=>
  acc.concat(
    curr.constructor === Array ?
      arrayExpander(curr) :
      curr
  )
,[])

fs.readFile('./ext/swmAggregatedData.json','utf-8',(err,data)=>{
  if(err) throw err
  const arr = JSON.parse(data)
  const newarr = arrayExpander(arr)

  fs.writeFile('./ext/swmAggregatedData2.json',JSON.stringify(newarr),'utf-8',(err)=>{
    if(err) throw err
    console.log('done')
  })
})