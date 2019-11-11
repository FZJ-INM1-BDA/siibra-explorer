import { TestBed } from '@angular/core/testing';

import { SlServiceService } from './sl-service.service';

describe('SlServiceService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SlServiceService = TestBed.get(SlServiceService);
    expect(service).toBeTruthy();
  });
});
