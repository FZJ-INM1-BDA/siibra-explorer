import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PointAssignmentComponent, processRow } from './point-assignment.component';
import { SAPI } from 'src/atlasComponents/sapi/sapi.service';
import { EMPTY } from 'rxjs';
import { provideMockStore } from '@ngrx/store/testing';
import { VolumesModule } from '../volumes.module';

describe('PointAssignmentComponent', () => {
  let component: PointAssignmentComponent;
  let fixture: ComponentFixture<PointAssignmentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [  ],
      imports: [ VolumesModule ],
      providers: [
        provideMockStore(),
        {
          provide: SAPI,
          useValue: {
            v3Get: () => EMPTY
          }
        }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PointAssignmentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe("processRow", () => {

    const testExpected = [
      {
        test: ["foo", "bar"],
        expected: `foo,bar`
      },
      {
        test: [1, "bar"],
        expected: `1,bar`
      },
      {
        test: [true, "bar"],
        expected: `true,bar`
      },
      {
        test: ["foo", ",bar"],
        expected: `foo,",bar"`
      },

      /**
       * see https://www.ietf.org/rfc/rfc4180.txt
       * 
       * If double-quotes are used to enclose fields, then a double-quote
       * appearing inside a field must be escaped by preceding it with
       * another double quote.  For example:
       * 
       * "aaa","b""bb","ccc"
       */
      {
        test: ["foo", `"bar`],
        expected: `foo,"""bar"`
      },
    ]

    it("parse accordingly", () => {
      for (const { expected, test } of testExpected){
        expect(processRow(test)).toEqual(expected)
      }
    })
  })

});
