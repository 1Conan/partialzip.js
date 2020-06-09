import ava from 'ava';
import { createHash } from 'crypto';
import PartialZip from '../src/lib/PartialZip';

const url64 = 'http://updates-http.cdn-apple.com/2020SpringFCS/fullrestores/061-71943/3585BC25-0797-4ABA-87DE-677AA47887AD/iPhone_5.5_P3_13.5_17F75_Restore.ipsw';

ava('Zip64 URL', async (test) => {
  const zip = new PartialZip(url64);

  await zip.init();

  const fileInfo = zip.files.get('BuildManifest.plist')!;

  test.truthy(fileInfo.extraField.zip64);

  test.is(fileInfo.extraField.zip64!.compressedSize, BigInt(36759));
  test.is(fileInfo.extraField.zip64!.uncompressedSize, BigInt(593280));

  const buf = await zip.get(fileInfo);

  const hash = createHash('sha1').update(buf);

  test.is(hash.digest('hex'), '11c2a3ba7d65d3c2b3d2b71327cd404717129c24');
});

const url = 'http://appldnld.apple.com/iPhone4/061-7938.20100908.F3rCk/iPhone2,1_4.1_8B117_Restore.ipsw';

ava('Zip URL', async (test) => {
  const zip = new PartialZip(url);

  await zip.init();

  const fileInfo = zip.files.get('BuildManifest.plist')!;

  test.falsy(fileInfo.extraField.zip64);

  test.is(fileInfo.uncompressedSize, 20175);

  const buf = await zip.get(fileInfo);

  const hash = createHash('sha1').update(buf);

  test.is(hash.digest('hex'), '08db0f1ab553457acfbd24b8c70de9867cc144df');
});

const eocd64Url = 'http://updates-http.cdn-apple.com/2020SpringFCS/fullrestores/001-09424/5B5CB4D4-A082-11EA-877A-87EDF1CFE6E8/iPhone11,8,iPhone12,1_13.5.1_17F80_Restore.ipsw';

ava('Zip64 EOCD64 URL', async (test) => {
  const zip = new PartialZip(eocd64Url);

  await zip.init();

  const fileInfo = zip.files.get('BuildManifest.plist')!;

  test.truthy(fileInfo.extraField.zip64);

  test.is(fileInfo.uncompressedSize, 0xffffffff);
  test.is(fileInfo.extraField.zip64!.uncompressedSize, BigInt(431450));

  const buf = await zip.get(fileInfo);

  const hash = createHash('sha1').update(buf);

  test.is(hash.digest('hex'), '68192b75bd113ff8f1249d9e4ca198c5c16f04f3');
});
