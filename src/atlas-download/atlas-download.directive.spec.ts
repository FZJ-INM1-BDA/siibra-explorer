import { NEVER } from 'rxjs';
import { AtlasDownloadDirective } from './atlas-download.directive';

describe('AtlasDownloadDirective', () => {
  it('should create an instance', () => {
    const directive = new AtlasDownloadDirective(NEVER as any, null, null);
    expect(directive).toBeTruthy();
  });
});
