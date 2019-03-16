import { expect } from 'chai';
import { PartialZip } from '../src';
import { start } from 'repl';

// tslint:disable-next-line:max-line-length
const ipswUrl = 'http://updates-http.cdn-apple.com/2019WinterFCS/fullrestores/041-39340/31F9E900-292C-11E9-91CE-4611412B0A59/iPhone11,8_12.1.4_16D57_Restore.ipsw';

describe('PartialZip', () => {
  it('Download ', async () => {
    const pz = new PartialZip({ url: ipswUrl });
    await pz.init();
    const file = pz.files.get('BuildManifest.plist');
    if (!file) throw new Error('File Not Found');
    const fileData = await pz.get(file);

    // Expect file length
    expect(fileData.length).to.equal(201721);

    const startBytes = Buffer.from([0x3c, 0x3f, 0x78, 0x6d, 0x6c]);
    const endBytes = Buffer.from([0x69, 0x73, 0x74, 0x3e, 0x0a]);
    expect(Buffer.compare(fileData.slice(0, 5), startBytes)).to.equal(0);
    expect(Buffer.compare(fileData.slice(-5), endBytes)).to.equal(0);
  });
});
