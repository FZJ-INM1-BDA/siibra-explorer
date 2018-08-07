import {} from 'jasmine'
import { TestBed, async } from '@angular/core/testing'
import { DropdownComponent } from './dropdown.component';

describe('dropdown component', () => {
  it('jasmine works', () => {
    expect(1).toBe(1)
  })
  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations : [ DropdownComponent ]
    }).compileComponents()
  }))
  it('should create component', async(()=>{

    const fixture = TestBed.createComponent(DropdownComponent);
    const app = fixture.debugElement.componentInstance;
    expect(app).toBeTruthy();
  }))
})