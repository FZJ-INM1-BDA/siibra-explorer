import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
setCompodocJson(docJson);

import 'src/theme.scss'

/**
 * load custom icons
 */
import '!!file-loader?context=src/res&name=icons/iav-icons.css!src/res/icons/iav-icons.css'
import '!!file-loader?context=src/res&name=icons/iav-icons.ttf!src/res/icons/iav-icons.ttf'
import '!!file-loader?context=src/res&name=icons/iav-icons.woff!src/res/icons/iav-icons.woff'
import '!!file-loader?context=src/res&name=icons/iav-icons.svg!src/res/icons/iav-icons.svg'

export const parameters = {
  actions: { argTypesRegex: "^on[A-Z].*" },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  docs: { inlineStories: true },
  darkMode: {
    // Set the initial theme
    current: 'light'
  }
}
