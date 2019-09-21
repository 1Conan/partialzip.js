import { expect } from 'chai';
import { PartialZip } from '../src';
import { start } from 'repl';

// tslint:disable-next-line:max-line-length
const ipswUrl = 'http://updates-http.cdn-apple.com/2019FallFCS/fullrestores/061-08528/B905EA00-C875-11E9-9950-A2C527C5EC74/iPhone_5.5_P3_13.0_17A577_Restore.ipsw';
const ipswZip32 = 'http://updates-http.cdn-apple.com/2019SummerFCS/fullrestores/061-05310/A461E0E0-C4E7-11E9-9A93-FA600AD8B7A1/iPhone_4.7_P3_12.4.1_16G102_Restore.ipsw';
describe('PartialZip Zip64', function () {
  this.timeout(10 * 1000);
  it('Download ', async () => {
    const pz = new PartialZip({ url: ipswUrl });
    await pz.init();
    const file = pz.files.get('BuildManifest.plist');
    if (!file) throw new Error('File Not Found');
    const fileData = await pz.get(file);

    // Expect file length
    // expect(fileData.length).to.equal(201721);

    const startBytes = Buffer.from([0x3c, 0x3f, 0x78, 0x6d, 0x6c]);
    const endBytes = Buffer.from([0x69, 0x73, 0x74, 0x3e, 0x0a]);
    expect(Buffer.compare(fileData.slice(0, 5), startBytes)).to.equal(0);
    expect(Buffer.compare(fileData.slice(-5), endBytes)).to.equal(0);
  });
});

describe('PartialZip', function () {
  this.timeout(10 * 1000);
  it('Download ', async () => {
    const pz = new PartialZip({ url: ipswZip32 });
    await pz.init();
    const file = pz.files.get('BuildManifest.plist');
    if (!file) throw new Error('File Not Found');
    const fileData = await pz.get(file);

    // Expect file length
    //expect(fileData.length).to.equal(201721);

    const startBytes = Buffer.from([0x3c, 0x3f, 0x78, 0x6d, 0x6c]);
    const endBytes = Buffer.from([0x69, 0x73, 0x74, 0x3e, 0x0a]);
    expect(Buffer.compare(fileData.slice(0, 5), startBytes)).to.equal(0);
    expect(Buffer.compare(fileData.slice(-5), endBytes)).to.equal(0);
  });
});
