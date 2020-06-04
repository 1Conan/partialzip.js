import ava from 'ava';
import ExtraFields from '../src/lib/headers/ExtraField';

// prettier-ignore
const data = Buffer.from([
  0x01, 0x00, 0x18, 0x00, 0x14, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x14, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00,
]);

ava('Extra Fields', (test) => {
  const fields = new ExtraFields(data);

  test.truthy(fields.zip64);

  test.is(fields.zip64!.compressedSize, BigInt(20));
  test.is(fields.zip64!.uncompressedSize, BigInt(20));
  test.is(fields.zip64!.diskNo, 0);
  test.is(fields.zip64!.offset, BigInt(0));
});
