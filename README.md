# PartialZip

A zip library that supports partially getting files from ZIP urls.

# Documentation
Documentation can be accessed [here](https://1conan.github.io/node-partialzip/docs/)

# Quick Start
```ts
import { PartialZip } from 'partialzip';

async function downloadFromZip(url: string, filename: string): Promise<Buffer> {
  const pz = new PartialZip({ url });
  await pz.init();
  return await pz.get(pz.files.get(filename))
}
```