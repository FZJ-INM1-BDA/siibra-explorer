import { Component, Input, Output, EventEmitter } from '@angular/core'

import template from './nehubaUI.pagination.template.html'
import css from './nehubaUI.pagination.style.css'

@Component({
  selector : 'pagination-component',
  template,
  styles : [
    css
  ]
})

export class PaginationComponent{
  @Input() total : number = 0
  @Input() hitsPerPage : number = 15
  @Input() currentPage : number = 0

  @Output() paginationChange : EventEmitter<number> = new EventEmitter()

  goto(pgnum:number){
    const emitValue = pgnum < 0 ? 
      0 :
      pgnum >= Math.ceil(this.total / this.hitsPerPage) ?
        Math.ceil(this.total / this.hitsPerPage) - 1 :
        pgnum

    this.paginationChange.emit(emitValue)
  }

  gotoFirst(){
    this.goto(0)
  }

  gotoLast(){
    const num = Math.floor(this.total / this.hitsPerPage) + 1
    this.goto(num)
  }

  get getPagination(){
    return Array.from(Array(Math.ceil(this.total / this.hitsPerPage)).keys()).filter((this.hidePagination).bind(this))
  }

  get getPageLowerBound(){
    return this.currentPage * this.hitsPerPage + 1
  }

  get getPageUpperBound(){
    return Math.min( ( this.currentPage + 1 ) * this.hitsPerPage , this.total )
  }

  hidePagination(idx:number){
    
    const correctedPagination = this.currentPage < 2 ?
      2 :
      this.currentPage > (Math.ceil(this.total / this.hitsPerPage) - 3) ?
        Math.ceil(this.total / this.hitsPerPage) - 3 :
        this.currentPage
    return (Math.abs(idx-correctedPagination) < 3)
  }
}