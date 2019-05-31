if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
  process.on('unhandledRejection', (err, p) => {
    console.log({err, p})
  })
}

const app = require('./app')
const PORT = process.env.PORT || 3000

app.listen(PORT, () => console.log(`listening on port ${PORT}`))