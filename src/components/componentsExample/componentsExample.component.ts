import { Component } from "@angular/core";

@Component({
  selector : 'components-exmample',
  templateUrl : `./componentsExample.template.html`,
  styleUrls : [
    `./componentsExample.style.css`
  ]
})

export class ComponentsExample{
  markdownInput : string = `Heading
------

**bold**

~~strikeout~~

normal paragraph

[google](https://www.google.com)`

  markdownCode :string = `
html
\`\`\`html
<markdown-dom id = "markdown-dom1">
</markdown-dom>
\`\`\`
javascript
\`\`\`javascript
const mdDom = document.getElementById('markdown-dom1')
mdDom.markdown = \`
MD text here
------
\`
\`\`\`

`
  markdownText : string = `
mardown2Html
======
utilising [showdownjs](https://github.com/showdownjs/showdown). Note the [XSS vulnerability](https://github.com/showdownjs/showdown/wiki/Markdown's-XSS-Vulnerability-(and-how-to-mitigate-it)). 
`
  readmoreInput : string = `Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.`
  readmoreSampleCode : string = `
  
html
\`\`\`html
<readmore
  collapsedHeight = 45
  show = false>
Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.
</readmore>
\`\`\`
`
  readmoreText : string = `
readmore
======
hide/show more. Useful for the display of large block of text.  
`
}