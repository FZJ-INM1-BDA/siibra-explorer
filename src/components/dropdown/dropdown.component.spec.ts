import {} from 'jasmine'
import { TestBed, async } from '@angular/core/testing'
import { DropdownComponent } from './dropdown.component';
import { HoverableBlockDirective } from '../hoverableBlock.directive'
import { RadioList } from '../radiolist/radiolist.component'
import { AngularMaterialModule } from '../../ui/sharedModules/angularMaterial.module'

describe('dropdown component', () => {
  it('jasmine works', () => {
    expect(1).toBe(1)
  })
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule
      ],
      declarations : [ 
        DropdownComponent,
        HoverableBlockDirective,
        RadioList
      ]
    }).compileComponents()
  }))
  it('should create component', async(()=>{

    const fixture = TestBed.createComponent(DropdownComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }))
})