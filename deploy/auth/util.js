const objStoreDb = new Map()

const initPassportJs = app => {
  console.log('init passport js')
  const passport = require('passport')
  
  app.use(passport.initialize())
  app.use(passport.session())

  passport.serializeUser((user, done) => {
    const { tokenset, rest } = user
    objStoreDb.set(user.id, user)
    done(null, user.id)
  })

  passport.deserializeUser((id, done) => {
    const user = objStoreDb.get(id)
    if (user) return done(null, user)
    else return done(null, false)
  })
}

module.exports = {
  initPassportJs,
  objStoreDb,
}
