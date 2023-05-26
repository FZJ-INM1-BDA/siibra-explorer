const fs = require('fs')
const { promisify } = require('util')
const path = require('path')
const router = require('express').Router()
const showdown = require('showdown')

const { retry } = require('../../common/util')
const asyncReadfile = promisify(fs.readFile)
const mdConverter = new showdown.Converter({
  tables: true
})

let renderedHtml = ``
const getQuickStartMdPr = (async () => {
  await retry(async () => {
    const mdData =  await asyncReadfile(
      path.resolve(__dirname, '../../common/helpOnePager.md'),
      'utf-8'
    )

    renderedHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <link href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">
  <script src="https://unpkg.com/dompurify@latest/dist/purify.min.js"></script>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Siibra Explorer Quickstart</title>
  <style>
    .padded { padding: 1.5rem; }
  </style>
</head>
<body class="padded">
  
</body>
<script>
(() => {
  const dirty = \`${mdConverter.makeHtml(mdData).replace(/\`/g, '\\`')}\`
  const clean = DOMPurify.sanitize(dirty)
  document.body.innerHTML = clean
})()
</script>
</html>
`
  }, {
    retries: 3,
    timeout: 1000
  })
})()


router.get('', async (_req, res) => {
  await getQuickStartMdPr
  res.status(200).send(renderedHtml)
})

module.exports = router
