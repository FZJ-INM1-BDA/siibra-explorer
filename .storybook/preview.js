import { setCompodocJson } from "@storybook/addon-docs/angular";
import docJson from "../documentation.json";
setCompodocJson(docJson);
import * as ConnectivityComponent from 'hbp-connectivity-component/dist/loader'

import 'src/theme.scss'

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

ConnectivityComponent.defineCustomElements(window)
