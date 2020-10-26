const {
  WdIavPage,
  WdLayoutPage,
  WdBase,
} = require('./selenium/iav')

module.exports = {
  BasePage: WdBase,
  LayoutPage: WdLayoutPage,
  AtlasPage: WdIavPage
}
