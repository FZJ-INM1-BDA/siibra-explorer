import { Component, Input, ChangeDetectionStrategy } from "@angular/core";

@Component({
  selector : 'kg-entry-viewer-subject-viewer',
  templateUrl : './subjectViewer.template.html',
  styleUrls : ['./subjectViewer.style.css'],
  changeDetection : ChangeDetectionStrategy.OnPush
})

export class SubjectViewer{
  @Input() subjects: any = []

  get isSingle():boolean{
    return this.subjects.constructor !== Array
  }

  get species():string[]{
    return this.isSingle
      ? [this.subjects.children.species.value]
      : this.subjects.reduce((acc:string[],curr:any) => 
        acc.findIndex(species => species === curr.children.species.value) >= 0
          ? acc
          : acc.concat(curr.children.species.value)
      , [])
  }

  get groupBySex(){
    return this.isSingle
      ? [{
          name : this.subjects.children.sex.value,
          count : 1
        }]
      : this.subjects.reduce((acc:any[],curr) => 
        acc.findIndex(item => item.name === curr.children.sex.value) >= 0
          ? acc.map(item => item.name === curr.children.sex.value
            ? Object.assign({}, item, { count: item.count + 1 })
            : item)
          : acc.concat({name: curr.children.sex.value, count: 1})
      , [])
  }
}