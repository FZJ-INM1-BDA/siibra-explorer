import { ChangeDetectionStrategy, Component, ContentChild, EventEmitter, HostBinding, Input, OnChanges, Output, SimpleChanges } from "@angular/core";
import { SmartChipContent } from "../smartChip.content.directive"
import { SmartChipMenu } from "../smartChip.menu.directive";
import { rgbToHsl, hexToRgb } from 'common/util'

const cssColorIsDark = (input: string) => {
  if (/rgb/i.test(input)) {
    const match = /\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(input)
    if (!match) throw new Error(`rgb cannot be extracted ${input}`)
    const rgb = [
      parseInt(match[1]),
      parseInt(match[2]),
      parseInt(match[3]),
    ]
    const [_h, _s, l] = rgbToHsl(...rgb)
    return l < 0.4
  }
  if (/hsl/i.test(input)) {
    const match = /\((.*)\)/.exec(input)
    const [h, s, l] = match[1].split(",")
    const trimmedL = l.trim()
    if (/%$/.test(trimmedL)) {
      const match = /^([0-9]+)%/.exec(trimmedL)
      return (parseInt(match[1]) / 100) < 0.4
    }
  }
  if (/^#/i.test(input) && input.length === 7) {
    const [r, g, b] = hexToRgb(input)
    const [_h, _s, l] = rgbToHsl(r, g, b)
    return l < 0.6
  }
  throw new Error(`Cannot parse css color: ${input}`)
}

@Component({
  selector: `sxplr-smart-chip`,
  templateUrl: `./smartChip.template.html`,
  styleUrls: [
    `/smartChip.style.css`
  ],
  changeDetection: ChangeDetectionStrategy.OnPush
})

export class SmartChip<T extends object> implements OnChanges{
  @Input('color')
  color = `rgba(200, 200, 200, 1)`

  @Input('disabled')
  disabled: boolean = false

  @Input('elevation')
  elevation: number = 4 // translates to mat-elevation-z{elevation}

  smartChipClass = 'mat-elevation-z4'

  @Input('items')
  items: T[] = []

  @Input('getChildren')
  getChildren: (item: T) => T[] = item => item['children'] || []

  @Output('itemClicked')
  itemClicked = new EventEmitter<T>()

  @ContentChild(SmartChipContent)
  contentTmpl: SmartChipContent

  @ContentChild(SmartChipMenu)
  menuTmpl: SmartChipMenu

  @HostBinding('class')
  darkTheme: string = 'lighttheme'

  ngOnChanges(simpleChanges: SimpleChanges) {
    if (simpleChanges.color) {
      this.darkTheme = cssColorIsDark(this.color)
        ? 'darktheme'
        : 'lighttheme'
    }

    if (simpleChanges.disabled || simpleChanges.elevation) {
      this.smartChipClass = [
        this.disabled ? 'disabled' : null,
        `mat-elevation-z${this.elevation}`
      ].filter(v => !!v).join(' ')
    }
  }
}
