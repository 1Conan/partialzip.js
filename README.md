# PartialZip [![npm version](https://badge.fury.io/js/partialzip.svg)](https://badge.fury.io/js/partialzip) [![Build Status](https://travis-ci.org/1Conan/partialzip.js.svg?branch=master)](https://travis-ci.org/1Conan/partialzip.js)
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2F1Conan%2Fpartialzip.js.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2F1Conan%2Fpartialzip.js?ref=badge_shield)

A zip library that supports partially getting files from ZIP urls.

# Documentation
Documentation can be accessed [here](https://1conan.github.io/partialzip.jss/)

# Quick Start
```ts
import { PartialZip } from 'partialzip';

async function downloadFromZip(url: string, filename: string): Promise<Buffer> {
  const pz = new PartialZip({ url });
  await pz.init();
  return await pz.get(pz.files.get(filename))
}
```

## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2F1Conan%2Fpartialzip.js.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2F1Conan%2Fpartialzip.js?ref=badge_large)