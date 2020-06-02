import BitField from '../base/BitField';

export default class InternalAttributes extends BitField {
  get binary() {
    return !!this.getBit(0);
  }

  get ascii() {
    return this.binary;
  }
}
