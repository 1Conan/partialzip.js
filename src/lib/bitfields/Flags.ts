// https://pkware.cachefly.net/webdocs/casestudies/APPNOTE.TXT
// 4.4.4 general purpose bit flag: (2 bytes)
import BitField from '../base/BitField';

export default class Flags extends BitField {
  get encrypted() {
    return !!this.getBit(0);
  }

  get utf8() {
    return !!this.getBit(11);
  }
}
