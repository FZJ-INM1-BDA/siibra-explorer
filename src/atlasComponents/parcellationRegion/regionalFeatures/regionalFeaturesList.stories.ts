import { Meta, moduleMetadata, Story } from '@storybook/angular';
import { SAPI, SapiAtlasModel, SapiParcellationModel, SapiRegionModel, SapiSpaceModel } from "src/atlasComponents/sapi"
import { RegionalFeaturesModule } from '.';
import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, HostBinding } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { AngularMaterialModule } from 'src/sharedModules';
import { getHumanAtlas, getMni152, getJba29, getHoc1Left } from 'src/atlasComponents/sapi/stories.base';

@Component({
  // selector is **mandatory**!!
  selector: 'wrapper-cls',
  template: `
    <mat-card>
      <regional-features-list
        [regional-features-list-atlas]="atlas"
        [regional-features-list-template]="space"
        [regional-features-list-parcellation]="parc"
        [regional-features-list-region]="region"
        (regional-features-list-feat-clicked)="clickTriggered.emit($event)"
        >
      </regional-features-list>
    </mat-card>
  `,
  styles: [
    `
    :host
    {
      display: block;
    }
    `
  ],
})

class WrapperCls{
  atlas: SapiAtlasModel
  space: SapiSpaceModel
  parc: SapiParcellationModel
  region: SapiRegionModel

  constructor(){
  }

  @Output()
  clickTriggered = new EventEmitter()

  @HostBinding('style.max-width')
  @Input()
  maxWidth: string = null
}

//👇 This default export determines where your story goes in the story list
export default {
  /* 👇 The title prop is optional.
  * See https://storybook.js.org/docs/angular/configure/overview#configure-story-loading
  * to learn how to generate automatic titles
  */
  
  component: WrapperCls,
  decorators: [
    moduleMetadata({
      imports: [
        CommonModule,
        RegionalFeaturesModule,
        HttpClientModule,
        AngularMaterialModule,
      ],
      providers: [
        SAPI,
      ]
    })
  ]
} as Meta;

//👇 We create a “template” of how args map to rendering
const Template: Story<WrapperCls> = (args: WrapperCls, { loaded }) => {
  const { atlas, parc, space, region } = loaded
  return ({
    props: {
      ...args,
      atlas, parc, space, region
    }
  })
}

Template.loaders = [
  async () => {
    const atlas = await getHumanAtlas()
    const parc = await getJba29()
    const region = await getHoc1Left()
    const space = await getMni152()
    return {
      atlas, parc, space, region
    }
  }
]


export const NormalView = Template.bind({});
NormalView.loaders = [
  ...Template.loaders
]
// NormalView.args = {
//  //👇 The args you need here will depend on your component
// };

// half width view not working
// related probably: https://github.com/storybookjs/storybook/issues/13264
export const HalfWidth = Template.bind({});
HalfWidth.loaders = [
  ...Template.loaders
]
HalfWidth.args = {
 //👇 The args you need here will depend on your component
 maxWidth: "20rem"
};
