# PartialZip

Central Directory parsing stuff (mostly) taken from [yauzl](https://github.com/thejoshwolfe/yauzl)

---
Example Code:

```js
import partialZip from 'node-partialzip';
const pz = new partialZip({
  url: 'http://appldnld.apple.com/iOS6/Restore/041-7171.20120919.doJ1e/iPhone5,2_6.0_10A405_Restore.ipsw'
});

pz.init().then(async () => {
  console.log(pz.list()); // Map<string, IFileData>
  // String = filename

  const fileData = pz.files.get('BuildManifest.plist'); // IFileData
  pz.get(fileData) // Promise<Buffer>
})
```