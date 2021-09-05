import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionTreeComponent } from './region-tree.component';

describe('RegionTreeComponent', () => {
  let component: RegionTreeComponent;
  let fixture: ComponentFixture<RegionTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ RegionTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
