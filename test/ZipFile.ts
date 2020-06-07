import ava from 'ava';
import { join } from 'path';
import FileZip from '../src/lib/FileZip';
import CentralDirectoryEntry from '../src/lib/headers/CDEntry';

ava('Store Only Zip File', async (test) => {
  const zip = new FileZip(join(__dirname, './data/storeonly.zip'));

  await zip.init();

  // Get first file
  const fileInfo = zip.files.values().next().value as CentralDirectoryEntry;

  test.is(fileInfo.compressedSize, 20);
  test.is(fileInfo.uncompressedSize, 20);
  test.is(fileInfo.compression, 0);

  const file = await zip.get(fileInfo);

  test.is(file.toString(), 'this is a test file\n');
});

ava('DEFLATE Zip File', async (test) => {
  const zip = new FileZip(join(__dirname, './data/zip.zip'));

  await zip.init();

  // Get first file
  const fileInfo = zip.files.values().next().value as CentralDirectoryEntry;

  test.is(fileInfo.compressedSize, 24);
  test.is(fileInfo.uncompressedSize, 70);
  test.is(fileInfo.compression, 8);

  const file = await zip.get(fileInfo);

  test.is(
    file.toString(),
    'this is a test file\nAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA\n',
  );
});

ava('DEFLATE Zip64 File', async (test) => {
  const zip = new FileZip(join(__dirname, './data/zip64.zip'));

  await zip.init();

  // Get first file
  const fileInfo = zip.files.values().next().value as CentralDirectoryEntry;

  test.truthy(fileInfo.extraField.zip64);

  test.is(fileInfo.extraField.zip64!.compressedSize, BigInt(20));
  test.is(fileInfo.extraField.zip64!.compressedSize, BigInt(20));
  test.is(fileInfo.compression, 8);

  const file = await zip.get(fileInfo);

  test.is(file.toString(), 'this is a test file\n');
});
