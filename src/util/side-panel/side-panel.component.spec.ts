import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelComponent } from './side-panel.component';
import { AngularMaterialModule } from 'src/sharedModules/angularMaterial.module'

describe('SidePanelComponent', () => {
  let component: SidePanelComponent;
  let fixture: ComponentFixture<SidePanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        AngularMaterialModule,
      ],
      declarations: [ 
        SidePanelComponent,
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SidePanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
