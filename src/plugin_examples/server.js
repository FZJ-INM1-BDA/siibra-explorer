const express = require('express')

const app = express()

const cors = (req,res,next)=>{
  res.setHeader('Access-Control-Allow-Origin','*')
  next()
}

app.use(cors,express.static(__dirname))

app.listen(10080,()=>{
  console.log(`listening on 10080, serving ${__dirname}`)
})