import { Component, EventEmitter, Input, Output } from '@angular/core'

@Component({
  selector : 'pagination-component',
  templateUrl : './pagination.template.html',
  styleUrls : [
    './pagination.style.css',
  ],
})

export class PaginationComponent {
  @Input() public total: number = 0
  @Input() public hitsPerPage: number = 15
  @Input() public currentPage: number = 0

  @Output() public paginationChange: EventEmitter<number> = new EventEmitter()
  @Output() public outOfBound: EventEmitter<number> = new EventEmitter()

  public goto(pgnum: number) {
    const emitValue = pgnum < 0 ?
      0 :
      pgnum >= Math.ceil(this.total / this.hitsPerPage) ?
        Math.ceil(this.total / this.hitsPerPage) - 1 :
        pgnum

    this.paginationChange.emit(emitValue)
  }

  public gotoFirst() {
    this.goto(0)
  }

  public gotoLast() {
    const num = Math.floor(this.total / this.hitsPerPage) + 1
    this.goto(num)
  }

  get getPagination() {
    return Array.from(Array(Math.ceil(this.total / this.hitsPerPage)).keys()).filter((this.hidePagination).bind(this))
  }

  get getPageLowerBound() {
    return this.currentPage * this.hitsPerPage + 1
  }

  get getPageUpperBound() {
    return Math.min( ( this.currentPage + 1 ) * this.hitsPerPage , this.total )
  }

  public hidePagination(idx: number) {

    const correctedPagination = this.currentPage < 2 ?
      2 :
      this.currentPage > (Math.ceil(this.total / this.hitsPerPage) - 3) ?
        Math.ceil(this.total / this.hitsPerPage) - 3 :
        this.currentPage
    return (Math.abs(idx - correctedPagination) < 3)
  }
}
