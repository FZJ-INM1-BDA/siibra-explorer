import { CommonModule } from "@angular/common";
import { Component, Pipe, PipeTransform } from "@angular/core";
import { MatDividerModule } from "@angular/material/divider";
import { MatExpansionModule } from "@angular/material/expansion";
import { Meta, moduleMetadata, Story } from "@storybook/angular";
import { provideDarkTheme } from "src/atlasComponents/sapi/stories.base";
import { SmartChipModule } from "./module";


const complex1 = `
<sxplr-smart-chip [color]="color" [items]="inventory">
  <span *sxplrSmartChipContent>menu example</span>
  <ng-template sxplrSmartChipMenu let-inv>
    {{ inv.name }}
  </ng-template>
</sxplr-smart-chip>
`

const complex2 = `

<sxplr-smart-chip [color]="color" [items]="categories" [getChildren]="getChildren">
  <span *sxplrSmartChipContent>submenu example</span>
  <ng-template sxplrSmartChipMenu let-item>
    {{ item.categoryName || item.name }}
  </ng-template>
</sxplr-smart-chip>
`

const input = {
  complex1,
  complex2,
}

const getHtmlSnippet = (key: string) => `
<mat-expansion-panel>
<mat-expansion-panel-header>
  <mat-panel-title>
    Code
  </mat-panel-title>
</mat-expansion-panel-header>
<pre>
  <code [innerHTML]="input.${key} | showHtmlCode">
  </code>
</pre>
</mat-expansion-panel>
${input[key]}
`

@Pipe({
  name: 'showHtmlCode',
  pure: true
})
class ShowHtmlCode implements PipeTransform {
  public transform(input: string) {
    return input
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
}

type Inventory = {
  name: string
  quantity: number
}

type Category = {
  categoryName: string
  inventories: Inventory[]
}

@Component({
  selector: 'smart-chip-container',
  template: `
  <div class="container">
    ${Object.keys(input).map(key => getHtmlSnippet(key)).join('\n<mat-divider></mat-divider>\n')}
  </div>
  `,
  styles: [
    `.mat-divider{ margin: 1rem; } .container{ display: flex; flex-direction: column; }`
  ]
})
class SmartChipContainerCmp{
  color:string

  inventory: Inventory[] = [{
    name: 'banana',
    quantity: 10,
  }, {
    name: 'apple',
    quantity: 5,
  }]

  categories: Category[] = [{
    categoryName: 'fruits',
    inventories: this.inventory
  }, {
    categoryName: 'processed food',
    inventories: [{
      name: 'pizza',
      quantity: 1000,
    }, {
      name: 'kebab',
      quantity: 12
    }]
  }, {
    categoryName: 'xmas food',
    inventories: []
  }]

  getChildren(category: Category) {
    return category.inventories
  }
  input = input
}

export default {
  component: SmartChipContainerCmp,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        SmartChipModule,
        MatExpansionModule,
        MatDividerModule,
      ],
      declarations: [
        ShowHtmlCode,
      ],
      providers: [
        ...provideDarkTheme,
      ]
    })
  ]
} as Meta

const Template: Story<SmartChipContainerCmp> = (args: SmartChipContainerCmp) => {
  const { color } = args
  return ({
    props: {
      color
    }
  })
}

export const Default = Template.bind({})
Default.args = {
  color: 'rgba(206, 221, 247, 1)',
}


// export const AtlasEtc = Template.bind({})
// AtlasEtc.args = {
//   color: 'rgba(206, 221, 247, 1)'
// }
// AtlasEtc.loaders = [
//   loadAtlasEtcData
// ]
