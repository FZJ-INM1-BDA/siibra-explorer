import { Component } from "@angular/core";

@Component({
  selector : 'components-main',
  templateUrl : `./main.template.html`,
  styleUrls : [
    `./main.style.css`
  ]
})

export class ComponentIndex{
  markdownInput : string = `Heading
------

**bold**

~~strikeout~~

normal paragraph

[google](https://www.google.com)`
}