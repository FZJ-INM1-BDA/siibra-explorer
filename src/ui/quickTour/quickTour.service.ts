import {Injectable} from "@angular/core";
import {QuickTourThis} from "src/ui/quickTour/quickTourThis.directive";
import {BehaviorSubject} from "rxjs";

@Injectable()
export class QuickTourService {

  public currSlideNum: number = null
  public currentTip$: BehaviorSubject<any> = new BehaviorSubject(null)

  public quickTourThisDirectives: QuickTourThis[] = []

  public register(dir: QuickTourThis) {
    if (!this.quickTourThisDirectives.length) {
      this.quickTourThisDirectives.push(dir)
    } else {
      this.insertSorted(0, dir)
    }
  }

  insertSorted(i, dir) {
    if (dir.order > this.quickTourThisDirectives[i].order) {
      if (!this.quickTourThisDirectives[i+1]) {
        return this.quickTourThisDirectives.push(dir)
      } else if (dir.order <= this.quickTourThisDirectives[i+1].order) {
        return this.quickTourThisDirectives.splice(i+1, 0, dir)
      } else {
        this.insertSorted(i+1, dir)
      }
    } else {
      this.quickTourThisDirectives.splice(i, 0, dir)
    }
  }

  public unregister (dir: QuickTourThis) {
    this.quickTourThisDirectives = this.quickTourThisDirectives.filter(d => d !== dir)
  }

  public startTour() {
    this.currSlideNum = 0
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])
  }

  public nextSlide() {
    this.currSlideNum++
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])

  }

  public previousSlide() {
    this.currSlideNum--
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])
  }

  changeDetected(order) {
    if (this.currentTip$.value && order === this.currentTip$.value.order) {
      this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])
    }
  }
}
