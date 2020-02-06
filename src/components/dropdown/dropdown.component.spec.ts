import { async, TestBed } from '@angular/core/testing'
import {} from 'jasmine'
import { AngularMaterialModule } from '../../ui/sharedModules/angularMaterial.module'
import { HoverableBlockDirective } from '../hoverableBlock.directive'
import { RadioList } from '../radiolist/radiolist.component'
import { DropdownComponent } from './dropdown.component';

describe('dropdown component', () => {
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule,
      ],
      declarations : [
        DropdownComponent,
        HoverableBlockDirective,
        RadioList,
      ],
    }).compileComponents()
  }))
  it('should create component', async(() => {

    const fixture = TestBed.createComponent(DropdownComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }))
})
