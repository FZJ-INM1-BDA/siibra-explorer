import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegionTreeComponent } from './region-tree.component';
import {AngularMaterialModule} from "src/sharedModules";

describe('RegionTreeComponent', () => {
  const treeData = [{
    name: 'reg1',
    children: [{
      name: 'reg1 left'
    }, {
      name: 'reg1 right'
    }]
  }, {
    name: 'reg2',
    children: [{
      name: 'reg2 left'
    }, {
      name: 'reg2 right'
    }]
  }, {
    name: 'grandParent',
    children: [{
      name: 'parent',
      children: [{
        name: 'child'
      }]
    }]
  }]
  let component: RegionTreeComponent;
  let fixture: ComponentFixture<RegionTreeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AngularMaterialModule],
      declarations: [ RegionTreeComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(RegionTreeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    component.inputItem = treeData
    component.filterChanged('')
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('> Region tree filter', () => {

    it('Filter works', () => {
      component.filterChanged('reg2')

      expect(component.dataSource.data[0].name).toEqual('reg2')
      expect(component.dataSource.data[0].children.length).toEqual(2)
    });
    it('Filter works for multiple words', () => {
      component.filterChanged('reg right')
      expect(component.dataSource.data.length).toEqual(2)
      expect(component.dataSource.data[0].children.length).toEqual(1)
      expect(component.dataSource.data[0].children[0].name).toEqual('reg1 right')
      expect(component.dataSource.data[1].children.length).toEqual(1)
      expect(component.dataSource.data[1].children[0].name).toEqual('reg2 right')
    });
  })

  describe('> Tree collapse/expand', () => {
    it('Collapse works', () => {
      component.toggleNodeExpansion(component.dataSource.data[0])
      expect(component.treeControl.isExpanded(component.dataSource.data[0])).toBeTrue()
    });
    it('Expand works', () => {
      component.toggleNodeExpansion(component.dataSource.data[0])
      expect(component.treeControl.isExpanded(component.dataSource.data[0])).toBeTrue()
      component.toggleNodeExpansion(component.dataSource.data[0])
      expect(component.treeControl.isExpanded(component.dataSource.data[0])).toBeFalse()

    });
    it('After collapse all children collapses', () => {
      component.toggleNodeExpansion(component.dataSource.data[2])
      component.toggleNodeExpansion(component.dataSource.data[2])
      expect(component.treeControl.isExpanded(component.dataSource.data[2].children[0])).toBeFalse()
    });
  })


});
