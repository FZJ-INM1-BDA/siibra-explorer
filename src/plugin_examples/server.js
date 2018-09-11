const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()

const cors = (req, res, next)=>{
  res.setHeader('Access-Control-Allow-Origin','*')
  next()
}

app.get('/allPluginManifests', cors, (req, res) => {
  try{
    res.status(200).send(JSON.stringify(
      fs.readdirSync(__dirname)
        .filter(file => fs.statSync(path.join(__dirname, file)).isDirectory())
        .filter(dir => fs.existsSync(path.join(__dirname, dir, 'manifest.json')))
        .map(dir => JSON.parse(fs.readFileSync(path.join(__dirname, dir, 'manifest.json'), 'utf-8')))
    ))
  }catch(e){
    res.status(500).send(JSON.stringify(e))
  }
})

app.get('/test.json', cors, (req, res) => {

  console.log('test.json pinged')
  res.status(200).send(JSON.stringify({
    "name": "fzj.xg.mime",
    "displayName":"Mime",
    "type": "plugin",
    "templateURL": "http://localhost:10080/mime/template.html",
    "scriptURL": "http://localhost:10080/mime/script.js",
    "initState" : {
      "test" : "value"
    }
  }))
})

app.use(cors,express.static(__dirname))

app.listen(10080, () => {
  console.log(`listening on 10080, serving ${__dirname}`)
})