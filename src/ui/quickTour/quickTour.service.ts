import {Injectable} from "@angular/core";
import {QuickTourThis} from "src/ui/quickTour/quickTourThis.directive";
import {BehaviorSubject, Subject} from "rxjs";

@Injectable()
export class QuickTourService {

  public currSlideNum: number = null
  public currentTip$: BehaviorSubject<any> = new BehaviorSubject(null)

  public quickTourThisDirectives: QuickTourThis[] = []

  public register(dir: QuickTourThis) {
    if (this.quickTourThisDirectives.indexOf(dir) < 0) {
      this.quickTourThisDirectives.push(dir)
      this.quickTourThisDirectives.sort((a, b) => +a.order - +b.order)
    }
  }

  public unregister (dir: QuickTourThis) {
    this.quickTourThisDirectives = this.quickTourThisDirectives.filter(d => d.order !== dir.order)
  }

  public startTour() {
    this.currSlideNum = 0
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])
  }

  public nextSlide() {
    this.currSlideNum++
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])

  }

  public backSlide() {
    this.currSlideNum--
    this.currentTip$.next(this.quickTourThisDirectives[this.currSlideNum])
  }
}
