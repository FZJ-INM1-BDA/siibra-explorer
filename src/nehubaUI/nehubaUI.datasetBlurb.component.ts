import { Component, Input } from '@angular/core'
import { DatasetInterface } from 'nehubaUI/nehuba.model';

@Component({
  selector : `datasetBlurb`,
  template : 
  `
  <div container>
    <div 
      *ngFor = "let publication of dataset.publications" 
      linkContainer>

      <a [href] = "publication.doi">{{publication.citation}}</a>
    </div>
    <div descContainer>
      <small>
        {{ dataset.description }}
      </small>
    </div>
  </div>
  `,
  styles : [
    `
    div[container]
    {
      width:100%;
    }
    div[linkContainer]
    {
      width:100%;
      padding:0.2em 1em;
    }
    div[descContainer]
    {
      width:100%;
      padding:0.2em 1em;
    }
    `
  ]
})

export class DatasetBlurb{
  @Input() dataset:DatasetInterface
}

